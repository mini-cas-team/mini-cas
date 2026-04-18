'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, HardDrive } from 'lucide-react';
import TableTab from '@/admin/components/tabs/TableTab';
import StorageTab from '@/admin/components/tabs/StorageTab';

export default function AdminDashboard() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [activeTab, setActiveTab] = useState<'table' | 'storage'>('table');

    useEffect(() => {
        const match = document.cookie.match(/(^| )userName=([^;]+)/);
        if (!match) {
            router.push('/');
        } else {
            setUserName(decodeURIComponent(match[2]));
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl relative z-10 text-white transition-all">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold truncate">Admin: {userName || 'System'}</h2>
                    <p className="text-sm text-slate-400 mt-1">Infrastructure Control</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6 mt-4">
                    <div>
                        <span className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Provisioning</span>
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveTab('table')}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Database className="w-4 h-4" />
                                Database Tables
                            </button>
                            <button
                                onClick={() => setActiveTab('storage')}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'storage' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <HardDrive className="w-4 h-4" />
                                Storage Buckets
                            </button>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50/50">
                <div className="max-w-4xl mx-auto p-10">
                    {activeTab === 'table' && <TableTab />}
                    {activeTab === 'storage' && <StorageTab />}
                </div>
            </main>
        </div>
    );
}
