import React, { useEffect, useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { useNavigate } from 'react-router-dom';
import * as Icons from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { updateFrameOrder, getFrames, deleteFrame, updateFrame } from '../../services/frames';

const FrameManager = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReordering, setIsReordering] = useState(false);
    const [originalOrder, setOriginalOrder] = useState([]);

    useEffect(() => {
        loadFrames();
    }, []);

    const loadFrames = async () => {
        try {
            const data = await getFrames();
            setFrames(data);
        } catch (error) {
            console.error("Failed to load frames:", error);
            showAlert("Failed to load frames.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, imageUrl) => {
        if (!confirm("Are you sure you want to delete this frame?")) return;
        try {
            await deleteFrame(id, imageUrl);
            setFrames(frames.filter(f => f.id !== id));
        } catch (error) {
            console.error(error);
            showAlert("Failed to delete.", "error");
        }
    };

    const toggleStatus = async (frame) => {
        const newStatus = frame.status === 'active' ? 'coming_soon' : 'active';
        try {
            const updated = await updateFrame(frame.id, { status: newStatus });
            setFrames(frames.map(f => f.id === frame.id ? updated : f));
        } catch (error) {
            console.error(error);
            showAlert("Failed to update status.", "error");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Frame Collection</h1>
                    <p className="text-slate-500 font-medium mt-2">Manage and prioritize your photobooth design assets.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isReordering ? (
                        <>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    await updateFrameOrder(frames);
                                    setLoading(false);
                                    setIsReordering(false);
                                    showAlert("Order Saved!", "success");
                                }}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <Icons.FloppyDisk size={18} weight="duotone" /> Save Order
                            </button>
                            <button
                                onClick={() => {
                                    setFrames(originalOrder);
                                    setIsReordering(false);
                                }}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setOriginalOrder([...frames]);
                                    setIsReordering(true);
                                }}
                                className="px-5 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                <Icons.ArrowsDownUp size={18} weight="duotone" className="text-indigo-500" /> Sort Priority
                            </button>
                            <button
                                onClick={() => navigate('/frames/new')}
                                className="btn-pix-primary"
                                disabled={isReordering}
                            >
                                <Icons.Plus size={20} weight="bold" /> Upload New Frame
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                    <Icons.CircleNotch className="animate-spin text-indigo-400" size={32} weight="duotone" />
                    <p className="font-bold text-sm uppercase tracking-widest">Synchronizing Frames...</p>
                </div>
            ) : isReordering ? (
                <div className="space-y-4 max-w-4xl mx-auto">
                    {frames.map((frame, index) => (
                        <motion.div 
                            layout
                            key={frame.id} 
                            className="bg-white p-5 rounded-[24px] border border-slate-100 flex items-center gap-6 shadow-soft relative group"
                        >
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => {
                                        if (index === 0) return;
                                        const newFrames = [...frames];
                                        [newFrames[index], newFrames[index - 1]] = [newFrames[index - 1], newFrames[index]];
                                        setFrames(newFrames);
                                    }}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-slate-50 rounded-md text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-all"
                                >
                                    <Icons.CaretUp size={18} weight="bold" />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (index === frames.length - 1) return;
                                        const newFrames = [...frames];
                                        [newFrames[index], newFrames[index + 1]] = [newFrames[index + 1], newFrames[index]];
                                        setFrames(newFrames);
                                    }}
                                    disabled={index === frames.length - 1}
                                    className="p-1 hover:bg-slate-50 rounded-md text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-all"
                                >
                                    <Icons.CaretDown size={18} weight="bold" />
                                </button>
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm">
                                <img src={frame.image_url} alt={frame.name} className="w-full h-full object-contain p-2" />
                            </div>
                            <div className="flex-1">
                                <div className="font-extrabold text-slate-900 text-lg leading-none">{frame.name}</div>
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                    {frame.status.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="ml-auto opacity-10 font-black text-4xl text-slate-900 italic select-none">
                                #{index + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {frames.map((frame, index) => (
                        <motion.div
                            key={frame.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`card-premium group flex flex-col p-4 relative transition-all duration-500 ${frame.status === 'coming_soon' ? 'opacity-80' : ''}`}
                        >
                            <div className="aspect-[2/3] bg-slate-50 rounded-[28px] overflow-hidden relative border border-slate-100/50 flex items-center justify-center shadow-inner group-hover:bg-white transition-colors duration-500">
                                <img src={frame.image_url} className="w-full h-full object-contain relative z-10 p-6 group-hover:scale-110 transition-transform duration-700" alt={frame.name} />

                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 z-30">
                                    <button
                                        onClick={() => navigate(`/frames/edit/${frame.id}`, { state: { frame } })}
                                        className="w-10 h-10 bg-white/90 backdrop-blur-md text-slate-600 rounded-2xl shadow-depth flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all active:scale-90"
                                    >
                                        <Icons.Pencil size={18} weight="duotone" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(frame.id, frame.image_url)}
                                        className="w-10 h-10 bg-white/90 backdrop-blur-md text-rose-500 rounded-2xl shadow-depth flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                    >
                                        <Icons.Trash size={18} weight="duotone" />
                                    </button>
                                </div>

                                {frame.status === 'coming_soon' && (
                                    <div className="absolute inset-x-0 bottom-4 flex justify-center z-20">
                                        <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200 border border-white/20 uppercase tracking-[0.2em]">
                                            Coming Soon
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="px-2 pt-6 pb-2">
                                <div className="flex flex-col gap-1 mb-6">
                                    <h3 className="font-black text-slate-900 text-xl leading-tight truncate" title={frame.name}>{frame.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${frame.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {frame.status.replace('_', ' ')} • {new Date(frame.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleStatus(frame)}
                                    className={`w-full py-3 rounded-2xl font-bold text-[11px] tracking-wider transition-all active:scale-95 ${frame.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                                        }`}
                                >
                                    {frame.status === 'active' ? 'PAUSE DISPLAY' : 'SET AS LIVE'}
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {frames.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-100 rounded-[40px] gap-4">
                            <Icons.SquaresFour size={48} weight="duotone" />
                            <div className="text-center">
                                <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Design Gallery Empty</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Start by uploading your first photobooth frame.</p>
                            </div>
                            <button
                                onClick={() => navigate('/frames/new')}
                                className="mt-4 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                            >
                                Upload Now
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FrameManager;

