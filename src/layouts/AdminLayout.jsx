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
    Sparkles,
    Mail
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
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/campaigns', label: 'Campaigns', icon: Gift },
        { path: '/links', label: 'Manage Links', icon: LinkIcon },
        { path: '/filters', label: 'Filters', icon: Sparkles },
        { path: '/letters', label: 'Warkop Mails', icon: Mail },
        { path: '/frames/new', label: 'New Frame', icon: PlusSquare },
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex font-nunito selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
            
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-20 relative shadow-sm">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Sparkles size={20} fill="currentColor" />
                    </div>
                    <span className="font-extrabold text-xl text-slate-900 tracking-tight">Pixenze</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                    active
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <item.icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="mb-3 px-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-medium text-slate-700 truncate" title={user?.email}>
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-white text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 h-16 px-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-1.5 rounded-md text-blue-600">
                        <Sparkles size={18} fill="currentColor" />
                    </div>
                    <span className="font-extrabold text-lg text-slate-900 tracking-tight">Pixenze</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Menu size={24} />
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
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: '-100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white z-[70] flex flex-col shadow-2xl md:hidden"
                        >
                            <div className="h-16 flex justify-between items-center px-6 border-b border-slate-100">
                                <span className="font-extrabold text-xl text-slate-900">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                                {navItems.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-colors ${
                                                active
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'bg-transparent text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <item.icon size={22} className={active ? 'text-blue-600' : 'text-slate-400'} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>
                            
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-xs font-medium text-slate-500 mb-4 truncate text-center">
                                    {user?.email}
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
                                >
                                    <LogOut size={20} /> Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 overflow-y-auto h-screen md:pt-0 pt-16">
                <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

