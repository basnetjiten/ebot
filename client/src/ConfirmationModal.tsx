import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiExclamation, HiX } from 'react-icons/hi';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 border border-white/50"
                    >
                        <div className="flex gap-4">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${isDangerous ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                <HiExclamation size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-800 mb-2">
                                    {title}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                                    {message}
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 ${isDangerous
                                            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <HiX size={20} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
