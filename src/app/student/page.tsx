'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, User, GraduationCap, Send, Save, Check } from 'lucide-react';
import { StudentProvider, useStudentContext } from '@/student/context/StudentContext';
import PersonalInfoTab from '@/student/components/tabs/PersonalInfoTab';
import ExamScoreTab from '@/student/components/tabs/ExamScoreTab';
import RecommendLetterTab from '@/student/components/tabs/RecommendLetterTab';
import TranscriptsTab from '@/student/components/tabs/TranscriptsTab';
import ApplyTab from '@/student/components/tabs/ApplyTab';

function StudentDashboard() {
    const router = useRouter();
    const { isDirty, saveChanges, activeTab, setActiveTab } = useStudentContext();
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Basic auth check from cookie
        const match = document.cookie.match(/(^| )userName=([^;]+)/);
        if (!match) {
            router.push('/');
        } else {
            setUserName(decodeURIComponent(match[2]));
        }
    }, [router]);

    const handleTabChange = (newTab: string) => {
        if (newTab === activeTab) return;
        if (isDirty) {
            setPendingTab(newTab);
        } else {
            setActiveTab(newTab as any);
        }
    };

    const confirmNavigation = () => {
        if (pendingTab) {
            setActiveTab(pendingTab as any);
            setPendingTab(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm relative z-10">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 truncate">Welcome, {userName || 'Student'}</h2>
                    <p className="text-sm text-gray-500 mt-1">Applicant Portal</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">

                    <div className="mb-6">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Info</span>
                            <button
                                onClick={saveChanges}
                                disabled={!isDirty}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${isDirty
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 ring-2 ring-blue-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isDirty ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                Update
                            </button>
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => handleTabChange('personal')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'personal' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Personal
                            </button>
                            <button
                                onClick={() => handleTabChange('exam')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'exam' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                Exam Score
                            </button>
                            <button
                                onClick={() => handleTabChange('transcripts')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transcripts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Transcripts
                            </button>
                            <button
                                onClick={() => handleTabChange('recommend')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'recommend' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Recommend Letter
                            </button>
                        </div>
                    </div>

                    <div>
                        <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Application</span>
                        <button
                            onClick={() => handleTabChange('apply')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'apply' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                            Apply
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-gray-50">
                <div className="max-w-4xl mx-auto p-8">
                    {activeTab === 'personal' && <PersonalInfoTab />}
                    {activeTab === 'exam' && <ExamScoreTab />}
                    {activeTab === 'transcripts' && <TranscriptsTab />}
                    {activeTab === 'recommend' && <RecommendLetterTab />}
                    {activeTab === 'apply' && <ApplyTab />}
                </div>
            </main>

            {/* Unsaved Changes Modal */}
            {pendingTab && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 border border-gray-100">
                        <div className="flex items-center gap-4 mb-4 text-amber-600">
                            <div className="p-3 bg-amber-50 rounded-full ring-4 ring-amber-50">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Unsaved Changes</h3>
                        </div>
                        <p className="text-gray-600 mb-6 text-sm">
                            You have unsaved changes in the Info tab. Please update your changes before leaving, or discard them.
                        </p>
                        <div className="flex gap-3 justify-end flex-wrap">
                            <button
                                onClick={() => setPendingTab(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    saveChanges();
                                    confirmNavigation();
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                                Discard & Proceed
                            </button>
                            <button
                                onClick={() => {
                                    saveChanges();
                                    confirmNavigation();
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                            >
                                Update & Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StudentSystem() {
    return (
        <StudentProvider>
            <StudentDashboard />
        </StudentProvider>
    );
}
