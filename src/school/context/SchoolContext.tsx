'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getSchoolByName, getFirstSchool, addSchoolQuestion, deleteSchoolQuestion } from '@/lib/schoolActions';
import { getSchoolQuestions } from '@/lib/studentActions';
import { logoutAction } from '@/lib/authActions';

interface SchoolContextProps {
    schoolName: string;
    currentSchool: any;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    questions: any[];
    newQuestionContent: string;
    setNewQuestionContent: (content: string) => void;
    isLoading: boolean;
    addQuestion: () => Promise<void>;
    deleteQuestion: (id: number) => Promise<void>;
    handleLogout: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextProps | undefined>(undefined);

export function SchoolProvider({ children, schoolName }: { children: ReactNode; schoolName: string }) {
    const router = useRouter();
    const [currentSchool, setCurrentSchool] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('questions');
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestionContent, setNewQuestionContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const matchEmail = document.cookie.match(/(^| )userEmail=([^;]+)/);
        if (matchEmail) {
            setUserEmail(decodeURIComponent(matchEmail[2]));
        }
    }, []);

    useEffect(() => {
        if (userEmail) {
            const savedState = localStorage.getItem(`lastState_${userEmail.trim().toLowerCase()}_school`);
            if (savedState) {
                try {
                    const { activeTab: savedTab } = JSON.parse(savedState);
                    if (savedTab) {
                        setActiveTab(savedTab);
                    }
                } catch (e) {
                    console.error('Failed to restore school tab:', e);
                }
            }
        }
    }, [userEmail]);

    useEffect(() => {
        if (userEmail) {
            localStorage.setItem(
                `lastState_${userEmail.trim().toLowerCase()}_school`,
                JSON.stringify({ pathname: '/school', activeTab })
            );
        }
    }, [activeTab, userEmail]);

    const handleLogout = async () => {
        await logoutAction();
        router.push('/login?type=school');
        router.refresh();
    };

    async function loadQuestions(schoolId: number) {
        setIsLoading(true);
        const res = await getSchoolQuestions(schoolId);
        if (res.success && res.data) {
            setQuestions(res.data);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        async function loadProfile() {
            if (schoolName) {
                const res = await getSchoolByName(schoolName);
                if (res.success && res.data) {
                    setCurrentSchool(res.data);
                    loadQuestions(res.data.id);
                    return;
                }
            }
            
            // fallback to first school if not found
            const fallbackRes = await getFirstSchool();
            if (fallbackRes.success && fallbackRes.data) {
                setCurrentSchool(fallbackRes.data);
                loadQuestions(fallbackRes.data.id);
            }
        }
        loadProfile();
    }, [schoolName]);

    const addQuestion = async () => {
        if (!newQuestionContent.trim() || !currentSchool) return;

        const res = await addSchoolQuestion(
            currentSchool.id,
            newQuestionContent.trim(),
            questions.length
        );

        if (res.success && res.data) {
            setQuestions([...questions, res.data]);
            setNewQuestionContent('');
        }
    };

    const deleteQuestion = async (id: number) => {
        const res = await deleteSchoolQuestion(id);

        if (res.success) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

    return (
        <SchoolContext.Provider
            value={{
                schoolName,
                currentSchool,
                activeTab,
                setActiveTab,
                questions,
                newQuestionContent,
                setNewQuestionContent,
                isLoading,
                addQuestion,
                deleteQuestion,
                handleLogout,
            }}
        >
            {children}
        </SchoolContext.Provider>
    );
}

export function useSchoolContext() {
    const context = useContext(SchoolContext);
    if (!context) {
        throw new Error('useSchoolContext must be used within a SchoolProvider');
    }
    return context;
}
