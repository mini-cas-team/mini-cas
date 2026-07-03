'use client';

import { useState } from 'react';
import { User, Mail, UploadCloud, CheckCircle, AlertCircle, Loader2, LogOut, Check, X, FileText, Building2, Trash2 } from 'lucide-react';
import { verifyProviderLogin, getProviderLettersByStudentId } from '@/lib/studentActions';
import { getUploadUrlAction, deleteFileAction } from '@/lib/storageActions';

interface ProviderInfo {
    id: number;
    provider: string;
    provider_email: string | null;
    student_id: string;
    student_email: string;
}

interface LetterRecord {
    provider_id: number;
    student_id: string;
    school: string;
    letters: string;
    acc_view: boolean;
    uploaded?: boolean;
}

export default function LetterPortalPage() {
    // Login form inputs
    const [providerName, setProviderName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Active session details
    const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
    const [lettersList, setLettersList] = useState<LetterRecord[]>([]);

    // Upload status trackers mapping: S3 path key -> status string ('idle' | 'uploading' | 'success' | 'error')
    const [uploadStatuses, setUploadStatuses] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

    // Handle Login verification
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = providerName.trim();
        const trimmedEmail = studentEmail.trim();

        if (!trimmedName || !trimmedEmail) {
            setErrorMsg('Please enter both provider name and student email.');
            return;
        }

        setIsLoggingIn(true);
        setErrorMsg(null);

        try {
            const res = await verifyProviderLogin(trimmedName, trimmedEmail);
            if (res.success && res.provider) {
                const info: ProviderInfo = {
                    id: res.provider.id,
                    provider: res.provider.provider,
                    provider_email: res.provider.provider_email,
                    student_id: res.provider.student_id,
                    student_email: res.provider.student_email
                };

                // Fetch letter records for this provider & student combination
                const lettersRes = await getProviderLettersByStudentId(info.id, info.student_id);
                if (lettersRes.success && lettersRes.data) {
                    setLettersList(lettersRes.data.filter((l: any) => l.school && l.school !== ''));
                } else {
                    setLettersList([]);
                }

                setProviderInfo(info);
            } else {
                setErrorMsg(res.error || 'Invalid provider name and/or student email.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setErrorMsg('An error occurred during verification. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Handle File Upload to S3 via local server-side API proxy to bypass CORS
    const handleFileUpload = async (lettersKey: string, file: File) => {
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setUploadStatuses(prev => ({ ...prev, [lettersKey]: 'error' }));
            setUploadErrors(prev => ({ ...prev, [lettersKey]: 'Only PDF documents are allowed.' }));
            return;
        }

        setUploadStatuses(prev => ({ ...prev, [lettersKey]: 'uploading' }));
        setUploadErrors(prev => ({ ...prev, [lettersKey]: '' }));

        try {
            // 1. Create form data with file and S3 target key
            const formData = new FormData();
            formData.append('key', lettersKey);
            formData.append('file', file);

            // 2. POST directly to local same-origin route handler
            const uploadRes = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.success) {
                throw new Error(uploadData.error || `Upload failed with status code ${uploadRes.status}`);
            }

            setUploadStatuses(prev => ({ ...prev, [lettersKey]: 'success' }));
        } catch (err: any) {
            console.error('File upload error:', err);
            setUploadStatuses(prev => ({ ...prev, [lettersKey]: 'error' }));
            setUploadErrors(prev => ({ ...prev, [lettersKey]: err.message || 'Upload failed.' }));
        }
    };

    // Handle File Deletion from S3
    const handleDeleteFile = async (lettersKey: string) => {
        if (!confirm('Are you sure you want to delete this recommendation letter?')) return;
        try {
            const res = await deleteFileAction(lettersKey);
            if (res.success) {
                setUploadStatuses(prev => ({ ...prev, [lettersKey]: 'idle' }));
                setLettersList(prev => prev.map(l => l.letters === lettersKey ? { ...l, uploaded: false } : l));
            } else {
                alert(res.error || 'Failed to delete the file.');
            }
        } catch (err: any) {
            console.error('Delete file error:', err);
            alert(err.message || 'An error occurred while deleting the file.');
        }
    };

    const handleLogout = () => {
        setProviderInfo(null);
        setLettersList([]);
        setProviderName('');
        setStudentEmail('');
        setErrorMsg(null);
        setUploadStatuses({});
        setUploadErrors({});
    };

    // Render Login Page View
    if (!providerInfo) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none font-sans">
                {/* Background decorative glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />

                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
                        Recommendation Letter Portal
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Verify your credentials to upload recommendation letters.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-in fade-in duration-300">
                    <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-10">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {errorMsg && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2.5">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div>
                                <label htmlFor="providerName" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Provider Name
                                </label>
                                <div className="mt-2 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <input
                                        id="providerName"
                                        type="text"
                                        required
                                        value={providerName}
                                        onChange={(e) => setProviderName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="studentEmail" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Student Email
                                </label>
                                <div className="mt-2 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <input
                                        id="studentEmail"
                                        type="email"
                                        required
                                        value={studentEmail}
                                        onChange={(e) => setStudentEmail(e.target.value)}
                                        placeholder="Enter student email"
                                        className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoggingIn}
                                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {isLoggingIn ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Continue'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Render Dashboard View (Logged in)
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden font-sans">
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />

            {/* Header Navbar */}
            <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-md font-bold text-white">Recommender Portal</h1>
                            <p className="text-xs text-slate-400">Logged in as {providerInfo.provider}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full z-10">
                
                {/* Banner Banner */}
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">Application Reference</h2>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-slate-400">
                            <p>Student Email: <span className="text-indigo-400 font-semibold">{providerInfo.student_email}</span></p>
                            {providerInfo.provider_email && (
                                <p>Your Email: <span className="text-slate-300">{providerInfo.provider_email}</span></p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Letters list */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Required Letters</h3>

                    {lettersList.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-sm text-slate-500">No recommendation letters requested for this profile yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {lettersList.map((letter, idx) => {
                                const status = uploadStatuses[letter.letters] || (letter.uploaded ? 'success' : 'idle');
                                const err = uploadErrors[letter.letters];

                                return (
                                    <div key={idx} className="p-6 bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-3xl shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-indigo-500 shrink-0" />
                                                <h4 className="font-bold text-white text-md truncate">
                                                    {letter.school}
                                                </h4>
                                            </div>

                                            {/* Access View message */}
                                            <div className="flex items-center gap-1.5">
                                                {letter.acc_view ? (
                                                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs py-0.5 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                                        <Check className="w-3.5 h-3.5" />
                                                        you can view provider's letter. click to change
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400 font-semibold text-xs py-0.5 px-2 bg-slate-500/10 border border-slate-500/10 rounded-md">
                                                        <X className="w-3.5 h-3.5" />
                                                        you cannot view provider's letter. click to change
                                                    </span>
                                                )}
                                            </div>

                                            {err && (
                                                <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {err}
                                                </p>
                                            )}
                                        </div>

                                        {/* Uploader section */}
                                        <div className="shrink-0 flex items-center gap-3">
                                            {status === 'success' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-semibold text-sm">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Uploaded
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteFile(letter.letters)}
                                                        className="p-2.5 bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                                                        title="Delete recommendation letter"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-sm shadow-indigo-600/10 transition-all active:scale-95">
                                                    {status === 'uploading' ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Uploading...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud className="w-4 h-4" />
                                                            <span>Upload PDF</span>
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        disabled={status === 'uploading'}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFileUpload(letter.letters, file);
                                                        }}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
