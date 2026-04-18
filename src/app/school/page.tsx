'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    Settings,
    LayoutDashboard,
    HelpCircle,
    Users,
    ChevronRight,
    AdminIcon
} from 'lucide-react';

export default function SchoolDashboard() {
    const [currentSchool, setCurrentSchool] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('questions');
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestionContent, setNewQuestionContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return null;
            };

            const userNameCookie = getCookie('userName');
            const schoolName = userNameCookie ? decodeURIComponent(userNameCookie) : null;

            let query = supabase.from('schools').select('*');
            if (schoolName) {
                query = query.eq('name', schoolName);
            }

            const { data: schools } = await query.limit(1);

            if (schools && schools.length > 0) {
                setCurrentSchool(schools[0]);
                loadQuestions(schools[0].id);
            } else if (schoolName) {
                // fallback to first school if not found
                const { data: fallbackSchools } = await supabase.from('schools').select('*').limit(1);
                if (fallbackSchools && fallbackSchools.length > 0) {
                    setCurrentSchool(fallbackSchools[0]);
                    loadQuestions(fallbackSchools[0].id);
                }
            }
        }
        loadProfile();
    }, []);

    async function loadQuestions(schoolId: number) {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('school_questions')
            .select('*')
            .eq('school_id', schoolId)
            .order('sort_order', { ascending: true });

        if (!error) setQuestions(data || []);
        setIsLoading(false);
    }

    const addQuestion = async () => {
        if (!newQuestionContent.trim() || !currentSchool) return;

        const { data, error } = await supabase
            .from('school_questions')
            .insert({
                school_id: currentSchool.id,
                content: newQuestionContent.trim(),
                sort_order: questions.length
            })
            .select()
            .single();

        if (!error) {
            setQuestions([...questions, data]);
            setNewQuestionContent('');
        }
    };

    const deleteQuestion = async (id: number) => {
        const { error } = await supabase
            .from('school_questions')
            .delete()
            .eq('id', id);

        if (!error) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

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

                <div className="p-6 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {currentSchool?.name?.substring(0, 1) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{currentSchool?.name || 'Loading...'}</p>
                            <p className="text-[10px] text-gray-500 truncate">School Admin</p>
                        </div>
                    </div>
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
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="p-8 max-w-5xl mx-auto">
                    {activeTab === 'questions' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{currentSchool?.name || 'School'} Application Questions</h1>
                                    <p className="text-sm text-gray-500 mt-1">Manage custom questions for your school's application portal.</p>
                                </div>
                                <button
                                    onClick={() => document.getElementById('new-question-input')?.focus()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Question
                                </button>
                            </div>

                            {/* Question List */}
                            <div className="space-y-4">
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                                    <div className="flex gap-4 mb-8">
                                        <div className="flex-1 relative">
                                            <input
                                                id="new-question-input"
                                                type="text"
                                                value={newQuestionContent}
                                                onChange={(e) => setNewQuestionContent(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
                                                placeholder="Type your new question here..."
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-24"
                                            />
                                            <button
                                                onClick={addQuestion}
                                                className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold flex items-center"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Existing Questions</h3>
                                        {isLoading ? (
                                            <div className="py-12 text-center text-gray-400 animate-pulse">Loading questions...</div>
                                        ) : questions.length > 0 ? (
                                            questions.map((q, idx) => (
                                                <div key={q.id} className="group flex items-center justify-between p-4 bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-gray-200 text-gray-500 text-[10px] font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-800">{q.content}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteQuestion(q.id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                                <HelpCircle className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                                                <p className="text-sm text-gray-400">No questions defined yet. Add your first one above!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
