'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (type: ToastType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    const colors: Record<ToastType, string> = {
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    };

    const iconBg: Record<ToastType, string> = {
        success: 'bg-green-500/20 text-green-400',
        error: 'bg-red-500/20 text-red-400',
        warning: 'bg-yellow-500/20 text-yellow-400',
        info: 'bg-blue-500/20 text-blue-400',
    };

    const value: ToastContextValue = {
        toast: addToast,
        success: (m) => addToast('success', m),
        error: (m) => addToast('error', m),
        warning: (m) => addToast('warning', m),
        info: (m) => addToast('info', m),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-sm animate-slide-in ${colors[t.type]}`}
                        style={{ animation: 'slideIn 0.3s ease-out' }}
                    >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${iconBg[t.type]}`}>
                            {icons[t.type]}
                        </span>
                        <p className="text-sm font-semibold leading-snug text-white">{t.message}</p>
                        <button
                            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                            className="ml-auto text-gray-500 hover:text-white text-lg leading-none flex-shrink-0"
                        >×</button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
