'use client';

import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { useSchoolContext } from '@/school/context/SchoolContext';

export default function QuestionsTab() {
    const {
        currentSchool,
        questions,
        newQuestionContent,
        setNewQuestionContent,
        isLoading,
        addQuestion,
        deleteQuestion,
    } = useSchoolContext();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentSchool?.name || 'School'} Application Questions</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage custom questions for your school's application portal.</p>
                </div>
                <button
                    onClick={() => document.getElementById('new-question-input')?.focus()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow hover:-translate-y-0.5 text-sm font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    New Question
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-bold text-gray-900 text-lg">Custom Fields</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure questions students must answer when applying to your institution.</p>
                </div>

                <div className="p-8">
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
    );
}
