import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from '@phosphor-icons/react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[540px] z-10"
            >
                <div className="card-premium p-12 md:p-16 text-center relative overflow-hidden">
                    {/* Decorative Blur */}
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-50/50 rounded-full -z-10 blur-3xl" />
                    
                    <div className="relative mb-12">
                        <h1 className="text-[120px] font-black text-slate-900 tracking-tighter leading-none select-none opacity-[0.05] absolute inset-0 flex items-center justify-center -z-10">
                            404
                        </h1>
                        <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
                            <Icons.Warning size={48} weight="duotone" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Endpoint Nullified
                        </h2>
                        <p className="text-slate-400 font-bold leading-relaxed max-w-xs mx-auto text-sm">
                            The requested resource is currently unavailable or has been relocated within the network.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Icons.House size={18} weight="duotone" /> Re-route Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-[24px] font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Icons.ArrowsClockwise size={18} weight="bold" /> Reset Node
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-center gap-6 opacity-30">
                    <div className="w-12 h-[1px] bg-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Network Error 0x404</span>
                    <div className="w-12 h-[1px] bg-slate-400" />
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
