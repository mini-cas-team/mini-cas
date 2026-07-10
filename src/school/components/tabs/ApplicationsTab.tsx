'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolContext } from '@/school/context/SchoolContext';
import { getSchoolApplications } from '@/lib/schoolActions';
import { Search, Loader2, Calendar, FileText, CheckCircle, GraduationCap } from 'lucide-react';

interface ApplicationData {
    id: string;
    status: string;
    include_gre: boolean;
    include_gmat: boolean;
    created_at: string;
    student_name: string;
    student_email: string;
    student_undergrad: string;
}

export default function ApplicationsTab() {
    const { currentSchool } = useSchoolContext();
    const [applications, setApplications] = useState<ApplicationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function loadApplications() {
            if (!currentSchool?.id) return;
            setIsLoading(true);
            try {
                const res = await getSchoolApplications(Number(currentSchool.id));
                if (res.success) {
                    setApplications(res.data || []);
                } else {
                    setErrorMsg(res.error || 'Failed to load applications.');
                }
            } catch (err: any) {
                console.error(err);
                setErrorMsg(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }
        loadApplications();
    }, [currentSchool]);

    const filteredApplications = applications.filter(app => {
        const query = searchQuery.toLowerCase();
        return (
            app.student_name?.toLowerCase().includes(query) ||
            app.student_email?.toLowerCase().includes(query) ||
            app.student_undergrad?.toLowerCase().includes(query) ||
            app.status?.toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm text-gray-500 font-medium">Loading applications...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                {errorMsg}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Summary stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Applications of {currentSchool?.name || 'University of Pennsylvania'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        View and manage all students who have submitted applications to your institution.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Applicants</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{applications.length}</p>
                    </div>
                </div>
            </div>

            {/* Filter / Search Controls */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400 ml-1" />
                <input
                    type="text"
                    placeholder="Search by student name, email, or undergraduate institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-700 placeholder-gray-400 focus:ring-0"
                />
            </div>

            {/* Applications List */}
            {filteredApplications.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Undergrad Institution</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Test Scores Included</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submission Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 text-sm">{app.student_name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{app.student_email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                                <span>{app.student_undergrad || 'Not Specified'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                    app.include_gre 
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                        : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                }`}>
                                                    GRE: {app.include_gre ? 'Yes' : 'No'}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                    app.include_gmat 
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                        : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                }`}>
                                                    GMAT: {app.include_gmat ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(app.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                                app.status === 'submitted' 
                                                    ? 'bg-emerald-500/10 text-emerald-700' 
                                                    : 'bg-amber-500/10 text-amber-700'
                                            }`}>
                                                {app.status === 'submitted' && <CheckCircle className="w-3 h-3" />}
                                                {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white py-16 text-center border border-dashed border-gray-200 rounded-3xl">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold text-base">No Applications Found</p>
                    <p className="text-xs text-gray-400 mt-1">Try modifying your search or filters.</p>
                </div>
            )}
        </div>
    );
}
