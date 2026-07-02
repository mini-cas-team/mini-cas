'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    HelpCircle,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { SchoolProvider, useSchoolContext } from '@/school/context/SchoolContext';
import QuestionsTab from '@/school/components/tabs/QuestionsTab';

function SchoolDashboardContent() {
    const {
        currentSchool,
        activeTab,
        setActiveTab,
        handleLogout
    } = useSchoolContext();

    return (
        <div className="flex h-screen w-full bg-[#f8fafc]">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col pt-6 shadow-sm">
                <div className="px-6 mb-8 flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">Mini-CAS</span>
                </div>

                <nav className="flex-1 px-4 space-y-8">
                    {/* Admin Group */}
                    <div>
                        <h3 className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Admin</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${activeTab === 'questions'
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <HelpCircle className={`w-5 h-5 ${activeTab === 'questions' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                <span className="text-sm">Questions</span>
                                {activeTab === 'questions' && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </button>
                        </div>
                    </div>

                    {/* View Group */}
                    <div>
                        <h3 className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">View</h3>
                        <div className="p-3 text-xs text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                            No items yet
                        </div>
                    </div>
                </nav>

                <div className="p-6 border-t border-gray-100 mt-auto space-y-4">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {currentSchool?.name?.substring(0, 1) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{currentSchool?.name || 'Loading...'}</p>
                            <p className="text-[10px] text-gray-500 truncate">School Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Admin</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <span className="text-sm font-bold text-gray-800">{currentSchool?.name || 'School'} Application Questions</span>
                    </div>
                </header>

                <main className="p-8 max-w-5xl mx-auto">
                    {activeTab === 'questions' && <QuestionsTab />}
                </main>
            </div>
        </div>
    );
}

export default function SchoolDashboard() {
    const router = useRouter();
    const [schoolName, setSchoolName] = useState<string | null>(null);
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

        if (uName && uType && uType === 'school') {
            setSchoolName(decodeURIComponent(uName));
            setIsCheckingAuth(false);
        } else if (uName && uType && uType !== 'student' && uType !== 'admin') {
            setSchoolName(decodeURIComponent(uType));
            setIsCheckingAuth(false);
        } else {
            router.push('/login?type=school');
        }
    }, [router]);

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="text-gray-500 animate-pulse">Loading school portal...</div>
            </div>
        );
    }

    return (
        <SchoolProvider schoolName={schoolName || 'School'}>
            <SchoolDashboardContent />
        </SchoolProvider>
    );
}
