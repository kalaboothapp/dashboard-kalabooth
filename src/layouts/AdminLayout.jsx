import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import * as Icons from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

import logo from '../assets/assets/logo-new.png';

const AdminLayout = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navItems = [
        { path: '/', label: 'Frame Manager', icon: Icons.SquaresFour },
        { path: '/frames/new', label: 'Upload Frame', icon: Icons.PlusSquare },
        { path: '/filters', label: 'LUT Filters', icon: Icons.Sparkle },
        { path: '/theme', label: 'Global Config', icon: Icons.Palette },
    ];

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-[var(--color-pix-canvas)] text-[var(--color-pix-midnight)] flex font-nunito selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">

            {/* Sidebar (Desktop - Floating Island) */}
            <aside className="hidden md:flex flex-col w-72 h-[calc(100vh-2rem)] my-4 ml-4 bg-white/80 backdrop-blur-xl border border-white/40 z-20 relative rounded-[32px] shadow-[var(--shadow-floating)] transition-all duration-500">
                <div className="h-24 flex items-center gap-3 px-8">
                    <div className="p-2 rounded-2xl">
                        <img src={logo} alt="Pixenze Logo" className="w-12 h-12 object-contain rounded-xl" />
                    </div>
                    <div>
                        <span className="font-titan text-2xl text-slate-900 tracking-tight block leading-tight">KalaBooth</span>
                        <span className="text-[10px] font-bold text-[var(--color-pix-primary)] uppercase tracking-widest">Admin Dashboard</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto scrollbar-hide">
                    <div className="px-4 mb-4 mt-2">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Navigation</p>
                    </div>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 group ${active
                                    ? 'bg-[var(--color-pix-primary)] text-white shadow-lg'
                                    : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                                    }`}
                            >
                                <item.icon size={20} weight={active ? "fill" : "duotone"} className={active ? 'text-white' : 'text-slate-400 group-hover:text-[var(--color-pix-primary)] transition-colors'} />
                                <span className="text-[15px]">{item.label}</span>
                                {active && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 m-4 mt-auto rounded-3xl bg-slate-50/50 border border-slate-100/50">
                    <div className="mb-4">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Account</p>
                        <p className="text-sm font-bold text-slate-700 truncate" title={user?.email}>
                            {user?.email?.split('@')[0]}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-white text-rose-500 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition-all shadow-sm active:scale-95"
                    >
                        <Icons.SignOut size={18} weight="duotone" /> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-white/70 backdrop-blur-lg border-b border-slate-100 z-50 h-16 px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Pixenze Logo" className="w-8 h-8 object-contain rounded-lg" />
                    <span className="font-extrabold text-lg text-slate-900 tracking-tight">Pixenze</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 bg-slate-50 rounded-xl transition-colors">
                    <Icons.List size={24} weight="duotone" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-4 left-4 w-[calc(100%-4rem)] max-w-sm bg-white z-[70] flex flex-col shadow-2xl rounded-[32px] overflow-hidden md:hidden"
                        >
                            <div className="h-20 flex justify-between items-center px-8 border-b border-slate-50">
                                <span className="font-extrabold text-xl text-slate-900">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                                    <Icons.X size={20} weight="bold" />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                {navItems.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-[16px] transition-all ${active
                                                ? 'bg-[var(--color-pix-primary)] text-white shadow-lg'
                                                : 'bg-transparent text-slate-500 active:bg-slate-50'
                                                }`}
                                        >
                                            <item.icon size={22} weight={active ? "fill" : "duotone"} className={active ? 'text-white' : 'text-slate-400'} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                                <p className="text-xs font-bold text-slate-400 mb-4 truncate text-center uppercase tracking-widest">
                                    {user?.email}
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold bg-white text-rose-500 border border-slate-200 shadow-sm active:scale-95"
                                >
                                    <Icons.SignOut size={20} weight="duotone" /> Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 overflow-y-auto h-screen md:pt-0 pt-16 scrollbar-hide">
                {/* Custom Page Header (Desktop) */}
                <header className="hidden md:flex h-20 items-center justify-between px-10 border-b border-transparent">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-400">Pages</span>
                        <span className="text-sm font-bold text-slate-300">/</span>
                        <span className="text-sm font-bold text-slate-900 capitalize">
                            {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace(/-/g, ' ')}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                            <Icons.PlusSquare size={20} weight="duotone" />
                        </div>
                        <div className="h-10 px-4 rounded-xl bg-white border border-slate-100 flex items-center gap-3 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-[var(--color-pix-primary)]/10 text-[var(--color-pix-primary)] flex items-center justify-center text-[10px] font-bold">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{user?.email?.split('@')[0]}</span>
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

