'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, HardDrive, LogOut } from 'lucide-react';
import TableTab from '@/admin/components/tabs/TableTab';
import StorageTab from '@/admin/components/tabs/StorageTab';
import { AdminProvider, useAdminContext } from '@/admin/context/AdminContext';

function AdminDashboardContent() {
    const {
        userName,
        activeTab,
        setActiveTab,
        handleLogout
    } = useAdminContext();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm relative z-10 text-gray-900 transition-all">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 truncate">Admin: {userName || 'System'}</h2>
                    <p className="text-sm text-gray-500 mt-1">Infrastructure Control</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6 mt-4">
                    <div>
                        <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Provisioning</span>
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveTab('table')}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'table' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Database className="w-4 h-4" />
                                Database Tables
                            </button>
                            <button
                                onClick={() => setActiveTab('storage')}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'storage' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <HardDrive className="w-4 h-4" />
                                Storage Buckets
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
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

export default function AdminDashboard() {
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };

        const uName = getCookie('userName');
        const uType = getCookie('userType');

        if (uName && uType === 'admin') {
            setUserName(decodeURIComponent(uName));
            setIsCheckingAuth(false);
        } else {
            router.push('/login?type=admin');
        }
    }, [router]);

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-slate-400 animate-pulse">Loading administration portal...</div>
            </div>
        );
    }

    return (
        <AdminProvider userName={userName || 'Admin'}>
            <AdminDashboardContent />
        </AdminProvider>
    );
}
