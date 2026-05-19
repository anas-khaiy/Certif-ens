import React from 'react';
import { Trash2, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'success' | 'info';
    onCancel?: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'danger',
    onCancel
}) => {
    const getIcon = () => {
        switch (variant) {
            case 'danger': return <Trash2 size={40} className="text-error" />;
            case 'warning': return <AlertTriangle size={40} className="text-warning" />;
            case 'success': return <CheckCircle size={40} className="text-success" />;
            case 'info': return <Info size={40} className="text-primary" />;
            default: return <Trash2 size={40} className="text-error" />;
        }
    };

    const getIconBg = () => {
        switch (variant) {
            case 'danger': return 'bg-error/10';
            case 'warning': return 'bg-warning/10';
            case 'success': return 'bg-success/10';
            case 'info': return 'bg-primary/10';
            default: return 'bg-error/10';
        }
    };

    const getConfirmBtnClass = () => {
        switch (variant) {
            case 'danger': return 'bg-error hover:bg-red-600 shadow-red-500/30';
            case 'warning': return 'bg-warning hover:bg-orange-500 shadow-orange-500/30';
            case 'success': return 'bg-success hover:bg-emerald-600 shadow-emerald-500/30';
            case 'info': return 'bg-primary hover:bg-blue-600 shadow-blue-500/30';
            default: return 'bg-error hover:bg-red-600';
        }
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCancel}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="bg-surface w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-glass-border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative Background Pattern */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <button
                            onClick={handleCancel}
                            className="absolute top-6 right-6 p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className={`w-20 h-20 ${getIconBg()} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                            {getIcon()}
                        </div>

                        <h3 className="text-2xl font-black mb-3 text-text">{title}</h3>
                        <p className="text-text-muted mb-8 leading-relaxed font-medium">
                            {message}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 order-2 sm:order-1 px-6 py-3.5 rounded-2xl bg-surface-hover text-text font-bold hover:bg-surface-active transition-all"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 order-1 sm:order-2 px-6 py-3.5 rounded-2xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${getConfirmBtnClass()}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
