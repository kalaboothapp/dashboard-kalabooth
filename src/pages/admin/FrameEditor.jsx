import React, { useState, useRef, useEffect } from 'react';
import { useAlert } from '../../context/AlertContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { createFrame, updateFrame } from '../../services/frames';
import { ArrowLeft, Save, Plus, X, Type } from 'lucide-react';
import { motion } from 'framer-motion';

const FrameEditor = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { state } = useLocation();
    const editingFrame = state?.frame;

    const [name, setName] = useState(editingFrame?.name || '');
    const [status, setStatus] = useState(editingFrame?.status || 'active');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editingFrame?.image_url || null);

    const [imageFileB, setImageFileB] = useState(null);
    const [imagePreviewB, setImagePreviewB] = useState(editingFrame?.layout_config?.images?.b || null);

    const [style, setStyle] = useState(editingFrame?.style || 'Custom');
    const [rarity, setRarity] = useState(editingFrame?.rarity || 'Common');
    const [artist, setArtist] = useState(editingFrame?.artist || 'Default');
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(editingFrame?.thumbnail_url || null);

    // Layout Config: Object { a: [], b: [] }
    // Backwards compatibility: if array, assign to 'a'
    const [layouts, setLayouts] = useState(() => {
        const config = editingFrame?.layout_config;
        if (Array.isArray(config)) return { a: config, b: [] };
        if (config && typeof config === 'object') return { a: config.a || [], b: config.b || [] };
        return { a: [], b: [] };
    });

    const [activeLayout, setActiveLayout] = useState('a'); // 'a' or 'b'
    const [selectedSlotId, setSelectedSlotId] = useState(null);

    // Derived state for current slots
    const photoSlots = layouts[activeLayout];

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Load image to get natural dimensions
    const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const preview = activeLayout === 'b' && imagePreviewB ? imagePreviewB : imagePreview;
        if (preview) {
            const img = new Image();
            img.onload = () => {
                setImgDimensions({ w: img.width, h: img.height });
            };
            img.src = preview;
        }
    }, [imagePreview, imagePreviewB, activeLayout]);

    const handleFileChange = (e, type = 'image') => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'image') {
                setImageFile(file);
                const reader = new FileReader();
                reader.onload = (f) => setImagePreview(f.target.result);
                reader.readAsDataURL(file);
            } else if (type === 'imageB') {
                setImageFileB(file);
                const reader = new FileReader();
                reader.onload = (f) => setImagePreviewB(f.target.result);
                reader.readAsDataURL(file);
            } else {
                setThumbnailFile(file);
                const reader = new FileReader();
                reader.onload = (f) => setThumbnailPreview(f.target.result);
                reader.readAsDataURL(file);
            }
        }
    };

    const updateLayouts = (newSlots) => {
        setLayouts(prev => ({
            ...prev,
            [activeLayout]: newSlots
        }));
    };

    const addSlot = () => {
        const newSlot = {
            id: Date.now(),
            x: 10,
            y: 10,
            width: 40,
            height: 30
        };
        updateLayouts([...photoSlots, newSlot]);
        setSelectedSlotId(newSlot.id);
    };

    const updateSlot = (id, updates) => {
        const newSlots = photoSlots.map(s => s.id === id ? { ...s, ...updates } : s);
        updateLayouts(newSlots);
    };

    const deleteSlot = (id) => {
        const newSlots = photoSlots.filter(s => s.id !== id);
        updateLayouts(newSlots);
        setSelectedSlotId(null);
    };

    const handleSave = async () => {
        if (!name || !imagePreview) return showAlert("Please provide name and system image.", "error");
        setUploading(true);

        try {
            const frameData = {
                name,
                status,
                style,
                rarity,
                artist,
                artist,
                layout_config: layouts, // Save the full layouts object { a: [...], b: [...] }
                file: imageFile,
                imageFileB: imageFileB, // Pass the second image file
                thumbnailFile: thumbnailFile,
                thumbnail_url: thumbnailPreview
            };

            if (editingFrame) {
                await updateFrame(editingFrame.id, frameData);
            } else {
                await createFrame(frameData);
            }

            showAlert("Frame Saved Successfully!", "success");
            navigate('/admin/frames');
        } catch (error) {
            console.error(error);
            showAlert("Error saving frame: " + error.message, "error");
        } finally {
            setUploading(false);
        }
    };

    // --- Interaction Logic (Naive Drag/Resize) ---
    // In a real app we'd use 'react-rnd' or similar. 
    // Implementing basic slider controls for the selected slot is safer and easier to implement correctly in a single file without deps.

    return (
        <div className="min-h-screen font-nunito p-4 md:p-8 text-white flex flex-col items-center relative overflow-hidden">

            {/* Animated Background Blob */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 40, 0]
                }}
                transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-game-primary/15 blur-[120px] rounded-full pointer-events-none"
            ></motion.div>

            <div className="w-full max-w-6xl flex items-center justify-between mb-8 z-10">
                <button onClick={() => navigate('/admin/frames')} className="flex items-center gap-2 text-gray-400 hover:text-white">
                    <ArrowLeft /> Cancel
                </button>
                <h1 className="text-3xl font-titan text-yellow-400">{editingFrame ? 'CALIBRATE FRAME' : 'NEW SCHEMATIC'}</h1>
                <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="bg-mario-green text-white px-6 py-2 rounded-lg font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
                >
                    {uploading ? 'UPLOADING...' : <><Save size={20} /> SAVE SYSTEM</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl z-10">

                {/* Controls Panel */}
                <div className="lg:col-span-1 bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-fit">
                    <h2 className="font-bold text-green-400 mb-4 border-b border-white/10 pb-2">FRAME DATA</h2>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">CODENAME</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/5 border border-gray-600 rounded p-2 text-white outline-none focus:border-yellow-400"
                                placeholder="e.g. Neon Cyber"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">STATUS</label>
                            <select
                                value={status} onChange={e => setStatus(e.target.value)}
                                className="w-full bg-white/5 border border-gray-600 rounded p-2 text-white outline-none"
                            >
                                <option value="active">ACTIVE</option>
                                <option value="coming_soon">COMING SOON</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">STYLE</label>
                                <input
                                    type="text"
                                    value={style}
                                    onChange={e => setStyle(e.target.value)}
                                    className="w-full bg-white/5 border border-gray-600 rounded p-2 text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">RARITY</label>
                                <select
                                    value={rarity} onChange={e => setRarity(e.target.value)}
                                    className="w-full bg-white/5 border border-gray-600 rounded p-2 text-white outline-none"
                                >
                                    <option value="Common">Common</option>
                                    <option value="Rare">Rare</option>
                                    <option value="Epic">Epic</option>
                                    <option value="Legendary">Legendary</option>
                                    <option value="Event">Event</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">ARTIST / LABEL</label>
                            <input
                                type="text"
                                value={artist}
                                onChange={e => setArtist(e.target.value)}
                                placeholder="e.g. Default, Pixenze Theme, Event"
                                className="w-full bg-white/5 border border-gray-600 rounded p-2 text-white outline-none focus:border-yellow-400"
                            />
                        </div>

                        {/* Image Uploads */}
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">
                                    FRAME IMAGE (LAYOUT {activeLayout.toUpperCase()})
                                </label>
                                {(activeLayout === 'a' ? imagePreview : imagePreviewB) && (
                                    <div className="mb-2 h-20 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                                        <img src={activeLayout === 'a' ? imagePreview : imagePreviewB} className="h-full object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    onChange={e => handleFileChange(e, activeLayout === 'a' ? 'image' : 'imageB')}
                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                                />
                                {activeLayout === 'b' && !imagePreviewB && imagePreview && (
                                    <p className="text-[10px] text-gray-500 mt-1 italic">
                                        *If not uploaded, Layout B will use Layout A's image.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">THUMBNAIL (OPTIONAL)</label>
                                {thumbnailPreview && (
                                    <div className="mb-2 h-20 w-20 bg-gray-800 rounded flex items-center justify-center overflow-hidden border border-gray-600">
                                        <img src={thumbnailPreview} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    onChange={e => handleFileChange(e, 'thumbnail')}
                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <h2 className="font-bold text-green-400">PHOTO SLOTS</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setActiveLayout('a'); setSelectedSlotId(null); }}
                                className={`px-3 py-1 text-xs rounded font-bold transition-colors ${activeLayout === 'a' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            >
                                LAYOUT A
                            </button>
                            <button
                                onClick={() => { setActiveLayout('b'); setSelectedSlotId(null); }}
                                className={`px-3 py-1 text-xs rounded font-bold transition-colors ${activeLayout === 'b' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            >
                                LAYOUT B
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end mb-4">
                        <button onClick={addSlot} className="bg-white/10 p-1.5 rounded hover:bg-white/20 text-xs flex items-center gap-1 w-full justify-center border border-dashed border-white/20 hover:border-yellow-400/50 transition-colors">
                            <Plus size={14} /> ADD SLOT TO LAYOUT {activeLayout.toUpperCase()}
                        </button>
                    </div>

                    {selectedSlotId ? (
                        <div className="bg-white/5 p-4 rounded border border-white/10 space-y-3">
                            <div className="flex justify-between text-xs text-yellow-400 font-bold">
                                <span>SLOT #{selectedSlotId}</span>
                                <button onClick={() => deleteSlot(selectedSlotId)} className="text-red-400 hover:underline">DELETE</button>
                            </div>

                            {/* Sliders for adjusting the selected slot */}
                            <div>
                                <label className="flex justify-between text-xs text-gray-400">POS X <span>{photoSlots.find(s => s.id === selectedSlotId).x}%</span></label>
                                <input type="range" min="0" max="100" value={photoSlots.find(s => s.id === selectedSlotId).x} onChange={e => updateSlot(selectedSlotId, { x: parseInt(e.target.value) })} className="w-full accent-yellow-400" />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs text-gray-400">POS Y <span>{photoSlots.find(s => s.id === selectedSlotId).y}%</span></label>
                                <input type="range" min="0" max="100" value={photoSlots.find(s => s.id === selectedSlotId).y} onChange={e => updateSlot(selectedSlotId, { y: parseInt(e.target.value) })} className="w-full accent-yellow-400" />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs text-gray-400">WIDTH <span>{photoSlots.find(s => s.id === selectedSlotId).width}%</span></label>
                                <input type="range" min="0" max="100" value={photoSlots.find(s => s.id === selectedSlotId).width} onChange={e => updateSlot(selectedSlotId, { width: parseInt(e.target.value) })} className="w-full accent-green-400" />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs text-gray-400">HEIGHT <span>{photoSlots.find(s => s.id === selectedSlotId).height}%</span></label>
                                <input type="range" min="0" max="100" value={photoSlots.find(s => s.id === selectedSlotId).height} onChange={e => updateSlot(selectedSlotId, { height: parseInt(e.target.value) })} className="w-full accent-green-400" />
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 italic">Select a slot on the image to calibrate.</p>
                    )}
                </div>

                {/* Preview / Work Area */}
                <div className="lg:col-span-2 bg-black/80 rounded-2xl border-4 border-gray-800 p-8 flex justify-center items-start overflow-auto">
                    {(activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview)) ? (
                        <div className="relative shadow-2xl" ref={containerRef} style={{ width: '400px' }}>
                            {/* The Frame Image */}
                            <img
                                src={activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview)}
                                className="w-full h-auto pointer-events-none select-none relative z-20"
                                alt={`Frame Layout ${activeLayout}`}
                            />

                            {/* The Slots Layer (Underneath Frame usually, but for editing we render ON TOP so user can see them, maybe semi-transparent) */}
                            {/* Wait, usually in photobooth, photos are BEHIND the frame. */}
                            {/* So the user should align these boxes to the HOLES in the frame. */}
                            {/* We will render them semi-transparent RED so they are visible ON TOP of the frame image for calibration */}

                            <div className="absolute inset-0 z-30">
                                {photoSlots.map(slot => (
                                    <div
                                        key={slot.id}
                                        onClick={() => setSelectedSlotId(slot.id)}
                                        style={{
                                            left: `${slot.x}%`,
                                            top: `${slot.y}%`,
                                            width: `${slot.width}%`,
                                            height: `${slot.height}%`,
                                        }}
                                        className={`absolute border-2 cursor-pointer transition-colors flex items-center justify-center ${selectedSlotId === slot.id ? 'bg-green-500/50 border-green-400' : 'bg-red-500/30 border-red-400/50 hover:bg-red-500/50'}`}
                                    >
                                        <span className="text-xs font-bold drop-shadow-md text-white">#{slot.id.toString().slice(-3)}</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center mt-20">
                            <span className="text-6xl mb-4">🖼️</span>
                            <p>UPLOAD BASE IMAGE TO BEGIN CALIBRATION</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FrameEditor;
