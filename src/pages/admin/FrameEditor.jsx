import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAlert } from '../../context/AlertContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { createFrame, updateFrame } from '../../services/frames';
import { ArrowLeft, Save, Plus, Trash2, Move, Maximize2 } from 'lucide-react';
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
    const [selectedSlotId, setSelectedSlotId] = useState(null);

    const photoSlots = layouts[activeLayout];

    const containerRef = useRef(null);
    const [uploading, setUploading] = useState(false);

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
                x: Math.round(Math.max(0, Math.min(100 - startSlot.width, startSlot.x + deltaXPct))),
                y: Math.round(Math.max(0, Math.min(100 - startSlot.height, startSlot.y + deltaYPct)))
            };
        } else if (type === 'resize-br') {
            updates = {
                width: Math.round(Math.max(5, Math.min(100 - startSlot.x, startSlot.width + deltaXPct))),
                height: Math.round(Math.max(5, Math.min(100 - startSlot.y, startSlot.height + deltaYPct)))
            };
        } else if (type === 'resize-bl') {
            const newW = Math.round(Math.max(5, startSlot.width - deltaXPct));
            updates = {
                x: Math.round(Math.max(0, startSlot.x + startSlot.width - newW)),
                width: newW,
                height: Math.round(Math.max(5, Math.min(100 - startSlot.y, startSlot.height + deltaYPct)))
            };
        } else if (type === 'resize-tr') {
            const newH = Math.round(Math.max(5, startSlot.height - deltaYPct));
            updates = {
                y: Math.round(Math.max(0, startSlot.y + startSlot.height - newH)),
                width: Math.round(Math.max(5, Math.min(100 - startSlot.x, startSlot.width + deltaXPct))),
                height: newH
            };
        } else if (type === 'resize-tl') {
            const newW = Math.round(Math.max(5, startSlot.width - deltaXPct));
            const newH = Math.round(Math.max(5, startSlot.height - deltaYPct));
            updates = {
                x: Math.round(Math.max(0, startSlot.x + startSlot.width - newW)),
                y: Math.round(Math.max(0, startSlot.y + startSlot.height - newH)),
                width: newW,
                height: newH
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
                externalImageB: (useExternalUrlB && externalUrlB.trim()) ? externalUrlB.trim() : null
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
        <div className="min-h-screen font-nunito p-4 md:p-8 text-white flex flex-col items-center relative overflow-hidden">

            {/* Animated Background Blob */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], x: [0, 40, 0] }}
                transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-game-primary/15 blur-[120px] rounded-full pointer-events-none"
            />

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
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-gray-400">
                                        FRAME IMAGE (LAYOUT {activeLayout.toUpperCase()})
                                    </label>
                                    {activeLayout === 'a' && (
                                        <button
                                            type="button"
                                            onClick={() => setUseExternalUrl(!useExternalUrl)}
                                            className="text-[10px] text-yellow-400 hover:text-yellow-300 underline"
                                        >
                                            {useExternalUrl ? 'Switch to Upload' : 'Use External URL'}
                                        </button>
                                    )}
                                    {activeLayout === 'b' && (
                                        <button
                                            type="button"
                                            onClick={() => setUseExternalUrlB(!useExternalUrlB)}
                                            className="text-[10px] text-yellow-400 hover:text-yellow-300 underline"
                                        >
                                            {useExternalUrlB ? 'Switch to Upload' : 'Use External URL'}
                                        </button>
                                    )}
                                </div>
                                {(activeLayout === 'a' ? imagePreview : imagePreviewB) && (
                                    <div className="mb-2 h-20 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                                        <img src={activeLayout === 'a' ? imagePreview : imagePreviewB} className="h-full object-contain" />
                                    </div>
                                )}

                                {activeLayout === 'a' && useExternalUrl ? (
                                    <input
                                        type="text"
                                        value={externalUrl}
                                        onChange={(e) => {
                                            setExternalUrl(e.target.value);
                                            setImagePreview(e.target.value);
                                        }}
                                        placeholder="https://cdn.jsdelivr.net/gh/user/repo@main/frame.webp"
                                        className="w-full bg-white/5 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-yellow-400"
                                    />
                                ) : activeLayout === 'b' && useExternalUrlB ? (
                                    <input
                                        type="text"
                                        value={externalUrlB}
                                        onChange={(e) => {
                                            setExternalUrlB(e.target.value);
                                            setImagePreviewB(e.target.value);
                                        }}
                                        placeholder="https://cdn.jsdelivr.net/gh/user/repo@main/frame-b.webp"
                                        className="w-full bg-white/5 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-yellow-400"
                                    />
                                ) : (
                                    <input
                                        type="file"
                                        onChange={e => handleFileChange(e, activeLayout === 'a' ? 'image' : 'imageB')}
                                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                                    />
                                )}
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

                    {/* PHOTO SLOTS section */}
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

                    <div className="mb-4">
                        <button onClick={addSlot} className="bg-white/10 p-1.5 rounded hover:bg-white/20 text-xs flex items-center gap-1 w-full justify-center border border-dashed border-white/20 hover:border-yellow-400/50 transition-colors">
                            <Plus size={14} /> ADD SLOT TO LAYOUT {activeLayout.toUpperCase()}
                        </button>
                    </div>

                    {/* Slot List — compact cards */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {photoSlots.length === 0 && (
                            <p className="text-xs text-gray-500 italic text-center py-4">No slots yet. Add a slot to begin.</p>
                        )}
                        {photoSlots.map((slot, idx) => (
                            <div
                                key={slot.id}
                                onClick={() => setSelectedSlotId(slot.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSlotId === slot.id
                                    ? 'bg-yellow-400/10 border-yellow-400/50 shadow-[0_0_12px_rgba(250,206,16,0.15)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-yellow-400">SLOT {idx + 1}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                        title="Delete Slot"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                {/* Numeric Inputs — inline grid */}
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { label: 'X', key: 'x' },
                                        { label: 'Y', key: 'y' },
                                        { label: 'W', key: 'width' },
                                        { label: 'H', key: 'height' }
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="text-[9px] text-gray-500 font-bold block mb-0.5">{label}</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={slot[key]}
                                                onChange={(e) => updateSlot(slot.id, { [key]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                                className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[11px] text-white text-center font-mono outline-none focus:border-yellow-400 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tip */}
                    {photoSlots.length > 0 && (
                        <div className="mt-4 flex items-start gap-2 text-[10px] text-gray-500 bg-white/5 p-2 rounded border border-white/5">
                            <Move size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                            <span>Drag slots on the preview to move. Use corner handles to resize. Click a slot card for precision editing.</span>
                        </div>
                    )}
                </div>

                {/* Preview / Work Area */}
                <div
                    className="lg:col-span-2 bg-black/80 rounded-2xl border-4 border-gray-800 p-8 flex justify-center items-start overflow-auto"
                    onClick={() => setSelectedSlotId(null)} // Click outside to deselect
                >
                    {(activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview)) ? (
                        <div
                            className="relative shadow-2xl select-none"
                            ref={containerRef}
                            style={{ width: '100%', maxWidth: '500px' }}
                            onClick={(e) => e.stopPropagation()} // Don't deselect when clicking inside
                        >
                            {/* The Frame Image */}
                            <img
                                src={activeLayout === 'a' ? imagePreview : (imagePreviewB || imagePreview)}
                                className="w-full h-auto pointer-events-none select-none relative z-20"
                                alt={`Frame Layout ${activeLayout}`}
                                draggable={false}
                            />

                            {/* The Slots Layer */}
                            <div className="absolute inset-0 z-30">
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
                                            className={`absolute border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? 'bg-green-500/40 border-green-400 shadow-[0_0_16px_rgba(74,222,128,0.3)] cursor-move'
                                                : 'bg-blue-500/25 border-blue-400/50 hover:bg-blue-500/40 cursor-pointer'
                                                }`}
                                        >
                                            {/* Slot Label */}
                                            <span className={`text-[10px] font-bold drop-shadow-md pointer-events-none ${isSelected ? 'text-green-200' : 'text-white'
                                                }`}>
                                                {idx + 1}
                                            </span>

                                            {/* Position indicator */}
                                            {isSelected && (
                                                <span className="absolute -top-5 left-0 text-[9px] font-mono text-yellow-300 bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                                                    {slot.x},{slot.y} — {slot.width}×{slot.height}
                                                </span>
                                            )}

                                            {/* Resize handles — only for selected */}
                                            {isSelected && (
                                                <>
                                                    <ResizeHandle slotId={slot.id} position="resize-tl" />
                                                    <ResizeHandle slotId={slot.id} position="resize-tr" />
                                                    <ResizeHandle slotId={slot.id} position="resize-bl" />
                                                    <ResizeHandle slotId={slot.id} position="resize-br" />
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
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
