import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';
import * as Icons from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToGitHub } from '../../lib/github';

const FilterManager = () => {
    const { showAlert } = useAlert();
    const [filters, setFilters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchFilters();
    }, []);

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

            let storagePath, thumbnailUrl;

            if (import.meta.env.VITE_GITHUB_TOKEN) {
                // 3 & 4. Upload to GitHub instead
                storagePath = await uploadToGitHub(file, 'luts');
            } else {
                // 3. Upload .cube to Storage
                const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const { error: uploadError } = await supabase.storage
                    .from('luts')
                    .upload(fileName, file, { cacheControl: '31536000' });
                if (uploadError) throw uploadError;

                // 4. Get Public URL
                const { data: publicUrlData1 } = supabase.storage.from('luts').getPublicUrl(fileName);
                storagePath = publicUrlData1.publicUrl;
            }

            // 6. Save to DB
            const { error: dbError } = await supabase.from('luts').insert({
                name: file.name.replace('.cube', ''),
                storage_path: storagePath,
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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Filter Library</h1>
                    <p className="text-slate-500 font-medium mt-2">Upload and curate custom .cube LUT filters to define your booth's look.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                    <Icons.Image size={14} weight="duotone" className="text-indigo-500" />
                    {filters.length} FILTERS READY
                </div>
            </div>

            {/* Upload Zone - Hand-Crafted "Island" */}
            <div
                className={`relative group bg-white rounded-[40px] p-1 border-2 transition-all duration-500 ${dragActive 
                    ? 'border-indigo-400 shadow-2xl shadow-indigo-500/10 scale-[1.01]' 
                    : 'border-slate-50 shadow-depth hover:border-indigo-200'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="rounded-[36px] border-2 border-dashed border-slate-100 bg-slate-50/30 p-12 text-center transition-colors group-hover:bg-indigo-50/10">
                    {uploading ? (
                        <div className="flex flex-col items-center gap-6 py-6">
                            <div className="relative">
                                <Icons.CircleNotch className="animate-spin text-indigo-600" size={64} weight="bold" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Icons.Lightning size={24} weight="fill" className="text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-extrabold text-slate-800">Processing Magic...</p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Optimizing & syncing to cloud</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-[32px] bg-white shadow-depth flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                <Icons.UploadSimple size={36} weight="duotone" className="text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Drop your .cube files here</h3>
                                <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">
                                    Upload your custom LUTs to define cinematic looks for your event gallery.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <label className="btn-pix-primary cursor-pointer">
                                    Browse Library
                                    <input type="file" accept=".cube" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                                </label>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or drag them in</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Filter List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                    <Icons.CircleNotch className="animate-spin text-indigo-400" size={32} weight="bold" />
                    <p className="font-bold text-sm uppercase tracking-widest">Loading Filter Core...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filters.map((filter) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={filter.id} 
                                className={`card-premium group flex flex-col group p-3 ${!filter.is_active ? 'opacity-70 bg-slate-50/50' : ''}`}
                            >
                                {/* Icon Representative - Modern Abstract look */}
                                <div className="aspect-video bg-slate-50 relative rounded-[28px] border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors duration-500 overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                        <Icons.Sparkle size={120} weight="fill" className="absolute -bottom-4 -right-4" />
                                    </div>

                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 relative z-10">
                                        <Icons.Sparkle size={28} weight="duotone" />
                                    </div>
                                    
                                    {/* Glass Overlay Actions */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                        <button
                                            onClick={() => handleDelete(filter.id)}
                                            className="w-9 h-9 bg-white/90 backdrop-blur-md text-rose-500 rounded-xl shadow-depth flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                            title="Delete Filter"
                                        >
                                            <Icons.Trash size={16} weight="duotone" />
                                        </button>
                                    </div>

                                    {!filter.is_active && (
                                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-30">
                                            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Hidden</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info - Human-made spacing */}
                                <div className="px-3 pt-6 pb-2 flex flex-col flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-4">
                                        <h3 className="font-extrabold text-slate-900 leading-tight truncate flex-1" title={filter.name}>
                                            {filter.name}
                                        </h3>
                                        {filter.is_active && <Icons.Sparkle size={16} weight="duotone" className="text-indigo-400" />}
                                    </div>
                                    
                                    <button
                                        onClick={() => handleToggleActive(filter.id, filter.is_active)}
                                        className={`mt-auto w-full py-3 rounded-2xl font-bold text-[11px] tracking-wider transition-all active:scale-95 ${filter.is_active
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                            : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        {filter.is_active ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {filters.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-100 rounded-[40px]">
                            <Icons.Image className="mx-auto mb-4 text-slate-200" size={64} weight="duotone" />
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">No filters in your collection</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterManager;
