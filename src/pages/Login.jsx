import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LockClosedIcon, ArrowRightIcon, ShadowIcon } from '@radix-ui/react-icons';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

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
        <div className="min-h-screen bg-[#020c2b] flex items-center justify-center p-6 relative overflow-hidden font-inter">
            {/* Background elements (Aceternity-inspired) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-kala-red/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div 
                    className="absolute inset-0 opacity-[0.1]" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
                        backgroundSize: '40px 40px' 
                    }} 
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[480px] z-10"
            >
                <Card className="bg-white/5 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    {/* Glowing effect inside card */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    
                    <CardHeader className="flex flex-col items-center pb-2">
                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="w-20 h-20 bg-gradient-to-br from-kala-red to-[#8a120e] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-kala-red/30 mb-6"
                        >
                            <LockClosedIcon width={36} height={36} />
                        </motion.div>
                        <CardTitle className="text-3xl font-black text-white tracking-tight text-center">
                            Master Access
                        </CardTitle>
                        <CardDescription className="text-white/40 font-black uppercase tracking-[0.3em] mt-2 text-[10px]">
                            Enter Secure Dashboard PIN
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <form onSubmit={handlePinSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest pl-1 text-center">
                                    Secure Entry Code
                                </label>
                                <div className="relative group">
                                    <Input
                                        type="password"
                                        required
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        className="bg-white/5 border-white/10 focus:border-kala-red/50 focus:ring-kala-red/20 text-white h-16 text-3xl font-black tracking-[0.5em] text-center rounded-[24px] transition-all"
                                        placeholder="••••"
                                        autoFocus
                                    />
                                    {/* Focus glow */}
                                    <div className="absolute -inset-1 bg-kala-red/20 rounded-[28px] opacity-0 group-focus-within:opacity-100 blur transition-opacity -z-10" />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-slate-950 hover:bg-white/90 h-16 rounded-[24px] shadow-xl shadow-white/5 font-black text-[11px] uppercase tracking-widest group active:scale-95 transition-all"
                            >
                                {loading ? (
                                    <ShadowIcon className="animate-spin" width={20} height={20} />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        Authenticate Session 
                                        <ArrowRightIcon className="transition-transform group-hover:translate-x-1" width={18} height={18} />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-white/5 rounded-full blur-3xl -z-10" />
                </Card>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-12 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]"
                >
                    Kala Photobooth • Studio Hub • v2.0
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Login;

