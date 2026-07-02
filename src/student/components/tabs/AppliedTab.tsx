'use client';

import { useState, useEffect } from 'react';
import { useStudentContext } from '@/student/context/StudentContext';
import { getApplications, getSchoolQuestions, getApplicationAnswers } from '@/lib/studentActions';
import { Building2, CheckCircle2, CalendarCheck, X, FileText } from 'lucide-react';

export default function AppliedTab() {
    const { studentData } = useStudentContext();
    const [submittedSchools, setSubmittedSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [modalQuestions, setModalQuestions] = useState<any[]>([]);
    const [modalAnswers, setModalAnswers] = useState<Record<number, string>>({});
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        async function load() {
            if (!studentData.id) return;
            const res = await getApplications(studentData.id);
            if (res.success && res.data) {
                const submitted = res.data.filter((a: any) => a.status === 'submitted');
                setSubmittedSchools(submitted);
            }
            setLoading(false);
        }
        load();
    }, [studentData.id]);

    const handleCardClick = async (app: any) => {
        setSelectedApp(app);
        setLoadingDetails(true);
        try {
            const qRes = await getSchoolQuestions(app.school_id);
            const aRes = await getApplicationAnswers(app.id);
            if (qRes.success && qRes.data) {
                setModalQuestions(qRes.data);
            }
            if (aRes.success && aRes.data) {
                const answerMap: Record<number, string> = {};
                aRes.data.forEach((ans: any) => {
                    answerMap[ans.question_id] = ans.answer;
                });
                setModalAnswers(answerMap);
            }
        } catch (err) {
            console.error('Error fetching submission details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getLetterName = (path: string) => {
        const match = studentData.recommendation_letters?.find(l => l.path === path);
        return match ? match.name : path.split('/').pop() || 'Document';
    };

    const getTranscriptName = (path: string) => {
        const match = studentData.transcripts?.find(t => t.path === path);
        return match ? match.name : path.split('/').pop() || 'Transcript';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-gray-400 animate-pulse text-sm">Loading submitted applications...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-50 p-2 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Submitted Applications</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Schools you have officially applied to</p>
                </div>
            </div>

            {submittedSchools.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {submittedSchools.map((app) => (
                        <div
                            key={app.id}
                            onClick={() => handleCardClick(app)}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-green-400 hover:shadow-md cursor-pointer transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-green-50 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-800">
                                        {app.school_name || `School #${app.school_id}`}
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        {app.school_location || ''}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-green-600">
                                <CalendarCheck className="w-4 h-4" />
                                <span className="text-xs font-semibold">
                                    Submitted {app.updated_at
                                        ? new Date(app.updated_at).toLocaleDateString()
                                        : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center text-gray-400 text-sm bg-gray-50/30">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No submitted applications yet. Submit an application from the Apply tab to see it here.
                </div>
            )}

            {/* Read-Only Application Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedApp.school_name} Application</h3>
                                <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Submitted on {selectedApp.updated_at ? new Date(selectedApp.updated_at).toLocaleDateString() : ''}
                                </p>
                            </div>
                            <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
                            {loadingDetails ? (
                                <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
                                    Loading application details...
                                </div>
                            ) : (
                                <>
                                    {/* Profile Summary */}
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-indigo-500 pl-3 text-sm uppercase tracking-wider">Applicant Info</h4>
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-700">
                                            <p><span className="font-semibold text-gray-500 mr-2">Name:</span> {studentData.name}</p>
                                            <p><span className="font-semibold text-gray-500 mr-2">Email:</span> {studentData.email || 'N/A'}</p>
                                            <p><span className="font-semibold text-gray-500 mr-2">Address:</span> {studentData.address || 'N/A'}</p>
                                            <p><span className="font-semibold text-gray-500 mr-2">College:</span> {studentData.college_university || 'N/A'}</p>
                                            <p><span className="font-semibold text-gray-500 mr-2">Major:</span> {studentData.major || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Test Scores */}
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-indigo-500 pl-3 text-sm uppercase tracking-wider">Standard Test Scores</h4>
                                        <div className="flex gap-6 text-sm text-gray-700">
                                            <p>
                                                <span className="font-semibold text-gray-500 mr-2">GRE:</span> 
                                                {selectedApp.include_gre ? `${studentData.exams?.gre || 'N/A'} (Included)` : 'Not Included'}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-gray-500 mr-2">GMAT:</span> 
                                                {selectedApp.include_gmat ? `${studentData.exams?.gmat || 'N/A'} (Included)` : 'Not Included'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Selected Letters */}
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-indigo-500 pl-3 text-sm uppercase tracking-wider">Recommendation Letters</h4>
                                        {(() => {
                                            const paths = Array.isArray(selectedApp.selected_letter_paths)
                                                ? selectedApp.selected_letter_paths
                                                : typeof selectedApp.selected_letter_paths === 'string'
                                                    ? JSON.parse(selectedApp.selected_letter_paths || '[]')
                                                    : [];
                                            return paths.length > 0 ? (
                                                <div className="space-y-2 mt-2">
                                                    {paths.map((path: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                            <a href={`/api/documents?key=${encodeURIComponent(path)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 font-medium">
                                                                {getLetterName(path)}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No recommendation letters attached.</p>
                                            );
                                        })()}
                                    </div>

                                    {/* Selected Transcripts */}
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-indigo-500 pl-3 text-sm uppercase tracking-wider">Official Transcripts</h4>
                                        {(() => {
                                            const paths = Array.isArray(selectedApp.selected_transcript_paths)
                                                ? selectedApp.selected_transcript_paths
                                                : typeof selectedApp.selected_transcript_paths === 'string'
                                                    ? JSON.parse(selectedApp.selected_transcript_paths || '[]')
                                                    : [];
                                            return paths.length > 0 ? (
                                                <div className="space-y-2 mt-2">
                                                    {paths.map((path: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                            <a href={`/api/documents?key=${encodeURIComponent(path)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 font-medium">
                                                                {getTranscriptName(path)}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No transcripts attached.</p>
                                            );
                                        })()}
                                    </div>

                                    {/* Custom Questions */}
                                    {modalQuestions.length > 0 && (
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                            <h4 className="font-bold text-gray-900 border-l-4 border-indigo-500 pl-3 text-sm uppercase tracking-wider">Institutional Questions</h4>
                                            <div className="space-y-4">
                                                {modalQuestions.map((q) => (
                                                    <div key={q.id} className="space-y-1">
                                                        <p className="text-sm font-semibold text-gray-700">{q.content}</p>
                                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                                                            {modalAnswers[q.id] || <span className="text-gray-400 italic">No answer provided.</span>}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
