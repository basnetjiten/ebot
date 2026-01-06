import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HiPaperAirplane, HiEmojiHappy } from 'react-icons/hi';

interface LoginPageProps {
    onLoginSuccess: (userId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [loginEmail, setLoginEmail] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmail.trim() || isLoggingIn) return;

        setIsLoggingIn(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:3000/api/login', {
                email: loginEmail.toLowerCase().trim()
            });
            const user = response.data.data;
            onLoginSuccess(user.id);
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 -z-20" />
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 p-12 border border-white/50 relative overflow-hidden"
            >
                {/* Decorative top sheen */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="flex flex-col items-center text-center mb-12 relative">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-8 relative rotate-3 transform hover:rotate-6 transition-transform duration-500">
                            <HiEmojiHappy size={48} />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-3">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Reflectly</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xs leading-relaxed">
                        Your intelligent companion for daily growth and reflection.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Email Address</label>
                        <div className="relative group">
                            <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                disabled={isLoggingIn}
                                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 group-hover:border-slate-200"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />

                        {isLoggingIn ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="relative">Start Journey</span>
                                <HiPaperAirplane className="rotate-90 relative" />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-center text-rose-600 text-sm font-bold"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
                        Secure • Private • Intelligent
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
