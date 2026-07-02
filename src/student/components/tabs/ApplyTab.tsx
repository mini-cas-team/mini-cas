'use client';

import { useState, useEffect } from 'react';
import { useStudentContext } from '@/student/context/StudentContext';
import { FileText, ChevronDown, Trash2, Building2, X, Search } from 'lucide-react';
import { getSchools, createNewSchool } from '@/lib/schoolActions';
import { generateApplicationPdf } from '@/lib/pdfGenerator';
import {
    getApplications,
    addApplication,
    removeApplication,
    updateApplicationAction,
    getSchoolQuestions,
    getApplicationAnswers,
    saveApplicationAnswers,
    submitApplication
} from '@/lib/studentActions';

export default function ApplyTab() {
    const {
        studentData,
        applyingSchoolId,
        setApplyingSchoolId,
        currentView,
        setCurrentView,
        setActiveTab
    } = useStudentContext();

    const [selectedLetterPaths, setSelectedLetterPaths] = useState<string[]>([]);
    const [selectedTranscriptPaths, setSelectedTranscriptPaths] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchoolIds, setSelectedSchoolIds] = useState<number[]>([]);
    const [submittedSchoolIds, setSubmittedSchoolIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // DB state
    const [dbApplications, setDbApplications] = useState<any[]>([]);
    const [schoolQuestions, setSchoolQuestions] = useState<any[]>([]);
    const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);

    const [includeGre, setIncludeGre] = useState(false);
    const [includeGmat, setIncludeGmat] = useState(false);
    const [isDraftDirty, setIsDraftDirty] = useState(false);
    const [isLettersModalOpen, setIsLettersModalOpen] = useState(false);
    const [isTranscriptsModalOpen, setIsTranscriptsModalOpen] = useState(false);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolLocation, setNewSchoolLocation] = useState('');
    const [isCreatingSchool, setIsCreatingSchool] = useState(false);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                // Load Schools
                const schoolData = await getSchools();
                setSchools(schoolData || []);

                // Load Applications
                if (studentData?.id) {
                    const res = await getApplications(studentData.id);
                    if (res.success && res.data) {
                        const drafts = res.data.filter((a: any) => a.status === 'draft');
                        const submitted = res.data.filter((a: any) => a.status === 'submitted');
                        setDbApplications(drafts);
                        setSelectedSchoolIds(drafts.map(a => a.school_id));
                        setSubmittedSchoolIds(submitted.map(a => a.school_id));
                    }
                }
            } catch (err) {
                console.error('Error loading data:', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [studentData?.id]);

    const addSchool = async (id: number) => {
        if (!selectedSchoolIds.includes(id) && studentData.id) {
            try {
                const res = await addApplication(studentData.id, id);
                if (res.success && res.data) {
                    setSelectedSchoolIds(prev => [...prev, id]);
                    setDbApplications(prev => [...prev, res.data]);
                    setIsModalOpen(false);
                    setSearchQuery('');
                } else {
                    throw new Error(res.error);
                }
            } catch (err) {
                console.error('Error adding school:', err);
                alert('Failed to add school. Please try again.');
            }
        }
    };

    const removeSchool = async (id: number) => {
        if (!studentData.id) return;
        try {
            const res = await removeApplication(studentData.id, id);
            if (res.success) {
                setSelectedSchoolIds(prev => prev.filter(sId => sId !== id));
                setDbApplications(prev => prev.filter(a => a.school_id !== id));
                if (applyingSchoolId === id) {
                    setCurrentView('selection');
                    setApplyingSchoolId(null);
                }
            } else {
                throw new Error(res.error);
            }
        } catch (err) {
            console.error('Error removing school:', err);
        }
    };

    const updateApplication = async (schoolId: number, updates: any) => {
        if (!studentData.id) return;
        try {
            const res = await updateApplicationAction(studentData.id, schoolId, updates);
            if (res.success && res.data) {
                setDbApplications(prev => prev.map(a => a.school_id === schoolId ? res.data : a));
            } else {
                throw new Error(res.error);
            }
        } catch (err) {
            console.error('Error updating application:', err);
        }
    };

    const handleSave = async () => {
        if (!applyingSchoolId || !studentData.id) return;
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const updates = {
                include_gre: includeGre,
                include_gmat: includeGmat,
                selected_letter_paths: selectedLetterPaths,
                selected_transcript_paths: selectedTranscriptPaths
            };

            const res = await updateApplicationAction(studentData.id, applyingSchoolId, updates);
            if (!res.success || !res.data) throw new Error(res.error);
            setDbApplications(prev => prev.map(a => a.school_id === applyingSchoolId ? res.data : a));

            // Save Answers
            const actualAppId = res.data.id;
            if (schoolQuestions.length > 0) {
                const answerInserts = schoolQuestions.map(q => ({
                    application_id: actualAppId,
                    question_id: q.id,
                    answer: questionAnswers[q.id] || ''
                }));

                const ansRes = await saveApplicationAnswers(answerInserts);
                if (!ansRes.success) throw new Error(ansRes.error);
            }

            setSaveStatus('success');
            setIsDraftDirty(false);
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving application:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAnswers = async () => {
        if (!applyingSchoolId) return;
        const app = dbApplications.find(a => a.school_id === applyingSchoolId);
        if (!app) return;

        setIsSaving(true);
        setSaveStatus(null);
        try {
            if (schoolQuestions.length > 0) {
                const answerInserts = schoolQuestions.map(q => ({
                    application_id: app.id,
                    question_id: q.id,
                    answer: questionAnswers[q.id] || ''
                }));

                const ansRes = await saveApplicationAnswers(answerInserts);
                if (!ansRes.success) throw new Error(ansRes.error);
            }
            setSaveStatus('success');
            setIsDraftDirty(false);
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving answers:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!isDraftDirty || !applyingSchoolId) return;
        const timer = setTimeout(() => {
            if (studentData?.id) {
                handleSave();
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [isDraftDirty, applyingSchoolId, studentData?.id]);

    const selectedLetters = studentData.recommendation_letters?.filter(l => selectedLetterPaths.includes(l.path)) || [];
    const selectedTranscripts = studentData.transcripts?.filter(t => selectedTranscriptPaths.includes(t.path)) || [];
    const activeSchools = schools.filter(s => selectedSchoolIds.includes(s.id));
    const applyingSchool = schools.find(s => s.id === applyingSchoolId);
    const currentApp = dbApplications.find(a => a.school_id === applyingSchoolId);

    // Sync local state when app context changes
    useEffect(() => {
        if (currentApp) {
            setIncludeGre(currentApp.include_gre || false);
            setIncludeGmat(currentApp.include_gmat || false);
            setSelectedLetterPaths(currentApp.selected_letter_paths || []);
            setSelectedTranscriptPaths(currentApp.selected_transcript_paths || []);

            // Load questions and answers for this specific school/application
            loadQuestionsAndAnswers(applyingSchoolId!, currentApp.id);
        } else {
            // Reset state while loading or if not found
            setIncludeGre(false);
            setIncludeGmat(false);
            setSelectedLetterPaths([]);
            setSelectedTranscriptPaths([]);
            setSchoolQuestions([]);
            setQuestionAnswers({});
        }
    }, [applyingSchoolId, dbApplications]);

    const loadQuestionsAndAnswers = async (schoolId: number, applicationId: number) => {
        try {
            // Fetch Questions
            const qRes = await getSchoolQuestions(schoolId);
            if (qRes.success && qRes.data) {
                setSchoolQuestions(qRes.data);
            }

            // Fetch existing answers
            const aRes = await getApplicationAnswers(applicationId);
            if (aRes.success && aRes.data) {
                const answerMap: Record<number, string> = {};
                aRes.data.forEach(a => {
                    answerMap[a.question_id] = a.answer;
                });
                setQuestionAnswers(answerMap);
            }
        } catch (err) {
            console.error('Error loading questions/answers:', err);
        }
    };

    const handleCreateSchool = async () => {
        if (!newSchoolName.trim() || !newSchoolLocation.trim() || !studentData?.id) return;
        setIsCreatingSchool(true);
        try {
            const schoolRes = await createNewSchool(newSchoolName.trim(), newSchoolLocation.trim());
            if (!schoolRes.success || !schoolRes.data) {
                throw new Error(schoolRes.error || 'Failed to create school');
            }
            const newSchool = schoolRes.data;
            
            setSchools(prev => [...prev, newSchool]);

            const appRes = await addApplication(studentData.id, newSchool.id);
            if (!appRes.success || !appRes.data) {
                throw new Error(appRes.error || 'Failed to create application for new school');
            }

            setSelectedSchoolIds(prev => [...prev, newSchool.id]);
            setDbApplications(prev => [...prev, appRes.data]);
            
            setNewSchoolName('');
            setNewSchoolLocation('');
            setIsCreateModalOpen(false);
            setSearchQuery('');
        } catch (err: any) {
            console.error('Error creating institution:', err);
            alert(`Failed to create institution: ${err.message}`);
        } finally {
            setIsCreatingSchool(false);
        }
    };

    const availableSchools = schools.filter(s =>
        !selectedSchoolIds.includes(s.id) &&
        !submittedSchoolIds.includes(s.id) &&
        (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleApplyClick = (schoolId: number) => {
        setApplyingSchoolId(schoolId);
        setCurrentView('submission');
    };

    const handlePreview = async () => {
        if (activeSchools.length === 0) {
            alert('Please add at least one program (school) to preview your application.');
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const result = await generateApplicationPdf({
                school: applyingSchool || activeSchools[0],
                studentData,
                selectedTranscripts,
                selectedLetters,
                includeGre,
                includeGmat
            });

            if (result.error) {
                alert('An error occurred while generating the PDF preview.');
            } else {
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while generating the PDF preview.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (currentView === 'submission' && applyingSchool) {
        return (
            <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setCurrentView('selection')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                    >
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                    <h2 className="text-2xl font-bold text-indigo-900">{applyingSchool.name} Application</h2>
                </div>

                <div className="space-y-8">
                    {/* Profile Details */}
                    <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-700">
                            <p><span className="font-bold text-indigo-900 mr-2">Name:</span>{studentData.name}</p>
                            <p><span className="font-bold text-indigo-900 mr-2">Email:</span>{studentData.email || 'N/A'}</p>
                            <p><span className="font-bold text-indigo-900 mr-2">Address:</span>{studentData.address || 'N/A'}</p>
                            <p><span className="font-bold text-indigo-900 mr-2">College:</span>{studentData.college_university || 'N/A'}</p>
                            <p><span className="font-bold text-indigo-900 mr-2">Major:</span>{studentData.major || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Exam Scores */}
                    <div className="flex flex-col gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm w-full">
                        <span className="font-semibold text-gray-700">Standard Test Scores</span>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                <input
                                    type="checkbox"
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    checked={includeGre}
                                    onChange={(e) => { setIncludeGre(e.target.checked); setIsDraftDirty(true); }}
                                />
                                <span className="text-sm font-medium text-gray-600">GRE ({studentData.exams?.gre || 'N/A'})</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                <input
                                    type="checkbox"
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    checked={includeGmat}
                                    onChange={(e) => { setIncludeGmat(e.target.checked); setIsDraftDirty(true); }}
                                />
                                <span className="text-sm font-medium text-gray-600">GMAT ({studentData.exams?.gmat || 'N/A'})</span>
                            </label>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Recommendation Letters */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsLettersModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold border border-indigo-100/50 shadow-sm active:scale-98"
                        >
                            Manage Recommendation Letters
                            {selectedLetterPaths.length > 0 && (
                                <span className="bg-indigo-600 text-white py-0.5 px-2 rounded-full text-xs font-bold ml-1">
                                    {selectedLetterPaths.length}
                                </span>
                            )}
                        </button>

                        {/* Selection Display */}
                        {selectedLetters.length > 0 && (
                            <div className="mt-3 px-2 space-y-1">
                                {selectedLetters.map((letter, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 group">
                                        <span className="flex items-center gap-2">
                                            • <a href={`/api/documents?key=${encodeURIComponent(letter.path)}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-500" /> {letter.name}</a>
                                        </span>
                                        <button onClick={() => {
                                            const newPaths = selectedLetterPaths.filter(p => p !== letter.path);
                                            setSelectedLetterPaths(newPaths);
                                            setIsDraftDirty(true);
                                        }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Official Transcripts */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsTranscriptsModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold border border-indigo-100/50 shadow-sm active:scale-98"
                        >
                            Manage Transcripts
                            {selectedTranscriptPaths.length > 0 && (
                                <span className="bg-indigo-600 text-white py-0.5 px-2 rounded-full text-xs font-bold ml-1">
                                    {selectedTranscriptPaths.length}
                                </span>
                            )}
                        </button>

                        {/* Selection Display */}
                        {selectedTranscripts.length > 0 && (
                            <div className="mt-3 px-2 space-y-1">
                                {selectedTranscripts.map((transcript, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 group">
                                        <span className="flex items-center gap-2">
                                            • <a href={`/api/documents?key=${encodeURIComponent(transcript.path)}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-500" /> {transcript.name}</a>
                                        </span>
                                        <button onClick={() => {
                                            const newPaths = selectedTranscriptPaths.filter(p => p !== transcript.path);
                                            setSelectedTranscriptPaths(newPaths);
                                            setIsDraftDirty(true);
                                        }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* School Specific Questions */}
                    {schoolQuestions.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 border-l-4 border-indigo-500 pl-4">Institutional Questions</h3>
                                <div className="flex items-center gap-3">
                                    {saveStatus === 'success' && <span className="text-green-500 text-sm font-medium animate-pulse">Changes Saved!</span>}
                                    {saveStatus === 'error' && <span className="text-red-500 text-sm font-medium">Save Failed</span>}
                                    <button
                                        onClick={handleSaveAnswers}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Answers'}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {schoolQuestions.map((q) => (
                                    <div key={q.id} className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">{q.content}</label>
                                        <textarea
                                            value={questionAnswers[q.id] || ''}
                                            onChange={(e) => {
                                                setQuestionAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                                                setIsDraftDirty(true);
                                            }}
                                            placeholder="Please type your answer here..."
                                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 min-h-[100px] shadow-sm hover:border-gray-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex gap-4 justify-end items-center">
                        <button
                            onClick={handlePreview}
                            disabled={isGeneratingPdf}
                            className="px-6 py-3 font-medium text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                            {isGeneratingPdf ? 'Generating PDF...' : 'Preview'}
                        </button>
                        <button
                            onClick={async () => {
                                if (!studentData.id || !applyingSchoolId) return;
                                setIsSubmitting(true);
                                const res = await submitApplication(studentData.id, applyingSchoolId);
                                if (res.success) {
                                    // Remove from draft list in local state
                                    setDbApplications(prev => prev.filter((a: any) => a.school_id !== applyingSchoolId));
                                    setSelectedSchoolIds(prev => prev.filter(id => id !== applyingSchoolId));
                                    setSubmittedSchoolIds(prev => [...prev, applyingSchoolId]);
                                    setCurrentView('selection');
                                    setApplyingSchoolId(null);
                                    setActiveTab('applied' as any);
                                } else {
                                    alert('Failed to submit application. Please try again.');
                                }
                                setIsSubmitting(false);
                            }}
                            disabled={isSubmitting}
                            className="px-6 py-3 font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Letters Selection Modal */}
            {isLettersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Select Recommendation Letters</h3>
                                <p className="text-xs text-gray-500 mt-1">Select the letters you wish to attach to this application.</p>
                            </div>
                            <button onClick={() => setIsLettersModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto space-y-2">
                            {studentData.recommendation_letters?.length > 0 ? (
                                studentData.recommendation_letters.map((letter, idx) => (
                                    <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                            checked={selectedLetterPaths.includes(letter.path)}
                                            onChange={() => {
                                                const newPaths = selectedLetterPaths.includes(letter.path)
                                                    ? selectedLetterPaths.filter(p => p !== letter.path)
                                                    : [...selectedLetterPaths, letter.path];
                                                setSelectedLetterPaths(newPaths);
                                                setIsDraftDirty(true);
                                            }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{letter.name}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">No uploaded letters available. Check the Recommend Letter tab!</div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsLettersModalOpen(false)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transcripts Selection Modal */}
            {isTranscriptsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Select Academic Transcripts</h3>
                                <p className="text-xs text-gray-500 mt-1">Select the official transcripts you wish to attach.</p>
                            </div>
                            <button onClick={() => setIsTranscriptsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto space-y-2">
                            {studentData.transcripts?.length > 0 ? (
                                studentData.transcripts.map((transcript, idx) => (
                                    <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                            checked={selectedTranscriptPaths.includes(transcript.path)}
                                            onChange={() => {
                                                const newPaths = selectedTranscriptPaths.includes(transcript.path)
                                                    ? selectedTranscriptPaths.filter(p => p !== transcript.path)
                                                    : [...selectedTranscriptPaths, transcript.path];
                                                setSelectedTranscriptPaths(newPaths);
                                                setIsDraftDirty(true);
                                            }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{transcript.name}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">No uploaded transcripts available. Check the Transcripts tab!</div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsTranscriptsModalOpen(false)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </>
        );
    }

    // Selection View (Standard)
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-indigo-900 mb-6">Select Schools</h2>

            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">Chosen Programs ({activeSchools.length})</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                    >
                        <Building2 className="w-4 h-4" />
                        Add School
                    </button>
                </div>

                {/* Selected Schools List */}
                <div className="space-y-3">
                    {activeSchools.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {activeSchools.map((school) => (
                                <div
                                    key={school.id}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                                    onClick={() => handleApplyClick(school.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-800">{school.name}</span>
                                            <span className="block text-xs text-gray-500">{school.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Apply Now →</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSchool(school.id);
                                            }}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center text-gray-400 text-sm bg-gray-50/30">
                            <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            No schools selected. Click "Add School" to start.
                        </div>
                    )}
                </div>

                {/* Search Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                                <h3 className="text-xl font-bold text-gray-900">Select an Institution</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search by school name or location..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && availableSchools.length === 0) {
                                                e.preventDefault();
                                                setIsModalOpen(false);
                                                setIsCreateModalOpen(true);
                                                setNewSchoolName(searchQuery);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
                                    {availableSchools.length > 0 ? (
                                        availableSchools.map((school) => (
                                            <button
                                                key={school.id}
                                                onClick={() => addSchool(school.id)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-indigo-100 group text-left"
                                            >
                                                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-800">{school.name}</span>
                                                    <span className="block text-xs text-gray-500">{school.location}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            {searchQuery ? 'No matching schools found.' : 'All schools have been added.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100">
                                <p className="text-xs text-gray-400 text-center font-medium">Found {availableSchools.length} institutions in database</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Institution Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                                <h3 className="text-xl font-bold text-gray-900">Create New Institution</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Institution Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Boston University"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={newSchoolName}
                                        onChange={(e) => setNewSchoolName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Boston, MA"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={newSchoolLocation}
                                        onChange={(e) => setNewSchoolLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSchool}
                                    disabled={!newSchoolName.trim() || !newSchoolLocation.trim() || isCreatingSchool}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {isCreatingSchool ? 'Creating...' : 'Complete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Letters Selection Modal */}
                {isLettersModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Select Recommendation Letters</h3>
                                    <p className="text-xs text-gray-500 mt-1">Select the letters you wish to attach to this application.</p>
                                </div>
                                <button onClick={() => setIsLettersModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 max-h-96 overflow-y-auto space-y-2">
                                {studentData.recommendation_letters?.length > 0 ? (
                                    studentData.recommendation_letters.map((letter, idx) => (
                                        <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                            <input
                                                type="checkbox"
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                checked={selectedLetterPaths.includes(letter.path)}
                                                onChange={() => {
                                                    const newPaths = selectedLetterPaths.includes(letter.path)
                                                        ? selectedLetterPaths.filter(p => p !== letter.path)
                                                        : [...selectedLetterPaths, letter.path];
                                                    setSelectedLetterPaths(newPaths);
                                                    setIsDraftDirty(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{letter.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-gray-500 text-center">No uploaded letters available. Check the Recommend Letter tab!</div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setIsLettersModalOpen(false)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transcripts Selection Modal */}
                {isTranscriptsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Select Academic Transcripts</h3>
                                    <p className="text-xs text-gray-500 mt-1">Select the official transcripts you wish to attach.</p>
                                </div>
                                <button onClick={() => setIsTranscriptsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 max-h-96 overflow-y-auto space-y-2">
                                {studentData.transcripts?.length > 0 ? (
                                    studentData.transcripts.map((transcript, idx) => (
                                        <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                            <input
                                                type="checkbox"
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                checked={selectedTranscriptPaths.includes(transcript.path)}
                                                onChange={() => {
                                                    const newPaths = selectedTranscriptPaths.includes(transcript.path)
                                                        ? selectedTranscriptPaths.filter(p => p !== transcript.path)
                                                        : [...selectedTranscriptPaths, transcript.path];
                                                    setSelectedTranscriptPaths(newPaths);
                                                    setIsDraftDirty(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{transcript.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-gray-500 text-center">No uploaded transcripts available. Check the Transcripts tab!</div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setIsTranscriptsModalOpen(false)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
