import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';
import { Upload, Trash2, Plus, Zap, Loader, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCubeLUT, createLUTTexture, createFilterProgram, createQuadValues } from '../../utils/lutUtils';

const FilterManager = () => {
    const { showAlert } = useAlert();
    const [filters, setFilters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Preview Generation Canvas
    const canvasRef = useRef(null);
    const glRef = useRef(null);

    useEffect(() => {
        fetchFilters();
        initWebGL();
    }, []);

    const initWebGL = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
        if (!gl) {
            console.error("WebGL2 not supported for preview generation");
            return;
        }
        glRef.current = gl;
    };

    const fetchFilters = async () => {
        try {
            const { data, error } = await supabase
                .from('luts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFilters(data || []);
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = [...e.dataTransfer.files];
        if (files.length > 0) handleFileUpload(files[0]);
    };

    const handleFileUpload = async (file) => {
        if (!file.name.endsWith('.cube')) {
            showAlert('Please upload a .cube file', 'error');
            return;
        }

        setUploading(true);
        try {
            // 1. Read file
            const text = await file.text();

            // 2. Generate Thumbnail (Client-side WebGL)
            const thumbnailBlob = await generateThumbnail(text);

            // 3. Upload .cube to Storage
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('luts')
                .upload(fileName, file);
            if (uploadError) throw uploadError;

            // 4. Upload Thumbnail to Storage
            const thumbName = `thumb_${fileName}.jpg`;
            const { error: thumbError } = await supabase.storage
                .from('luts')
                .upload(thumbName, thumbnailBlob);
            if (thumbError) throw thumbError;

            // 5. Get Public URLs
            const { data: { publicUrl: storagePath } } = supabase.storage.from('luts').getPublicUrl(fileName);
            const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from('luts').getPublicUrl(thumbName);

            // 6. Save to DB
            const { error: dbError } = await supabase.from('luts').insert({
                name: file.name.replace('.cube', ''),
                storage_path: storagePath, // Use public URL or path depending on your preference. Public URL is easier.
                thumbnail_url: thumbnailUrl,
                is_active: true
            });

            if (dbError) throw dbError;

            showAlert('Filter uploaded successfully!', 'success');
            fetchFilters();
        } catch (error) {
            console.error(error);
            showAlert('Failed to upload filter: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const generateThumbnail = async (lutText) => {
        return new Promise((resolve) => {
            const gl = glRef.current;
            const canvas = canvasRef.current;
            if (!gl || !canvas) {
                resolve(null); // Fallback if no WebGL
                return;
            }

            // Load a default base image for preview
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            // Use a base64 placeholder or fetch a public asset
            img.src = 'https://images.unsplash.com/photo-1544377855-48b2d2db7c30?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80';

            img.onload = () => {
                // Resize canvas
                canvas.width = 300;
                canvas.height = 300;
                gl.viewport(0, 0, 300, 300);

                // Parse LUT
                const { size, data } = parseCubeLUT(lutText);

                // Create Texture for Image
                const imgTexture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, imgTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

                // Create Texture for LUT
                const lutTexture = createLUTTexture(gl, { size, data });

                // Create Shader
                const program = createFilterProgram(gl);
                gl.useProgram(program);

                // Setup geometry
                const { vao, count } = createQuadValues(gl);
                gl.bindVertexArray(vao);

                // Uniforms
                const uImage = gl.getUniformLocation(program, 'u_image');
                const uLut = gl.getUniformLocation(program, 'u_lut');
                const uIntensity = gl.getUniformLocation(program, 'u_intensity');
                const uUseLUT = gl.getUniformLocation(program, 'u_useLUT');

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, imgTexture);
                gl.uniform1i(uImage, 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_3D, lutTexture);
                gl.uniform1i(uLut, 1);

                gl.uniform1f(uIntensity, 1.0);
                gl.uniform1i(uUseLUT, 1);

                // Draw
                gl.drawArrays(gl.TRIANGLES, 0, count);

                // Convert to Blob
                canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);

                // Cleanup
                gl.deleteTexture(imgTexture);
                gl.deleteTexture(lutTexture);
                gl.deleteProgram(program);
            };

            img.onerror = () => resolve(null);
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this filter?')) return;
        try {
            const { error } = await supabase.from('luts').delete().eq('id', id);
            if (error) throw error;
            setFilters(prev => prev.filter(f => f.id !== id));
            showAlert('Filter deleted', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('luts')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            if (error) throw error;

            setFilters(prev => prev.map(f =>
                f.id === id ? { ...f, is_active: !currentStatus } : f
            ));
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-titan text-white drop-shadow-lg flex items-center gap-3">
                        <Zap className="text-game-secondary" size={32} />
                        FILTER MANAGER
                    </h1>
                    <p className="text-gray-400 mt-2">Upload and manage .cube LUT filters for the photobooth.</p>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className={`border-4 border-dashed rounded-3xl p-10 text-center transition-all ${dragActive ? 'border-game-secondary bg-white/10 scale-[1.02]' : 'border-white/20 bg-black/20'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="animate-spin text-game-secondary" size={48} />
                        <p className="text-xl font-bold animate-pulse">Generating preview & uploading...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-game-primary/20 flex items-center justify-center mb-2">
                            <Upload size={40} className="text-game-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Drag & Drop .cube file here</h3>
                        <p className="text-gray-400">or</p>
                        <label className="px-8 py-3 bg-game-primary text-white font-bold rounded-xl cursor-pointer hover:bg-white hover:text-game-primary transition shadow-game">
                            BROWSE FILES
                            <input type="file" accept=".cube" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                        </label>
                    </div>
                )}
            </div>

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Filter List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader className="animate-spin" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filters.map((filter) => (
                        <div key={filter.id} className={`bg-black/40 border-4 rounded-xl overflow-hidden transition-all group ${!filter.is_active ? 'opacity-60 grayscale' : 'border-black hover:border-game-secondary'}`}>
                            {/* Preview Image */}
                            <div className="aspect-square bg-black relative">
                                {filter.thumbnail_url ? (
                                    <img src={filter.thumbnail_url} alt={filter.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(filter.id)}
                                        className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:scale-110 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-white truncate mb-2">{filter.name}</h3>
                                <button
                                    onClick={() => handleToggleActive(filter.id, filter.is_active)}
                                    className={`w-full py-2 rounded-lg font-bold text-sm border-2 ${filter.is_active
                                            ? 'bg-game-success text-black border-black shadow-[2px_2px_0_#000]'
                                            : 'bg-transparent text-gray-400 border-gray-600 hover:bg-white/10'
                                        }`}
                                >
                                    {filter.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FilterManager;
