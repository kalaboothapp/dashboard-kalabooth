import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { 
    CheckCircledIcon, 
    ExclamationTriangleIcon, 
    InfoCircledIcon, 
    Cross2Icon 
} from '@radix-ui/react-icons';
import { cn } from '../lib/utils';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const removeAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const showAlert = useCallback((message, type = 'info', title = '') => {
        const id = Math.random().toString(36).substring(2, 9);
        
        let autoTitle = title;
        if (!autoTitle) {
            if (type === 'success') autoTitle = 'Success';
            else if (type === 'error') autoTitle = 'Attention';
            else autoTitle = 'Notification';
        }

        const newAlert = { id, message, type, title: autoTitle };
        setAlerts(prev => [...prev, newAlert]);

        setTimeout(() => {
            removeAlert(id);
        }, 5000);
    }, [removeAlert]);

    const hideAlert = useCallback(() => {
        if (alerts.length > 0) {
            removeAlert(alerts[0].id);
        }
    }, [alerts, removeAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert) => (
                        <Toast 
                            key={alert.id} 
                            alert={alert} 
                            onClose={() => removeAlert(alert.id)} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        </AlertContext.Provider>
    );
};

const Toast = ({ alert, onClose }) => {
    const icons = {
        success: <CheckCircledIcon className="w-5 h-5 text-emerald-500" />,
        error: <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />,
        info: <InfoCircledIcon className="w-5 h-5 text-blue-500" />
    };

    const variants = {
        success: "border-emerald-100 bg-emerald-50/50",
        error: "border-rose-100 bg-rose-50/50",
        info: "border-blue-100 bg-blue-50/50"
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl border bg-white shadow-xl backdrop-blur-md",
                variants[alert.type] || variants.info
            )}
        >
            <div className="shrink-0 pt-0.5">
                {icons[alert.type] || icons.info}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-900 leading-none mb-1">
                    {alert.title}
                </h4>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    {alert.message}
                </p>
            </div>
            <button 
                onClick={onClose}
                className="shrink-0 text-slate-400 hover:text-slate-900 transition-colors p-1"
            >
                <Cross2Icon />
            </button>
            <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={cn(
                    "absolute bottom-0 left-0 h-1",
                    alert.type === 'success' ? "bg-emerald-500" : 
                    alert.type === 'error' ? "bg-rose-500" : "bg-blue-500"
                )}
            />
        </motion.div>
    );
};

