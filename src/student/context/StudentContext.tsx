'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStudentByEmail, createStudent, updateStudent } from '@/lib/studentActions';

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
            const matchEmail = document.cookie.match(/(^| )userEmail=([^;]+)/);
            const matchName = document.cookie.match(/(^| )userName=([^;]+)/);
            if (!matchEmail) return;
            const userEmail = decodeURIComponent(matchEmail[2]);
            const userName = matchName ? decodeURIComponent(matchName[2]) : '';

            const res = await getStudentByEmail(userEmail);

            if (res.success && res.data) {
                const data = res.data;
                const loadedData: StudentData = {
                    id: data.id,
                    name: data.name || userName || '',
                    email: data.email || userEmail || '',
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
                const createRes = await createStudent(userName || 'Student', userEmail);

                if (createRes.success && createRes.data) {
                    const insertData = createRes.data;
                    const newData = {
                        id: insertData.id,
                        name: insertData.name || userName || '',
                        email: insertData.email || userEmail || '',
                        address: '',
                        college_university: '',
                        major: '',
                        exams: { gre: '', gmat: '' },
                        recommendation_letters: [],
                        transcripts: []
                    };
                    setStudentData(newData);
                    setOriginalData(newData);
                } else if (createRes.code === '23505') {
                    // React Strict mode double-fire race condition caught! 
                    // The record was created by the parallel request. Let's just fetch it.
                    const retryRes = await getStudentByEmail(userEmail);
                    if (retryRes.success && retryRes.data) {
                        const retryData = retryRes.data;
                        const loadedData: StudentData = {
                            id: retryData.id,
                            name: retryData.name || userName || '',
                            email: retryData.email || userEmail || '',
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
                    console.error("Failed to auto-create student record:", createRes.error);
                    alert(`Database error creating student record: ${createRes.error || 'Unknown Error'}`);
                    // Fallback visually so it's not permanently empty
                    setStudentData(prev => ({ ...prev, name: userName, email: userEmail }));
                }
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const saveChanges = async () => {
        if (!studentData.id) return;
        try {
            const res = await updateStudent(studentData.id, {
                email: studentData.email,
                address: studentData.address,
                college_university: studentData.college_university,
                major: studentData.major,
                exams: studentData.exams,
                recommendation_letters: studentData.recommendation_letters,
                transcripts: studentData.transcripts
            });

            if (res.success) {
                setOriginalData(studentData);
                setIsDirty(false);
            } else {
                console.error("Error saving:", res.error);
                alert(`Failed to save to AWS RDS: ${res.error}`);
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
