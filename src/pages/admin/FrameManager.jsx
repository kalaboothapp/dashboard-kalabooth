import React, { useEffect, useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { useNavigate } from 'react-router-dom';
import { 
    PlusIcon, 
    HeightIcon, 
    CheckIcon, 
    Pencil1Icon, 
    TrashIcon, 
    CaretUpIcon, 
    CaretDownIcon,
    UpdateIcon,
    ExclamationTriangleIcon,
    MoveIcon,
    EyeOpenIcon,
    EyeNoneIcon
} from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { updateFrameOrder, getFrames, deleteFrame, updateFrame } from '../../services/frames';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';

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
            showAlert("Frame deleted successfully.", "success");
        } catch (error) {
            console.error(error);
            showAlert("Failed to delete.", "error");
        }
    };

    const toggleStatus = async (frame) => {
        // If it was hidden, unhide it first to active
        if (frame.status === 'hidden') {
            try {
                const updated = await updateFrame(frame.id, { status: 'active' });
                setFrames(frames.map(f => f.id === frame.id ? updated : f));
                showAlert("Frame unhidden and set to ACTIVE", "success");
            } catch (error) {
                showAlert("Failed to unhide.", "error");
            }
            return;
        }

        const newStatus = frame.status === 'active' ? 'coming_soon' : 'active';
        try {
            const updated = await updateFrame(frame.id, { status: newStatus });
            setFrames(frames.map(f => f.id === frame.id ? updated : f));
            showAlert(`Status updated to ${newStatus.replace('_', ' ')}`, "success");
        } catch (error) {
            console.error(error);
            showAlert("Failed to update status.", "error");
        }
    };

    const toggleVisibility = async (frame) => {
        const isHidden = frame.status === 'hidden';
        const newStatus = isHidden ? 'active' : 'hidden';
        
        try {
            const updated = await updateFrame(frame.id, { status: newStatus });
            setFrames(frames.map(f => f.id === frame.id ? updated : f));
            showAlert(isHidden ? "Frame is now VISIBLE" : "Frame is now HIDDEN", "success");
        } catch (error) {
            console.error("Visibility Update Error:", error);
            showAlert("Error: " + (error.message || "Gagal update status"), "error");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-inter">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Frame Collection</h1>
                    <p className="text-slate-500 font-bold mt-2">Manage and prioritize your photobooth design assets.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isReordering ? (
                        <>
                            <Button
                                onClick={async () => {
                                    setLoading(true);
                                    await updateFrameOrder(frames);
                                    setLoading(false);
                                    setIsReordering(false);
                                    showAlert("Order Saved!", "success");
                                }}
                                variant="kala"
                                className="px-6"
                            >
                                <CheckIcon className="mr-2" /> Save Order
                            </Button>
                            <Button
                                onClick={() => {
                                    setFrames(originalOrder);
                                    setIsReordering(false);
                                }}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={() => {
                                    setOriginalOrder([...frames]);
                                    setIsReordering(true);
                                }}
                                variant="outline"
                                className="bg-white border-slate-200"
                            >
                                <HeightIcon className="mr-2 rotate-90" /> Sort Priority
                            </Button>
                            <Button
                                onClick={() => navigate('/frames/new')}
                                variant="kala"
                            >
                                <PlusIcon className="mr-2" /> Upload New Frame
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                    <UpdateIcon className="animate-spin text-kala-red" width={32} height={32} />
                    <p className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing Studio...</p>
                </div>
            ) : isReordering ? (
                <div className="space-y-4 max-w-4xl">
                    <AnimatePresence mode="popLayout">
                        {frames.map((frame, index) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={frame.id} 
                                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-6 shadow-sm group hover:border-kala-red/20 transition-colors"
                            >
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button 
                                        onClick={() => {
                                            if (index === 0) return;
                                            const newFrames = [...frames];
                                            [newFrames[index], newFrames[index - 1]] = [newFrames[index - 1], newFrames[index]];
                                            setFrames(newFrames);
                                        }}
                                        disabled={index === 0}
                                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-kala-red disabled:opacity-20 transition-all"
                                    >
                                        <CaretUpIcon width={20} height={20} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (index === frames.length - 1) return;
                                            const newFrames = [...frames];
                                            [newFrames[index], newFrames[index + 1]] = [newFrames[index + 1], newFrames[index]];
                                            setFrames(newFrames);
                                        }}
                                        disabled={index === frames.length - 1}
                                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-kala-red disabled:opacity-20 transition-all"
                                    >
                                        <CaretDownIcon width={20} height={20} />
                                    </button>
                                </div>
                                <div className="h-16 w-16 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                                    <img src={frame.image_url} alt={frame.name} className="w-full h-full object-contain p-2" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-slate-900 text-lg leading-tight truncate">{frame.name}</div>
                                    <Badge variant={frame.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                                        {frame.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="ml-auto opacity-10 font-black text-4xl text-slate-900 italic select-none">
                                    #{index + 1}
                                </div>
                                <div className="p-3 text-slate-300">
                                    <MoveIcon width={20} height={20} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
                        {frames.map((frame, index) => (
                            <motion.div
                                key={frame.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="group"
                            >
                                <Card className={cn(
                                    "h-full flex flex-col p-4 relative overflow-hidden transition-all duration-500",
                                    frame.status === 'coming_soon' ? 'opacity-80 grayscale-[0.5]' : ''
                                )}>
                                    <div className="aspect-[2/3] bg-slate-50 rounded-[1.5rem] overflow-hidden relative border border-slate-100 flex items-center justify-center group-hover:bg-white transition-colors duration-500">
                                        <img src={frame.image_url} className="w-full h-full object-contain relative z-10 p-6 group-hover:scale-105 transition-transform duration-700" alt={frame.name} />

                                        {/* Hover Actions Overlay */}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 z-[40]">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className={cn(
                                                            "h-10 w-10 backdrop-blur-md rounded-xl shadow-lg transition-all",
                                                            frame.status === 'hidden' ? "bg-kala-red text-white hover:bg-red-600" : "bg-white text-slate-900"
                                                        )}
                                                        onClick={() => toggleVisibility(frame)}
                                                    >
                                                        {frame.status === 'hidden' ? <EyeNoneIcon /> : <EyeOpenIcon />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{frame.status === 'hidden' ? 'Unhide Frame' : 'Hide Frame'}</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg"
                                                        onClick={() => navigate(`/frames/edit/${frame.id}`, { state: { frame } })}
                                                    >
                                                        <Pencil1Icon />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit Frame</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl shadow-lg"
                                                        onClick={() => handleDelete(frame.id, frame.image_url)}
                                                    >
                                                        <TrashIcon />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete Frame</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        {frame.status === 'hidden' && (
                                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all group-hover:opacity-0">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Badge variant="destructive" className="px-4 py-1.5 shadow-xl border-none font-black tracking-widest animate-pulse">
                                                        HIDDEN
                                                    </Badge>
                                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Private to Admin</p>
                                                </div>
                                            </div>
                                        )}

                                        {frame.status === 'coming_soon' && (
                                            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center z-20">
                                                <Badge variant="secondary" className="bg-white/90 text-slate-900 border-none px-4 py-1.5 shadow-xl">
                                                    Coming Soon
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 pb-2 px-1 flex flex-col flex-1">
                                        <div className="mb-6">
                                            <h3 className="font-black text-slate-900 text-xl leading-tight truncate" title={frame.name}>{frame.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    frame.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                                    frame.status === 'hidden' ? 'bg-red-500' : 'bg-slate-300'
                                                )} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {frame.status.replace('_', ' ')} • {new Date(frame.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => toggleStatus(frame)}
                                            variant={frame.status === 'active' ? "outline" : "kala"}
                                            disabled={frame.status === 'hidden'}
                                            className={cn(
                                                "mt-auto w-full text-[10px] uppercase font-black tracking-widest",
                                                frame.status === 'active' ? "border-emerald-100 text-emerald-600 hover:bg-emerald-50" : "",
                                                frame.status === 'hidden' ? "opacity-20 cursor-not-allowed" : ""
                                            )}
                                        >
                                            {frame.status === 'active' ? 'PAUSE DISPLAY' : 
                                             frame.status === 'hidden' ? 'UNHIDE TO SET LIVE' : 'SET AS LIVE'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {frames.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] gap-6">
                            <motion.div 
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-[2rem] text-slate-200"
                            >
                                <ExclamationTriangleIcon width={48} height={48} />
                            </motion.div>
                            <div className="text-center">
                                <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Design Gallery Empty</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Start by uploading your first photobooth frame.</p>
                            </div>
                            <Button
                                onClick={() => navigate('/frames/new')}
                                variant="kala"
                                className="px-8"
                            >
                                Upload Now
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FrameManager;

