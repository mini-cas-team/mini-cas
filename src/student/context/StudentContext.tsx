'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Tab = 'personal' | 'exam' | 'transcripts' | 'recommend' | 'apply';

interface StudentData {
    id?: string;
    name: string;
    email: string;
    address: string;
    college_university?: string;
    major: string;
    exams: {
        gre?: string;
        gmat?: string;
    };
    recommendation_letters: any[];
    transcripts: any[];
}

interface StudentContextProps {
    isDirty: boolean;
    setIsDirty: (dirty: boolean) => void;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    saveChanges: () => Promise<void>;
    discardChanges: () => void;
    studentData: StudentData;
    setStudentData: React.Dispatch<React.SetStateAction<StudentData>>;
    loading: boolean;
}

const StudentContext = createContext<StudentContextProps | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
    const [isDirty, setIsDirty] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('personal');
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<StudentData>({
        name: '',
        email: '',
        address: '',
        college_university: '',
        major: '',
        exams: { gre: '', gmat: '' },
        recommendation_letters: [],
        transcripts: []
    });

    const [originalData, setOriginalData] = useState<StudentData | null>(null);

    useEffect(() => {
        async function loadData() {
            const match = document.cookie.match(/(^| )userName=([^;]+)/);
            if (!match) return;
            const userName = decodeURIComponent(match[2]);

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('name', userName)
                .maybeSingle(); // Use maybeSingle to avoid 406 on 0 rows

            if (data) {
                const loadedData: StudentData = {
                    id: data.id,
                    name: data.name || userName,
                    email: data.email || '',
                    address: data.address || '',
                    college_university: data.college_university || '',
                    major: data.major || '',
                    exams: data.exams || { gre: '', gmat: '' },
                    recommendation_letters: data.recommendation_letters || [],
                    transcripts: data.transcripts || []
                };
                setStudentData(loadedData);
                setOriginalData(loadedData);
            } else {
                // Create empty record if it doesn't exist
                const newRecord = { name: userName };
                const { data: insertData, error: insertError } = await supabase
                    .from('students')
                    .insert(newRecord)
                    .select()
                    .single();

                if (insertData && !insertError) {
                    const newData = {
                        id: insertData.id,
                        name: insertData.name,
                        email: '',
                        address: '',
                        college_university: '',
                        major: '',
                        exams: { gre: '', gmat: '' },
                        recommendation_letters: [],
                        transcripts: []
                    };
                    setStudentData(newData);
                    setOriginalData(newData);
                } else if (insertError && insertError.code === '23505') {
                    // React Strict mode double-fire race condition caught! 
                    // The record was created by the parallel request. Let's just fetch it.
                    const { data: retryData } = await supabase.from('students').select('*').eq('name', userName).maybeSingle();
                    if (retryData) {
                        const loadedData: StudentData = {
                            id: retryData.id,
                            name: retryData.name || userName,
                            email: retryData.email || '',
                            address: retryData.address || '',
                            college_university: retryData.college_university || '',
                            major: retryData.major || '',
                            exams: retryData.exams || { gre: '', gmat: '' },
                            recommendation_letters: retryData.recommendation_letters || [],
                            transcripts: retryData.transcripts || []
                        };
                        setStudentData(loadedData);
                        setOriginalData(loadedData);
                    }
                } else {
                    console.error("Failed to auto-create student record:", insertError);
                    alert(`Database error creating student record: ${insertError?.message || 'Unknown Error'}`);
                    // Fallback visually so it's not permanently empty
                    setStudentData(prev => ({ ...prev, name: userName }));
                }
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const saveChanges = async () => {
        if (!studentData.id) return;
        try {
            const { error } = await supabase
                .from('students')
                .update({
                    email: studentData.email,
                    address: studentData.address,
                    college_university: studentData.college_university,
                    major: studentData.major,
                    exams: studentData.exams,
                    recommendation_letters: studentData.recommendation_letters,
                    transcripts: studentData.transcripts
                })
                .eq('id', studentData.id);

            if (!error) {
                setOriginalData(studentData);
                setIsDirty(false);
            } else {
                console.error("Error saving:", error);
                alert('Failed to save to Supabase check console for details.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const discardChanges = () => {
        if (originalData) {
            setStudentData(originalData);
        }
        setIsDirty(false);
    };

    return (
        <StudentContext.Provider value={{ isDirty, setIsDirty, activeTab, setActiveTab, saveChanges, discardChanges, studentData, setStudentData, loading }}>
            {children}
        </StudentContext.Provider>
    );
}

export function useStudentContext() {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudentContext must be used within a StudentProvider');
    }
    return context;
}
