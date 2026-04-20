import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';
import { 
    UploadIcon, 
    TrashIcon, 
    MixIcon, 
    MagicWandIcon, 
    UpdateIcon,
    CheckCircledIcon,
    CrossCircledIcon,
    ShadowIcon
} from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { uploadToGitHub } from '../../lib/github';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

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
            let storagePath;

            if (import.meta.env.VITE_GITHUB_TOKEN) {
                storagePath = await uploadToGitHub(file, 'luts');
            } else {
                const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const { error: uploadError } = await supabase.storage
                    .from('luts')
                    .upload(fileName, file, { cacheControl: '31536000' });
                if (uploadError) throw uploadError;

                const { data: publicUrlData1 } = supabase.storage.from('luts').getPublicUrl(fileName);
                storagePath = publicUrlData1.publicUrl;
            }

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
            showAlert(`Filter ${!currentStatus ? 'enabled' : 'disabled'}`, 'success');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Filter Library</h1>
                    <p className="text-slate-500 font-bold mt-2">Upload and curate custom .cube LUT filters to define your booth's look.</p>
                </div>
                <Badge variant="secondary" className="px-5 py-2 text-xs">
                    <MixIcon className="mr-2" /> {filters.length} FILTERS READY
                </Badge>
            </div>

            {/* Upload Zone */}
            <motion.div
                layout
                className={cn(
                    "relative group bg-white rounded-[2.5rem] p-1 border-2 transition-all duration-500",
                    dragActive 
                        ? 'border-kala-red shadow-2xl shadow-kala-red/10 scale-[1.01]' 
                        : 'border-slate-50 shadow-xl hover:border-slate-200'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="rounded-[2.2rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-12 text-center transition-colors group-hover:bg-slate-50">
                    {uploading ? (
                        <div className="flex flex-col items-center gap-6 py-6">
                            <div className="relative">
                                <ShadowIcon className="animate-spin text-kala-red" width={64} height={64} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MagicWandIcon width={24} height={24} className="text-kala-red/40 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-slate-900">Processing Magic...</p>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Syncing LUT to Cloud Collection</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                <UploadIcon width={36} height={36} className="text-kala-red" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Drop your .cube files here</h3>
                                <p className="text-slate-500 font-bold mt-2 max-w-sm mx-auto">
                                    Upload your custom LUTs to define cinematic looks for your event gallery.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <label>
                                    <Button asChild variant="kala" className="cursor-pointer">
                                        <span>
                                            <UploadIcon className="mr-2" /> Browse Library
                                            <input type="file" accept=".cube" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                                        </span>
                                    </Button>
                                </label>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or drag them in</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Filter List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                    <UpdateIcon className="animate-spin text-kala-red" width={32} height={32} />
                    <p className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing Presets...</p>
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
                                className="group"
                            >
                                <Card className={cn(
                                    "flex flex-col p-4 h-full relative overflow-hidden transition-all duration-500",
                                    !filter.is_active ? 'opacity-60 bg-slate-50/50 grayscale-[0.5]' : ''
                                )}>
                                    {/* Icon Representative - Modern Abstract look */}
                                    <div className="aspect-video bg-slate-100/50 relative rounded-[1.5rem] border border-slate-100 flex items-center justify-center group-hover:bg-white transition-colors duration-500 overflow-hidden">
                                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                                            <MagicWandIcon className="absolute -bottom-6 -right-6" width={120} height={120} />
                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-kala-red group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 relative z-10">
                                            <MagicWandIcon width={28} height={28} />
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl shadow-lg"
                                                onClick={() => handleDelete(filter.id)}
                                            >
                                                <TrashIcon />
                                            </Button>
                                        </div>

                                        {!filter.is_active && (
                                            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center z-30">
                                                <Badge variant="secondary" className="bg-white/90 border-none px-3 text-[9px] shadow-lg">Inhibitted</Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="pt-6 pb-2 px-1 flex flex-col flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-6">
                                            <h3 className="font-black text-slate-900 leading-tight truncate flex-1" title={filter.name}>
                                                {filter.name}
                                            </h3>
                                            {filter.is_active ? (
                                                <CheckCircledIcon className="text-emerald-500 shrink-0 mt-0.5" width={18} height={18} />
                                            ) : (
                                                <CrossCircledIcon className="text-slate-300 shrink-0 mt-0.5" width={18} height={18} />
                                            )}
                                        </div>
                                        
                                        <Button
                                            onClick={() => handleToggleActive(filter.id, filter.is_active)}
                                            variant={filter.is_active ? "kala" : "outline"}
                                            className="mt-auto w-full text-[10px] uppercase font-black tracking-widest"
                                        >
                                            {filter.is_active ? 'ENABLED' : 'DISABLED'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {filters.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center gap-4">
                            <MixIcon className="text-slate-200" width={64} height={64} />
                            <div>
                                <p className="font-black text-slate-800 uppercase tracking-widest text-sm">No filters in your collection</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Start by dragging a .cube file above.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterManager;

