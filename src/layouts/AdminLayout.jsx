import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    DashboardIcon, 
    PlusIcon, 
    MixIcon, 
    ColorWheelIcon, 
    ExitIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon,
    HamburgerMenuIcon,
    Cross1Icon,
    PersonIcon,
    ClockIcon,
    LockClosedIcon
} from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/ui/tooltip';

import logo from '../assets/assets/logo-new.png';

const AdminLayout = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', isCollapsed);
    }, [isCollapsed]);

    const navItems = [
        { path: '/', label: 'Frame Manager', icon: DashboardIcon },
        { path: '/frames/new', label: 'Upload Frame', icon: PlusIcon },
        { path: '/filters', label: 'LUT Filters', icon: MixIcon },
        { path: '/security', label: 'Security Settings', icon: LockClosedIcon },
        { path: '/sessions', label: 'Session History', icon: ClockIcon },
    ];

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await signOut();
            navigate('/login');
        }
    };

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    const SidebarItem = ({ item, collapsed }) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        const content = (
            <button
                onClick={() => {
                    navigate(item.path);
                    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
                className={cn(
                    "group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-bold transition-all duration-200",
                    active 
                        ? "bg-kala-red text-white shadow-lg shadow-kala-red/20" 
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
            >
                <div className={cn(
                    "flex items-center justify-center min-w-[24px]",
                    active ? "text-white" : "text-slate-400 group-hover:text-kala-red"
                )}>
                    <Icon width={20} height={20} />
                </div>
                {!collapsed && (
                    <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm whitespace-nowrap"
                    >
                        {item.label}
                    </motion.span>
                )}
                {active && !collapsed && (
                    <motion.div 
                        layoutId="active-nav-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                    />
                )}
            </button>
        );

        if (collapsed) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return content;
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
                {/* Desktop Sidebar */}
                <motion.aside 
                    initial={false}
                    animate={{ width: isCollapsed ? 80 : 280 }}
                    className="hidden md:flex flex-col h-screen bg-white border-r border-border shrink-0 z-50 relative"
                >
                    {/* Header/Logo */}
                    <div className={cn(
                        "h-20 flex items-center px-6 gap-3 transition-all",
                        isCollapsed ? "justify-center" : "justify-start"
                    )}>
                        <img src={logo} alt="Logo" className={cn("w-10 h-10 object-contain shrink-0", isCollapsed ? "" : "mr-1")} />
                        {!isCollapsed && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="overflow-hidden"
                            >
                                <span className="font-black text-xl text-slate-900 block leading-tight">KalaBooth</span>
                                <span className="text-[10px] font-black text-kala-red uppercase tracking-widest">Admin Panel</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                        <div className={cn(
                            "mb-4 px-2",
                            isCollapsed ? "text-center" : "px-2"
                        )}>
                            {!isCollapsed ? (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Utama</p>
                            ) : (
                                <div className="h-4 w-full border-b border-slate-100 mb-6" />
                            )}
                        </div>
                        {navItems.map((item) => (
                            <SidebarItem key={item.path} item={item} collapsed={isCollapsed} />
                        ))}
                    </nav>

                    {/* Footer / User Profile */}
                    <div className="p-4 border-t border-slate-100">
                        <div className={cn(
                            "mb-4 p-3 rounded-2xl bg-slate-50 flex items-center gap-3 transition-all",
                            isCollapsed ? "justify-center" : ""
                        )}>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                                <PersonIcon />
                            </div>
                            {!isCollapsed && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-xs font-black text-slate-900 truncate uppercase">Admin User</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
                                </motion.div>
                            )}
                        </div>
                        <Button 
                            variant="kala" 
                            className={cn("w-full gap-2", isCollapsed ? "p-0" : "")}
                            onClick={handleLogout}
                        >
                            <ExitIcon />
                            {!isCollapsed && <span>Logout</span>}
                        </Button>
                    </div>

                    {/* Collapse Toggle */}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm z-[60]"
                    >
                        {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                </motion.aside>

                {/* Mobile Header & Content */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* Mobile Topbar */}
                    <header className="md:hidden h-16 bg-white border-b border-border px-6 flex items-center justify-between z-40 shrink-0">
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="font-black text-lg text-slate-900">KalaBooth</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                            <HamburgerMenuIcon width={24} height={24} />
                        </Button>
                    </header>

                    {/* Desktop Topbar / Breadcrumbs */}
                    <header className="hidden md:flex h-20 items-center justify-between px-10 border-b border-border bg-white/50 backdrop-blur-sm z-30 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-400">Dashboard</span>
                            <span className="text-sm font-bold text-slate-300">/</span>
                            <span className="text-sm font-black text-slate-900 capitalize">
                                {location.pathname === '/' ? 'Frame Collection' : location.pathname.split('/')[1].replace(/-/g, ' ')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                System Online
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto bg-background p-6 md:p-10 scrollbar-hide">
                        <div className="max-w-7xl mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 z-[100] md:hidden">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute inset-y-0 left-0 w-80 bg-white shadow-2xl flex flex-col"
                            >
                                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                                        <span className="font-black text-xl text-slate-900">KalaBooth</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Cross1Icon />
                                    </Button>
                                </div>
                                <nav className="flex-1 p-6 space-y-2">
                                    {navItems.map((item) => (
                                        <SidebarItem key={item.path} item={item} collapsed={false} />
                                    ))}
                                </nav>
                                <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                                    <p className="text-xs font-black text-slate-400 mb-4 truncate text-center uppercase tracking-widest leading-relaxed">
                                        {user?.email}
                                    </p>
                                    <Button variant="kala" className="w-full gap-2" onClick={handleLogout}>
                                        <ExitIcon />
                                        Logout Session
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    );
};

export default AdminLayout;

