import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAlert } from '../../context/AlertContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { createFrame, updateFrame } from '../../services/frames';
import * as Icons from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { detectSlots } from '../../utils/slotDetector';

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

    const [themeId, setThemeId] = useState(editingFrame?.theme_id || 'default');
    const [frameAudioUrl, setFrameAudioUrl] = useState(editingFrame?.audio_url || '');
    const [animationType, setAnimationType] = useState(editingFrame?.animation_type || 'none');

    // External URL State — Layout A (for jsDelivr CDN)
    const isExistingExternalUrl = editingFrame?.image_url && !editingFrame.image_url.includes('supabase.co');
    const [useExternalUrl, setUseExternalUrl] = useState(isExistingExternalUrl || false);
    const [externalUrl, setExternalUrl] = useState(isExistingExternalUrl ? editingFrame.image_url : '');

    // External URL State — Layout B
    const existingBImage = editingFrame?.layout_config?.images?.b;
    const isExistingExternalUrlB = existingBImage && !existingBImage.includes('supabase.co');
    const [useExternalUrlB, setUseExternalUrlB] = useState(isExistingExternalUrlB || false);
    const [externalUrlB, setExternalUrlB] = useState(isExistingExternalUrlB ? existingBImage : '');

    // Layout Config: Object { a: [], b: [] }
    const [layouts, setLayouts] = useState(() => {
        const config = editingFrame?.layout_config;
        if (Array.isArray(config)) return { a: config, b: [] };
        if (config && typeof config === 'object') return { a: config.a || [], b: config.b || [] };
        return { a: [], b: [] };
    });

    const [activeLayout, setActiveLayout] = useState('a');
    const [activeTab, setActiveTab] = useState('metadata'); // 'metadata' or 'slots'
    const [selectedSlotId, setSelectedSlotId] = useState(null);

    const photoSlots = layouts[activeLayout];

    const containerRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [detecting, setDetecting] = useState(false);

    // Drag state
    const dragState = useRef({
        active: false,
        type: null, // 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
        slotId: null,
        startMouseX: 0,
        startMouseY: 0,
        startSlot: null, // { x, y, width, height }
    });

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

    const updateLayouts = useCallback((newSlots) => {
        setLayouts(prev => ({
            ...prev,
            [activeLayout]: newSlots
        }));
    }, [activeLayout]);

    const addSlot = () => {
        const newSlot = {
            id: Date.now(),
            x: 10,
            y: 10 + photoSlots.length * 25,
            width: 40,
            height: 20
        };
        updateLayouts([...photoSlots, newSlot]);
        setSelectedSlotId(newSlot.id);
    };

    const updateSlot = useCallback((id, updates) => {
        setLayouts(prev => ({
            ...prev,
            [activeLayout]: prev[activeLayout].map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    }, [activeLayout]);

    const deleteSlot = (id) => {
        updateLayouts(photoSlots.filter(s => s.id !== id));
        setSelectedSlotId(null);
    };

    // --- DRAG & RESIZE LOGIC ---
    const getContainerRect = () => {
        if (!containerRef.current) return null;
        return containerRef.current.getBoundingClientRect();
    };

    const handlePointerDown = (e, slotId, type = 'move') => {
        e.preventDefault();
        e.stopPropagation();

        const slot = photoSlots.find(s => s.id === slotId);
        if (!slot) return;

        setSelectedSlotId(slotId);

        dragState.current = {
            active: true,
            type,
            slotId,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startSlot: { ...slot }
        };

        // Capture pointer for smooth dragging even outside element
        e.target.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = useCallback((e) => {
        const ds = dragState.current;
        if (!ds.active) return;

        const rect = getContainerRect();
        if (!rect) return;

        const deltaXPct = ((e.clientX - ds.startMouseX) / rect.width) * 100;
        const deltaYPct = ((e.clientY - ds.startMouseY) / rect.height) * 100;

        const { startSlot, type, slotId } = ds;

        let updates = {};

        if (type === 'move') {
            updates = {
                x: Number(Math.max(0, Math.min(100 - startSlot.width, startSlot.x + deltaXPct)).toFixed(2)),
                y: Number(Math.max(0, Math.min(100 - startSlot.height, startSlot.y + deltaYPct)).toFixed(2))
            };
        } else if (type === 'resize-br') {
            updates = {
                width: Number(Math.max(0.1, Math.min(100 - startSlot.x, startSlot.width + deltaXPct)).toFixed(2)),
                height: Number(Math.max(0.1, Math.min(100 - startSlot.y, startSlot.height + deltaYPct)).toFixed(2))
            };
        } else if (type === 'resize-bl') {
            const newW = Math.max(0.1, startSlot.width - deltaXPct);
            updates = {
                x: Number(Math.max(0, startSlot.x + startSlot.width - newW).toFixed(2)),
                width: Number(newW.toFixed(2)),
                height: Number(Math.max(0.1, Math.min(100 - startSlot.y, startSlot.height + deltaYPct)).toFixed(2))
            };
        } else if (type === 'resize-tr') {
            const newH = Math.max(0.1, startSlot.height - deltaYPct);
            updates = {
                y: Number(Math.max(0, startSlot.y + startSlot.height - newH).toFixed(2)),
                width: Number(Math.max(0.1, Math.min(100 - startSlot.x, startSlot.width + deltaXPct)).toFixed(2)),
                height: Number(newH.toFixed(2))
            };
        } else if (type === 'resize-tl') {
            const newW = Math.max(0.1, startSlot.width - deltaXPct);
            const newH = Math.max(0.1, startSlot.height - deltaYPct);
            updates = {
                x: Number(Math.max(0, startSlot.x + startSlot.width - newW).toFixed(2)),
                y: Number(Math.max(0, startSlot.y + startSlot.height - newH).toFixed(2)),
                width: Number(newW.toFixed(2)),
                height: Number(newH.toFixed(2))
            };
        }

        updateSlot(slotId, updates);
    }, [updateSlot]);

    const handlePointerUp = useCallback(() => {
        dragState.current.active = false;
    }, []);

    // Attach global listeners for drag
    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [handlePointerMove, handlePointerUp]);

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
                layout_config: layouts,
                file: imageFile,
                imageFileB: imageFileB,
                thumbnailFile: thumbnailFile,
                thumbnail_url: thumbnailPreview,
                externalImage: (useExternalUrl && externalUrl.trim()) ? externalUrl.trim() : null,
                externalImageB: (useExternalUrlB && externalUrlB.trim()) ? externalUrlB.trim() : null,
                theme_id: themeId,
                audio_url: frameAudioUrl.trim() || null,
                animation_type: animationType
            };

            if (editingFrame) {
                await updateFrame(editingFrame.id, frameData);
            } else {
                await createFrame(frameData);
            }

            showAlert("Frame Saved Successfully!", "success");
            navigate('/');
        } catch (error) {
            console.error(error);
            showAlert("Error saving frame: " + error.message, "error");
        } finally {
            setUploading(false);
        }
    };

    const selectedSlot = photoSlots.find(s => s.id === selectedSlotId);

    // Resize handle component
    const ResizeHandle = ({ slotId, position }) => {
        const cursorMap = {
            'resize-tl': 'nwse-resize',
            'resize-tr': 'nesw-resize',
            'resize-bl': 'nesw-resize',
            'resize-br': 'nwse-resize'
        };
        const posMap = {
            'resize-tl': '-top-1.5 -left-1.5',
            'resize-tr': '-top-1.5 -right-1.5',
            'resize-bl': '-bottom-1.5 -left-1.5',
            'resize-br': '-bottom-1.5 -right-1.5'
        };

        return (
            <div
                onPointerDown={(e) => handlePointerDown(e, slotId, position)}
                className={`absolute ${posMap[position]} w-3 h-3 bg-white border-2 border-yellow-400 rounded-sm z-50 shadow-md hover:scale-125 transition-transform`}
                style={{ cursor: cursorMap[position], touchAction: 'none' }}
            />
        );
    };

    return (
        <div className="min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-5rem)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Studio Header */}
            <div className="shrink-0 flex items-center justify-between bg-white/80 backdrop-blur-xl p-5 rounded-[32px] border border-white shadow-depth relative z-50">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <Icons.ArrowLeft size={20} weight="bold" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingFrame ? 'Frame Studio' : 'New Creation'}
                            </h1>
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">
                                Editor v2.0
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {name || 'Untitled Artboard'} • {activeLayout.toUpperCase()} Calibration
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={uploading}
                        className="btn-pix-primary min-w-[140px]"
                    >
                        {uploading ? (
                            <Icons.CircleNotch className="animate-spin" size={18} weight="bold" />
                        ) : (
                            <><Icons.FloppyDisk size={18} weight="duotone" /> Push to Booth</>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Controls - Left Side */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
                    {/* Tab Navigation - Hand-crafted floating island */}
                    <div className="bg-white p-2 rounded-3xl border border-slate-50 shadow-depth flex gap-1">
                        <button
                            onClick={() => setActiveTab('metadata')}
                            className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'metadata' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icons.Sparkle size={16} weight="duotone" /> Identity
                        </button>
                        <button
                            onClick={() => setActiveTab('slots')}
                            className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'slots' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icons.ArrowsOut size={16} weight="duotone" /> Calibration
                        </button>
                    </div>

                    {/* Active Tab Panel */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {activeTab === 'metadata' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {/* Core Identity Card */}
                                <div className="card-premium p-6 space-y-5">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em]">Core Identity</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black"
                                                placeholder="Enter artwork title..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                                <select
                                                    value={status} onChange={e => setStatus(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black appearance-none"
                                                >
                                                    <option value="active">Live Now</option>
                                                    <option value="coming_soon">Coming Soon</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rarity</label>
                                                <select
                                                    value={rarity} onChange={e => setRarity(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black appearance-none"
                                                >
                                                    <option value="Common">Common</option>
                                                    <option value="Rare">Rare</option>
                                                    <option value="Epic">Epic</option>
                                                    <option value="Legendary">Legendary</option>
                                                    <option value="Event">Event</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Creative Context Card */}
                                <div className="card-premium p-6 space-y-5">
                                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] pb-4 border-b border-slate-50">Creative Context</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Art & Asset Theme</label>
                                            <select
                                                value={themeId}
                                                onChange={e => setThemeId(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black appearance-none"
                                            >
                                                <option value="default">Global Theme</option>
                                                <option value="valentine">💖 Pixenze Pink</option>
                                                <option value="mu">⚽ Stadium Red</option>
                                                <option value="space">🌌 Deep Space</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Style Label</label>
                                                <input
                                                    type="text"
                                                    value={style}
                                                    onChange={e => setStyle(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black"
                                                    placeholder="Retro, Modern..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Artist</label>
                                                <input
                                                    type="text"
                                                    value={artist}
                                                    onChange={e => setArtist(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black"
                                                    placeholder="Pixenze Team"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Background Atmosphere Audio (URL)</label>
                                            <div className="relative">
                                                <Icons.MusicNotes size={16} weight="duotone" className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="text"
                                                    value={frameAudioUrl}
                                                    onChange={e => setFrameAudioUrl(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl pl-12 pr-5 py-3.5 text-slate-800 outline-none transition-all font-black"
                                                    placeholder="YouTube / Spotify link..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Atmosphere Animation</label>
                                            <select
                                                value={animationType}
                                                onChange={e => setAnimationType(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black appearance-none"
                                            >
                                                <option value="none">Freeze-frame</option>
                                                <option value="confetti">Magic Confetti</option>
                                                <option value="hearts">Floating Hearts</option>
                                                <option value="sparkles">Golden Pixels</option>
                                                <option value="snow">Winter Chill</option>
                                                <option value="fireworks">Grand Finale</option>
                                            </select>
                                        </div>

                                    </div>
                                </div>

                                {/* Media Assets Card */}
                                <div className="card-premium p-6 space-y-5">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em]">Media Engine</h3>
                                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1">
                                            <button
                                                onClick={() => setActiveLayout('a')}
                                                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeLayout === 'a' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                            >
                                                A
                                            </button>
                                            <button
                                                onClick={() => setActiveLayout('b')}
                                                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeLayout === 'b' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                            >
                                                B
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group/upload">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Artwork ({activeLayout.toUpperCase()})</label>
                                                <button
                                                    onClick={() => {
                                                        if (activeLayout === 'a') setUseExternalUrl(!useExternalUrl);
                                                        else setUseExternalUrlB(!useExternalUrlB);
                                                    }}
                                                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                                                >
                                                    {(activeLayout === 'a' ? useExternalUrl : useExternalUrlB) ? 'Switch to Upload' : 'Use External URL'}
                                                </button>
                                            </div>

                                            {(activeLayout === 'a' ? useExternalUrl : useExternalUrlB) ? (
                                                <input
                                                    type="text"
                                                    value={activeLayout === 'a' ? externalUrl : externalUrlB}
                                                    onChange={(e) => {
                                                        if (activeLayout === 'a') { setExternalUrl(e.target.value); setImagePreview(e.target.value); }
                                                        else { setExternalUrlB(e.target.value); setImagePreviewB(e.target.value); }
                                                    }}
                                                    placeholder="https://cdn.pixenze.com/assets/frame.png"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-3.5 text-slate-800 outline-none transition-all font-black text-sm"
                                                />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        onChange={e => handleFileChange(e, activeLayout === 'a' ? 'image' : 'imageB')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 group-hover/upload:border-indigo-300 transition-all">
                                                        <Icons.UploadSimple size={20} weight="duotone" className="text-slate-300 group-hover/upload:text-indigo-400 transition-all" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload Frame {activeLayout.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative group/thumb">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Studio Thumbnail</label>
                                            <div className="flex gap-4 items-center">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {thumbnailPreview ? (
                                                        <img src={thumbnailPreview} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Icons.Image size={20} weight="duotone" className="text-slate-200" />
                                                    )}
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="file"
                                                        onChange={e => handleFileChange(e, 'thumbnail')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 flex flex-col items-center justify-center gap-1 group-hover/thumb:border-indigo-300 transition-all">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Replace Art</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PNG / WEBP / JPG</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Auto-Detection Dashboard */}
                                <div className="card-premium p-6 space-y-6">
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-1 shadow-inner">
                                        <button
                                            onClick={() => { setActiveLayout('a'); setSelectedSlotId(null); }}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeLayout === 'a' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Layout A
                                        </button>
                                        <button
                                            onClick={() => { setActiveLayout('b'); setSelectedSlotId(null); }}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeLayout === 'b' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Layout B
                                        </button>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            const currentPreview = activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview);
                                            if (!currentPreview) return showAlert('Upload a frame image first!', 'error');
                                            setDetecting(true);
                                            try {
                                                const slots = await detectSlots(currentPreview);
                                                if (slots.length === 0) {
                                                    showAlert('Alpha scan complete: No transparent zones found.', 'error');
                                                } else {
                                                    updateLayouts(slots);
                                                    setSelectedSlotId(null);
                                                    showAlert(`AI successfully mapped ${slots.length} photo zones!`, 'success');
                                                }
                                            } catch (err) {
                                                showAlert('Detection error: ' + err.message, 'error');
                                            } finally {
                                                setDetecting(false);
                                            }
                                        }}
                                        disabled={detecting}
                                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 border-2 transition-all shadow-xl ${detecting ? 'bg-indigo-50 border-indigo-100 text-indigo-400 cursor-wait' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 active:scale-95'}`}
                                    >
                                        {detecting ? (
                                            <><Icons.CircleNotch className="animate-spin" size={18} weight="bold" /> Scanning Pixels...</>
                                        ) : (
                                            <><Icons.Sparkle size={18} weight="duotone" /> AI Alpha Scanner</>
                                        )}
                                    </button>

                                    <button 
                                        onClick={addSlot} 
                                        className="w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Icons.Plus size={16} weight="bold" /> Insert Photo Slot
                                    </button>
                                </div>

                                {/* Slot Coordinates - Depth Cards */}
                                <div className="space-y-4">
                                    {photoSlots.length === 0 ? (
                                        <div className="card-premium p-10 text-center border-dashed border-2 border-slate-100 bg-white/40">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-50">
                                                <Icons.Target size={24} weight="duotone" className="text-slate-300" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No zones defined</p>
                                        </div>
                                    ) : (
                                        photoSlots.map((slot, idx) => (
                                            <motion.div
                                                layout
                                                key={slot.id}
                                                onClick={() => setSelectedSlotId(slot.id)}
                                                className={`card-premium p-5 cursor-pointer relative transition-all duration-300 ${selectedSlotId === slot.id ? 'ring-2 ring-indigo-500 ring-offset-4 shadow-2xl bg-white' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black border transition-colors ${selectedSlotId === slot.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Photo Zone</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                    >
                                                        <Icons.Trash size={16} weight="duotone" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Left', key: 'x', icon: '←' },
                                                        { label: 'Top', key: 'y', icon: '↑' },
                                                        { label: 'Width', key: 'width', icon: '↔' },
                                                        { label: 'Height', key: 'height', icon: '↕' }
                                                    ].map(({ label, key, icon }) => (
                                                        <div key={key}>
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1.5 flex items-center justify-between">
                                                                {label} <span className="text-[8px] opacity-40">{icon}</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                step="0.01"
                                                                value={slot[key]}
                                                                onChange={(e) => updateSlot(slot.id, { [key]: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                                                                className={`w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-2 py-2 text-xs text-center font-black outline-none transition-all ${selectedSlotId === slot.id ? 'bg-indigo-50/30' : ''}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Studio Canvas - Center/Right */}
                <div 
                    className="lg:col-span-8 bg-slate-50 rounded-[40px] border-4 border-white shadow-depth relative overflow-hidden flex flex-col min-h-[500px]"
                    onClick={() => setSelectedSlotId(null)}
                >
                    {/* Artboard Meta Overlay */}
                    <div className="absolute top-8 left-8 z-40 pointer-events-none flex flex-col gap-2">
                        <div className="bg-slate-900/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Studio Workspace Live</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/40">
                                <Icons.Image size={12} weight="duotone" className="text-slate-500" />
                                <span className="text-[9px] font-black text-slate-700">600 DPI</span>
                            </div>
                            <div className="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/40">
                                <Icons.Confetti size={12} weight="duotone" className="text-amber-500" />
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{animationType === 'none' ? 'Static' : animationType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 relative overflow-auto custom-scrollbar flex items-center justify-center p-12">
                        {/* Workbench Background Pattern */}
                        <div className="absolute inset-0 pattern-dots text-slate-200 z-0" style={{ backgroundSize: '24px 24px', backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)' }} />

                        {(activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview)) ? (
                            <div
                                className="relative shadow-2xl select-none mx-auto z-10 w-full animate-in zoom-in duration-500 group"
                                ref={containerRef}
                                style={{ maxWidth: '440px' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Professional Frame Mounting */}
                                <div className="absolute -inset-4 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/60 -z-10 shadow-xl" />
                                
                                {/* Frame Image */}
                                <img
                                    src={activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview)}
                                    className="w-full h-auto pointer-events-none select-none relative z-20 block rounded-sm shadow-sm"
                                    alt={`Current Working Layout`}
                                    draggable={false}
                                />

                                {/* Interactive Slots Layer */}
                                <div className="absolute inset-0 z-30 pointer-events-none">
                                    {photoSlots.map((slot, idx) => {
                                        const isSelected = selectedSlotId === slot.id;
                                        return (
                                            <div
                                                key={slot.id}
                                                onPointerDown={(e) => handlePointerDown(e, slot.id, 'move')}
                                                style={{
                                                    left: `${slot.x}%`,
                                                    top: `${slot.y}%`,
                                                    width: `${slot.width}%`,
                                                    height: `${slot.height}%`,
                                                    touchAction: 'none'
                                                }}
                                                className={`absolute border-[3px] flex items-center justify-center pointer-events-auto transition-all duration-300 ${isSelected
                                                    ? 'bg-indigo-500/30 border-indigo-500 shadow-[0_0_0_4px_rgba(255,255,255,1)] cursor-move z-40 rounded-[4px]'
                                                    : 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer z-30 rounded-[2px]'
                                                    }`}
                                            >
                                                {/* Slot Index Badge */}
                                                <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-black shadow-xl border-2 ${isSelected ? 'bg-indigo-600 text-white border-white scale-110' : 'bg-white text-indigo-500 border-indigo-100 opacity-60'}`}>
                                                    {idx + 1}
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl animate-in slide-in-from-bottom-2">
                                                        {slot.width}% × {slot.height}%
                                                    </div>
                                                )}

                                                {/* High-quality Resize Handles */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {['tl', 'tr', 'bl', 'br'].map(pos => (
                                                            <div
                                                                key={pos}
                                                                onPointerDown={(e) => handlePointerDown(e, slot.id, `resize-${pos}`)}
                                                                style={{ cursor: pos.includes('t') ? (pos.includes('l') ? 'nwse-resize' : 'nesw-resize') : (pos.includes('l') ? 'nesw-resize' : 'nwse-resize') }}
                                                                className={`absolute w-4 h-4 bg-white border-2 border-indigo-600 shadow-xl pointer-events-auto z-50 hover:scale-125 transition-transform ${
                                                                    pos === 'tl' ? '-top-2 -left-2' : 
                                                                    pos === 'tr' ? '-top-2 -right-2' : 
                                                                    pos === 'bl' ? '-bottom-2 -left-2' : 
                                                                    '-bottom-2 -right-2'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center max-w-xs animate-in fade-in duration-1000">
                                <div className="w-24 h-24 rounded-[40px] bg-white shadow-depth flex items-center justify-center mb-8 rotate-3">
                                    <Icons.Image size={40} className="text-slate-200" strokeWidth={1} />
                                </div>
                                <h4 className="text-xl font-black text-slate-800 mb-3 tracking-tight">Artboard Empty</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Please switch to the <span className="text-slate-900">IDENTITY</span> tab to upload your base artwork image first.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Studio Footer Tools */}
                    <div className="shrink-0 p-6 bg-white flex items-center justify-center border-t border-slate-50 gap-4">
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hotkeys</span>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-black shadow-sm shrink-0">DEL</kbd>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">Remove</span>
                            </div>
                            <div className="w-px h-3 bg-slate-200 mx-1" />
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-black shadow-sm shrink-0">SHIFT</kbd>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">Ratio</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FrameEditor;
