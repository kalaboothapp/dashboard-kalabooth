import React, { useEffect, useState } from 'react';
import { useAlert } from '../../context/AlertContext';
// Removed duplicate getFrames import if it was there earlier, or just ensuring consistency.
// The previous block handles imports.

import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Home, AlertCircle, Sparkles, Gift, RefreshCw, Trophy, Users, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
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
            showAlert("Failed to load frames. Check console.", "error");
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
        <div className="relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-titan text-game-accent">FRAME MANAGER</h1>
                <div className="flex items-center gap-2">
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
                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:brightness-110 shadow-game pb-2"
                            >
                                SAVE ORDER
                            </button>
                            <button
                                onClick={() => {
                                    setFrames(originalOrder);
                                    setIsReordering(false);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:brightness-110 shadow-game pb-2"
                            >
                                CANCEL
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setOriginalOrder([...frames]);
                                setIsReordering(true);
                            }}
                            className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white hover:text-black transition pb-2 shadow-game"
                        >
                            <Icons.Move size={16} /> REORDER
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/frames/new')}
                        className="px-4 py-2 bg-game-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white hover:text-black transition pb-2 shadow-game"
                        disabled={isReordering}
                    >
                        <Icons.PlusSquare size={16} /> NEW FRAME
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse text-gray-500 font-mono">LOADING SYSTEM DATA...</div>
            ) : isReordering ? (
                <Reorder.Group axis="y" values={frames} onReorder={setFrames} className="space-y-2 max-w-3xl mx-auto">
                    {frames.map((frame) => (
                        <Reorder.Item key={frame.id} value={frame} className="bg-white/10 p-3 rounded-lg border border-white/10 flex items-center gap-4 cursor-move shadow-md relative">
                            <div className="text-gray-500"><Icons.GripVertical /></div>
                            <img src={frame.image_url} alt={frame.name} className="w-12 h-12 object-contain bg-black/50 rounded" />
                            <div className="flex-1">
                                <span className="font-bold text-lg text-white">{frame.name}</span>
                                <span className="ml-2 text-xs text-gray-400">{frame.status}</span>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {frames.map((frame, index) => (
                        <motion.div
                            key={frame.id}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`bg-white/10 border-4 border-black rounded-xl p-4 flex flex-col gap-4 relative group shadow-game ${frame.status === 'coming_soon' ? 'opacity-70' : ''}`}
                        >

                            <div className="aspect-[2/3] bg-black/50 rounded-lg overflow-hidden relative border border-white/5">
                                {/* Checkerboard for transparency */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                <img src={frame.image_url} className="w-full h-full object-contain relative z-10" alt={frame.name} />

                                {frame.status === 'coming_soon' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                                        <span className="bg-yellow-400 text-black font-bold px-4 py-1 rounded rotate-12 font-titan tracking-wider border-2 border-white">COMING SOON</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{frame.name}</h3>
                                    <p className="text-xs text-gray-400 font-mono">{new Date(frame.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/frames/edit/${frame.id}`, { state: { frame } })}
                                        className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition"
                                        title="Calibrate Layout"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(frame.id, frame.image_url)}
                                        className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${frame.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`}></div>
                                    <span className="text-xs font-mono uppercase text-gray-400">{frame.status.replace('_', ' ')}</span>
                                </div>
                                <button
                                    onClick={() => toggleStatus(frame)}
                                    className="text-xs font-bold underline hover:text-yellow-400"
                                >
                                    {frame.status === 'active' ? 'SET TO COMING SOON' : 'ACTIVATE'}
                                </button>
                            </div>

                        </motion.div>
                    ))}

                    {frames.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                            <AlertCircle className="mx-auto mb-4 opacity-50" size={48} />
                            <p>NO FRAMES DETECTED IN DATABANKS.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FrameManager;

