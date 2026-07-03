'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Trash2, Edit2, Plus, ArrowLeft, X, Building2, CheckCircle, Send, FileText, Loader2, Eye, Search } from 'lucide-react';
import { getSchools } from '@/lib/schoolActions';
import { useStudentContext } from '@/student/context/StudentContext';
import {
    createProvider, 
    deleteProvider, 
    deleteProviderLettersExcluding, 
    addProviderLetter, 
    getProviders, 
    getProviderLetters,
    getProviderLettersByStudentId,
    updateProviderLetterView
} from '@/lib/studentActions';

interface Recommender {
    id: string;
    name: string;
    email: string;
    schools: string[]; // List of school names
    status: 'pending' | 'requested';
}

export default function RecommendLetterTab() {
    const { studentData } = useStudentContext();

    // List of providers in local state loaded from DB
    const [providers, setProviders] = useState<Recommender[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    
    // Inputs for adding a new provider
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    // Editing state
    const [editingProvider, setEditingProvider] = useState<Recommender | null>(null);
    const [providerLetters, setProviderLetters] = useState<any[]>([]);

    // Database schools list (for university selector modal)
    const [allSchools, setAllSchools] = useState<any[]>([]);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [schoolSearch, setSchoolSearch] = useState('');
    const [selectedSchoolsInModal, setSelectedSchoolsInModal] = useState<string[]>([]);

    // Notification toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Track whether saved editing state has been restored from localStorage
    const [hasRestored, setHasRestored] = useState(false);

    // Fetch schools and providers on mount / email change
    useEffect(() => {
        async function loadData() {
            if (!studentData?.email) return;
            setLoadingProviders(true);
            try {
                // 1. Fetch schools for modal
                const schoolData = await getSchools();
                setAllSchools(schoolData || []);

                // 2. Fetch providers from RDS
                const res = await getProviders(studentData.email);
                if (res.success && res.data) {
                    const loadedList: Recommender[] = [];
                    for (const p of res.data) {
                        // Check if any letter exists in provider_letter table to verify status
                        const letterRes = await getProviderLetters(p.id, studentData.email);
                        const letters = letterRes.success && letterRes.data ? letterRes.data : [];
                        const hasLetters = letters.length > 0;
                        const schoolNames = letters.map((l: any) => l.school).filter((s: string) => s !== '' && s !== null);
                        
                        loadedList.push({
                            id: String(p.id),
                            name: p.provider,
                            email: p.provider_email || '',
                            schools: schoolNames,
                            status: hasLetters ? 'requested' : 'pending'
                        });
                    }
                    setProviders(loadedList);

                    // 3. Restore last editing provider if saved in localStorage
                    const savedEditingKey = `lastEditingProvider_${studentData.email}_student`;
                    const savedEditingStr = localStorage.getItem(savedEditingKey);
                    if (savedEditingStr) {
                        try {
                            const restored = JSON.parse(savedEditingStr);
                            const exists = loadedList.some(p => p.id === restored.id);
                            if (exists) {
                                const freshProvider = loadedList.find(p => p.id === restored.id) || restored;
                                if (studentData.id) {
                                    const letterRes = await getProviderLettersByStudentId(Number(freshProvider.id), studentData.id);
                                    if (letterRes.success && letterRes.data) {
                                        setProviderLetters(letterRes.data);
                                        const schoolNames = letterRes.data
                                            .map((l: any) => l.school)
                                            .filter((s: string) => s !== '' && s !== null);
                                        setEditingProvider({
                                            ...freshProvider,
                                            schools: schoolNames
                                        });
                                    } else {
                                        setEditingProvider(freshProvider);
                                    }
                                } else {
                                    setEditingProvider(freshProvider);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to restore last editing provider:', e);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading providers:', err);
            } finally {
                setLoadingProviders(false);
                setHasRestored(true);
            }
        }
        loadData();
    }, [studentData?.email, studentData?.id]);

    // Persist current editing provider state to localStorage
    useEffect(() => {
        if (!studentData?.email || !hasRestored) return;
        const key = `lastEditingProvider_${studentData.email}_student`;
        if (editingProvider) {
            localStorage.setItem(key, JSON.stringify(editingProvider));
        } else {
            localStorage.removeItem(key);
        }
    }, [editingProvider, studentData?.email, hasRestored]);

    // Handle show toast
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Add a new provider to the database
    const handleAddProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newName.trim();
        const trimmedEmail = newEmail.trim();

        if (!trimmedName) {
            alert('Please enter a provider name.');
            return;
        }

        if (!studentData.id) {
            alert('Student Profile record not found. Please try again.');
            return;
        }

        try {
            const res = await createProvider(trimmedName, trimmedEmail, studentData.id);
            if (res.success && res.data) {
                const newProvider: Recommender = {
                    id: String(res.data.id),
                    name: res.data.provider,
                    email: res.data.provider_email || '',
                    schools: [],
                    status: 'pending'
                };

                setProviders(prev => [...prev, newProvider]);
                setNewName('');
                setNewEmail('');
                showToast(`Provider "${trimmedName}" added successfully.`);
            } else {
                throw new Error(res.error);
            }
        } catch (err: any) {
            console.error('Error adding provider:', err);
            alert(`Failed to add provider: ${err.message}`);
        }
    };

    // Delete a provider from the database
    const handleDeleteProvider = async (id: string) => {
        const provider = providers.find(p => p.id === id);
        if (provider) {
            try {
                const res = await deleteProvider(Number(id));
                if (res.success) {
                    setProviders(prev => prev.filter(p => p.id !== id));
                    showToast(`Provider "${provider.name}" deleted.`);
                } else {
                    throw new Error(res.error);
                }
            } catch (err: any) {
                console.error('Error deleting provider:', err);
                alert(`Failed to delete provider: ${err.message}`);
            }
        }
    };

    // Start editing a provider and fetch target schools/letters from provider_letter by provider_id and student_id
    const startEditing = async (provider: Recommender) => {
        if (!studentData.id) return;
        setProviderLetters([]);
        try {
            const res = await getProviderLettersByStudentId(Number(provider.id), studentData.id);
            if (res.success && res.data) {
                setProviderLetters(res.data);
                const schoolNames = res.data
                    .map((l: any) => l.school)
                    .filter((s: string) => s !== '' && s !== null);
                
                setEditingProvider({
                    ...provider,
                    schools: schoolNames
                });
            } else {
                setEditingProvider({ ...provider });
            }
        } catch (err) {
            console.error('Failed to fetch provider letters by student ID:', err);
            setEditingProvider({ ...provider });
        }
    };

    // Save editing state changes to the list
    const saveEditingChanges = (updated: Recommender) => {
        setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
        setEditingProvider(null);
    };

    // Multi-select modal handlers
    const openSchoolModal = () => {
        if (!editingProvider) return;
        // Pre-check schools that are already added
        setSelectedSchoolsInModal([...editingProvider.schools]);
        setSchoolSearch('');
        setIsSchoolModalOpen(true);
    };

    // Dialog close action: create records in provider_letter with unique S3 path for each letter
    const handleConfirmSchools = async () => {
        if (!editingProvider || !studentData.id || !studentData.email) return;
        
        try {
            const providerIdNum = Number(editingProvider.id);

            // 1. Delete S3 path records for schools that are no longer targeted
            await deleteProviderLettersExcluding(providerIdNum, selectedSchoolsInModal);

            // 2. Create records in provider_letter with unique S3 paths and acc_view defaulting to false
            for (const schoolName of selectedSchoolsInModal) {
                const safeSchoolName = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
                const lettersPath = `recommendationLetter/${studentData.id}_${editingProvider.id}_${safeSchoolName}.pdf`;
                await addProviderLetter(providerIdNum, studentData.id, schoolName, lettersPath, false);
            }

            // 3. Retrieve updated list of letters to refresh layout
            const letterRes = await getProviderLetters(providerIdNum, studentData.email);
            if (letterRes.success && letterRes.data) {
                setProviderLetters(letterRes.data);
            }

            // 4. Update editing local state
            setEditingProvider(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    schools: [...selectedSchoolsInModal]
                };
            });

            setIsSchoolModalOpen(false);
            showToast('Target universities and S3 letter paths successfully initialized.');
        } catch (err: any) {
            console.error('Failed to save universities:', err);
            alert(`Failed to save: ${err.message}`);
        }
    };

    const toggleSchoolSelection = (schoolName: string) => {
        setSelectedSchoolsInModal(prev =>
            prev.includes(schoolName)
                ? prev.filter(s => s !== schoolName)
                : [...prev, schoolName]
        );
    };

    // Filter available schools in the modal safely
    const filteredSchools = allSchools.filter(school => {
        const term = schoolSearch.trim().toLowerCase();
        if (!term) return true;
        const matchesName = school.name ? school.name.toLowerCase().includes(term) : false;
        const matchesLocation = school.location ? school.location.toLowerCase().includes(term) : false;
        return matchesName || matchesLocation;
    });

    if (loadingProviders) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[250px]">
                <div className="text-gray-400 animate-pulse text-sm flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    Loading recommendation providers...
                </div>
            </div>
        );
    }

    // View 1: Update/Edit View
    if (editingProvider) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                    <button
                        onClick={() => setEditingProvider(null)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-indigo-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Update Recommendation Request</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Configure requirements for {editingProvider.name}</p>
                    </div>
                </div>

                {/* Form Body */}
                <div className="space-y-6 max-w-lg">
                    {/* School Specific Section (Always Active) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Target Universities</h3>
                                <p className="text-xs text-gray-500 mt-0.5">schools need provider recommendation letter</p>
                            </div>
                            <button
                                type="button"
                                onClick={openSchoolModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all shadow-sm cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add University
                            </button>
                        </div>

                        {editingProvider.schools.length > 0 ? (
                            <div className="space-y-2">
                                {editingProvider.schools.map((schoolName, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-all">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">{schoolName}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Eye view toggle button */}
                                            {(() => {
                                                const match = providerLetters.find(l => l.school === schoolName);
                                                const isTrue = match ? !!match.acc_view : false;
                                                const tooltip = isTrue 
                                                    ? "you can view provider's letter. click to change" 
                                                    : "you cannot view provider's letter. click to change";
                                                
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!studentData.id) return;
                                                            const res = await updateProviderLetterView(Number(editingProvider.id), studentData.id, schoolName, !isTrue);
                                                            if (res.success) {
                                                                const letterRes = await getProviderLettersByStudentId(Number(editingProvider.id), studentData.id);
                                                                if (letterRes.success && letterRes.data) {
                                                                    setProviderLetters(letterRes.data);
                                                                }
                                                                showToast(`View access updated for ${schoolName}.`);
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-gray-50 rounded-lg transition-all cursor-pointer text-gray-400 hover:text-indigo-600"
                                                        title={tooltip}
                                                    >
                                                        <Eye className={`w-4.5 h-4.5 transition-colors ${isTrue ? 'text-green-600 fill-green-50/50' : 'text-gray-300'}`} />
                                                    </button>
                                                );
                                            })()}

                                            {/* Delete target university */}
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const newSchools = editingProvider.schools.filter(s => s !== schoolName);
                                                    const providerIdNum = Number(editingProvider.id);
                                                    await deleteProviderLettersExcluding(providerIdNum, newSchools);
                                                    if (studentData.email) {
                                                        const letterRes = await getProviderLetters(providerIdNum, studentData.email);
                                                        if (letterRes.success && letterRes.data) {
                                                            setProviderLetters(letterRes.data);
                                                        }
                                                    }
                                                    setEditingProvider(prev => {
                                                        if (!prev) return null;
                                                        return { ...prev, schools: newSchools };
                                                    });
                                                }}
                                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                                title="Remove university"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                                No target universities added yet. Click "Add University" to assign schools.
                            </div>
                        )}
                    </div>


                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => setEditingProvider(null)}
                        className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            if (!studentData.id || !studentData.email) return;
                            
                            if (editingProvider.schools.length === 0) {
                                alert("Please select at least one university before sending request.");
                                return;
                            }

                            // Update local list
                            setProviders(prev => prev.map(p => p.id === editingProvider.id ? {
                                ...p,
                                status: 'requested'
                            } : p));

                            setEditingProvider(null);
                            showToast(`Recommendation request sent to ${editingProvider.name}.`);
                        }}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        Send Request
                    </button>
                </div>

                {/* Multi-Select University Modal */}
                {isSchoolModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Add Universities</h3>
                                    <p className="text-xs text-gray-500 mt-1">Select schools for this recommendation letter</p>
                                </div>
                                <button onClick={() => setIsSchoolModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                <div className="relative">
                                    <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={schoolSearch}
                                        onChange={(e) => setSchoolSearch(e.target.value)}
                                        placeholder="Search school name or location..."
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-2 flex-1">
                                {filteredSchools.length > 0 ? (
                                    filteredSchools.map((school, idx) => (
                                        <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                            <input
                                                type="checkbox"
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                checked={selectedSchoolsInModal.includes(school.name)}
                                                onChange={() => toggleSchoolSelection(school.name)}
                                            />
                                            <div>
                                                <span className="block text-sm font-semibold text-gray-700">{school.name}</span>
                                                <span className="block text-xs text-gray-400">{school.location}</span>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-8 text-sm text-gray-400 text-center">
                                        No matching schools found.
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSchoolModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSchools}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
                                >
                                    Add Selected
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // View 2: Main Provider List View
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 relative animate-in fade-in duration-200">
            
            {/* Toast Notification */}
            {toastMessage && (
                <div className="absolute top-4 right-4 z-50 p-4 bg-gray-900 text-white text-sm rounded-xl flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommendation Letters</h2>
                <p className="text-gray-500">Manage your recommendation letter providers and requests.</p>
            </div>

            {/* Add Provider Form */}
            <form onSubmit={handleAddProvider} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Add Recommendation Provider</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="enter provider name"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="enter provider email (optional)"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add Provider
                    </button>
                </div>
            </form>

            {/* Provider List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Provider List ({providers.length})</h3>
                
                {providers.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/20 animate-in fade-in">
                        <User className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        No providers added yet. Use the form above to add your first recommender.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {providers.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all group animate-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">{p.name}</span>
                                            {p.status === 'requested' ? (
                                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-green-100 animate-pulse">
                                                    Request Sent
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500 font-medium">
                                            {p.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {p.email}</span>}
                                            {p.schools.length > 0 && (
                                                <span className="text-indigo-600 mt-0.5">
                                                    Specific to: {p.schools.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startEditing(p)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                        title="Configure Letter & Request"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteProvider(p.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete provider"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
