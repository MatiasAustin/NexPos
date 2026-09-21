'use client';

import { ReactNode } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: '🗑️',
            iconBg: 'bg-red-500/10 border border-red-500/20',
            btn: 'bg-red-600 hover:bg-red-500 text-text-primary',
        },
        warning: {
            icon: '⚠️',
            iconBg: 'bg-yellow-500/10 border border-yellow-500/20',
            btn: 'bg-yellow-600 hover:bg-yellow-500 text-text-primary',
        },
        info: {
            icon: 'ℹ️',
            iconBg: 'bg-accent/10 border border-accent/20',
            btn: 'bg-accent hover:bg-accent-hover text-text-primary',
        },
    };

    const s = variantStyles[variant];

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9998] p-4 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className={`w-14 h-14 ${s.iconBg} rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto`}>
                    {s.icon}
                </div>
                <h3 className="font-bold text-xl text-text-primary text-center mb-2">{title}</h3>
                <p className="text-text-muted text-sm text-center mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-gray-800 text-text-secondary rounded-xl font-bold hover:bg-gray-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-xl font-bold transition-colors ${s.btn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for easier usage
import { useState, useCallback } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function useConfirm() {
    const [state, setState] = useState<{ open: boolean; opts: ConfirmOptions; resolve?: (v: boolean) => void }>({
        open: false,
        opts: { title: '', message: '' },
    });

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setState({ open: true, opts, resolve });
        });
    }, []);

    const handleConfirm = () => {
        state.resolve?.(true);
        setState(prev => ({ ...prev, open: false }));
    };

    const handleCancel = () => {
        state.resolve?.(false);
        setState(prev => ({ ...prev, open: false }));
    };

    const ConfirmDialog = () => (
        <ConfirmModal
            isOpen={state.open}
            title={state.opts.title}
            message={state.opts.message}
            confirmText={state.opts.confirmText}
            cancelText={state.opts.cancelText}
            variant={state.opts.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return { confirm, ConfirmDialog };
}
