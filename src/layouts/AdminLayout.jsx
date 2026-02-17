import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
    LayoutDashboard,
    Link as LinkIcon,
    PlusSquare,
    LogOut,
    Menu,
    X,
    Gift,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const navItems = [
        { path: '/', label: 'DASHBOARD', icon: LayoutDashboard },
        { path: '/campaigns', label: 'CAMPAIGNS', icon: Gift },
        { path: '/links', label: 'MANAGE LINKS', icon: LinkIcon },
        { path: '/filters', label: 'FILTERS', icon: Sparkles },
        { path: '/frames/new', label: 'NEW FRAME', icon: PlusSquare },
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-[#02124d] text-white flex relative overflow-hidden font-nunito">
            {/* Background Effects (Global) */}
            <div className="fixed inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-game-secondary/10 blur-[100px] rounded-full"
                ></motion.div>
                <motion.div
                    animate={{ scale: [1, 1.5, 1], rotate: [0, -180] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-game-primary/10 blur-[100px] rounded-full"
                ></motion.div>
            </div>

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-black/40 border-r-4 border-black backdrop-blur-xl z-20 relative shadow-game">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <div className="bg-game-accent p-2 rounded-lg text-black border-2 border-black">
                        <Sparkles size={24} fill="currentColor" />
                    </div>
                    <span className="font-titan text-xl text-game-accent">PIXENZE</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border-2 ${isActive(item.path)
                                ? 'bg-game-primary text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]'
                                : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="mb-4 text-xs text-gray-500 font-mono px-2 truncate">
                        {user?.email}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-white/5 border-2 border-transparent text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 transition"
                    >
                        <LogOut size={20} /> LOGOUT
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-[#02124d]/90 backdrop-blur-md border-b-2 border-black z-50 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-game-accent" size={20} />
                    <span className="font-titan text-lg">PIXENZE</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/10 rounded-lg">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[60] bg-[#02124d] flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="font-titan text-2xl text-game-accent">MENU</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full">
                                <X size={28} />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold border-2 text-lg ${isActive(item.path)
                                        ? 'bg-game-primary text-white border-black shadow-game'
                                        : 'bg-white/5 border-transparent text-gray-300'
                                        }`}
                                >
                                    <item.icon size={24} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold bg-red-500/20 text-red-400 border-2 border-red-500/50"
                        >
                            <LogOut size={24} /> LOGOUT
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 relative z-10 overflow-y-auto h-screen md:pt-0 pt-16">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
