import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import * as Icons from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const { user, loginWithPin } = useAuth();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await loginWithPin(pin);
        if (success) {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            
            <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-1000">
                <div className="card-premium p-10 md:p-14 relative overflow-hidden border-2 border-slate-100">
                    {/* Decorative Element */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-50/50 rounded-full -z-10 blur-2xl" />
                    
                    <div className="flex flex-col items-center mb-12">
                        <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-slate-900/30 mb-8">
                            <Icons.LockKey size={32} weight="duotone" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">
                            Master Access
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
                            Enter Secure Dashboard PIN
                        </p>
                    </div>

                    <form onSubmit={handlePinSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-center">Secure Entry Code</label>
                            <input
                                type="password"
                                required
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-[24px] px-8 py-5 text-slate-900 outline-none transition-all font-black text-2xl tracking-[0.5em] text-center shadow-inner"
                                placeholder="••••"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-black py-5 px-8 rounded-[24px] shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all flex justify-center items-center gap-3 text-[11px] uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            ) : (
                                <>Authenticate Session <Icons.ArrowRight size={16} weight="bold" /></>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="text-center mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Kala Photobooth • Studio Hub
                </p>
            </div>
        </div>
    );
};

export default Login;
