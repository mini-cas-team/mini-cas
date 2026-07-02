'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/authActions';

interface AdminContextProps {
    userName: string;
    activeTab: 'table' | 'storage';
    setActiveTab: (tab: 'table' | 'storage') => void;
    handleLogout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export function AdminProvider({ children, userName }: { children: ReactNode; userName: string }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'table' | 'storage'>('table');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const matchEmail = document.cookie.match(/(^| )userEmail=([^;]+)/);
        if (matchEmail) {
            setUserEmail(decodeURIComponent(matchEmail[2]));
        }
    }, []);

    useEffect(() => {
        if (userEmail) {
            const savedState = localStorage.getItem(`lastState_${userEmail.trim().toLowerCase()}_admin`);
            if (savedState) {
                try {
                    const { activeTab: savedTab } = JSON.parse(savedState);
                    if (savedTab === 'table' || savedTab === 'storage') {
                        setActiveTab(savedTab);
                    }
                } catch (e) {
                    console.error('Failed to restore admin tab:', e);
                }
            }
        }
    }, [userEmail]);

    useEffect(() => {
        if (userEmail) {
            localStorage.setItem(
                `lastState_${userEmail.trim().toLowerCase()}_admin`,
                JSON.stringify({ pathname: '/admin', activeTab })
            );
        }
    }, [activeTab, userEmail]);

    const handleLogout = async () => {
        await logoutAction();
        router.push('/login?type=admin');
        router.refresh();
    };

    return (
        <AdminContext.Provider
            value={{
                userName,
                activeTab,
                setActiveTab,
                handleLogout,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminContext() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdminContext must be used within an AdminProvider');
    }
    return context;
}
