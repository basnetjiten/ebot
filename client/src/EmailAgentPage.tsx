import React, { useState, useEffect } from 'react';
import { Mail, Plus, Check } from 'lucide-react';
import type { EmailMessage, EmailAccount, User } from '../../src/types';

const EmailAgentPage: React.FC = () => {
    const [emails, setEmails] = useState<EmailMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [user, setUser] = useState<User | null>(null);

    const userId = localStorage.getItem('ebot_user_id') || 'test-user';

    useEffect(() => {
        fetchUserData();
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (accounts.some(a => a.provider === 'gmail' && a.isConnected)) {
            fetchLatestEmails();
        }
    }, [accounts]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}`);
            const data = await res.json();
            if (data.success) setUser(data.data);
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/email/accounts/${userId}`);
            const data = await res.json();
            if (data.success) setAccounts(data.data);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    };

    const fetchLatestEmails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/email/latest/${userId}`);
            const data = await res.json();
            if (data.success) setEmails(data.data);
        } catch (err) {
            console.error('Failed to fetch latest emails:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGmail = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/email/auth-url');
            const data = await res.json();
            if (data.success) {
                const width = 500;
                const height = 600;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                window.open(
                    `${data.data}&state=${userId}`,
                    'Connect Gmail',
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                const handleMessage = (event: MessageEvent) => {
                    if (event.data.type === 'GMAIL_CONNECTED' && event.data.success) {
                        fetchAccounts();
                        fetchUserData();
                        window.removeEventListener('message', handleMessage);
                    }
                };
                window.addEventListener('message', handleMessage);
            }
        } catch (err) {
            console.error('Failed to start OAuth flow:', err);
        }
    };

    const isConnected = user?.isGmailConnected || accounts.some(a => a.provider === 'gmail' && a.isConnected);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Mail className="text-indigo-600" /> Email Utility
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold opacity-60">Manage reminders</p>
                </div>

                <div className="flex-1 p-5 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Status</h3>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isConnected ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
                            {isConnected ? 'GMAIL LINKED' : 'DISCONNECTED'}
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 border-dashed text-center">
                                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">Link your Gmail account to enable task reminders and view recent activity.</p>
                                <button
                                    onClick={handleConnectGmail}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                                >
                                    <Plus size={16} /> Connect Gmail
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-5 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Linked Account</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-100">
                                        {accounts.find(a => a.provider === 'gmail' && a.isConnected)?.email[0].toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-700 truncate">{accounts.find(a => a.provider === 'gmail' && a.isConnected)?.email}</p>
                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Active Sync</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed font-medium">
                                "Remind me" tasks will automatically notify this account.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-y-auto bg-slate-100/30 p-10">
                <div className="max-w-4xl w-full mx-auto">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inbox Feed</h1>
                            <p className="text-slate-500 mt-1 font-medium italic">Latest 3 signals from your digital workflow</p>
                        </div>
                        {isConnected && (
                            <button
                                onClick={fetchLatestEmails}
                                disabled={isLoading}
                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-30 transition-all"
                            >
                                {isLoading ? 'Refreshing...' : 'Refresh Feed'}
                            </button>
                        )}
                    </div>

                    {!isConnected ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-200 border-dashed shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
                                <Mail size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Workspace Disconnected</h3>
                            <p className="text-slate-400 text-sm mb-8 max-w-xs text-center font-medium">Please connect your Gmail account to synchronize your workspace reminders.</p>
                            <button
                                onClick={handleConnectGmail}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-6 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-28 bg-white rounded-3xl border border-slate-200" />
                            ))}
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 shadow-sm italic text-slate-400 font-medium">
                            The void is silent. No recent emails found.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {emails.map(email => (
                                <div key={email.id} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-3 shadow-sm border border-slate-100">
                                                {email.from[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{email.from.split('<')[0].trim() || email.from}</p>
                                                <p className="text-[11px] text-slate-400 font-bold lowercase tracking-tight opacity-75">{email.from.includes('<') ? email.from.split('<')[1].replace('>', '') : ''}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">{new Date(email.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="pl-16">
                                        <p className="text-sm font-bold text-slate-800 mb-2 leading-snug">{email.subject}</p>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 opacity-80">{email.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 flex items-center justify-between overflow-hidden relative border border-slate-800">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-3 tracking-tight">Seamless Workflow</h2>
                            <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed">Your workflow is now unified. Tasks marked for reminders will bypass manual checks and reach your inbox instantly.</p>
                        </div>
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                            <Check size={200} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailAgentPage;
