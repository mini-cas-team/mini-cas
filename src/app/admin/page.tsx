"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
    id: number;
    created_at: string;
    full_name: string;
    email: string;
    phone: string;
    program: string;
    file_url: string;
    status: string; // Assuming there is a status column or we simulate it
};

export default function AdminPortal() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(applications.map(app => app.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} application(s)? This will also delete associated files.`)) return;

        setIsDeleting(true);
        try {
            const appsToDelete = applications.filter(app => selectedIds.includes(app.id));

            // 1. Delete files from Supabase Storage
            const filesToDelete = appsToDelete
                .filter(app => app.file_url)
                .map(app => app.file_url.split('/').pop())
                .filter((name): name is string => !!name);

            if (filesToDelete.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from("transcripts")
                    .remove(filesToDelete);
                if (storageError) console.error("Error deleting files:", storageError);
            }

            // 2. Delete records from database
            const { error: dbError } = await supabase
                .from("applications")
                .delete()
                .in("id", selectedIds);

            if (dbError) throw dbError;

            // 3. Update UI
            setApplications(prev => prev.filter(app => !selectedIds.includes(app.id)));
            setSelectedIds([]);
        } catch (error: any) {
            console.error("Deletion Error:", error);
            alert("Error: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        async function fetchApplications() {
            setLoading(true);
            const { data, error } = await supabase
                .from("applications")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching applications:", error);
            } else {
                setApplications(data || []);
            }
            setLoading(false);
        }

        fetchApplications();
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        Administrator Portal
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Review and manage student applications.
                    </p>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 text-lg font-medium text-gray-900 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <span>Student Applications</span>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={isDeleting}
                                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors disabled:bg-red-400"
                                >
                                    {isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
                                </button>
                            )}
                        </div>
                        {loading && <span className="text-sm text-gray-500">Loading applications...</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            checked={applications.length > 0 && selectedIds.length === applications.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transcript</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                    checked={selectedIds.includes(app.id)}
                                                    onChange={() => handleSelectOne(app.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {app.full_name}
                                                <div className="text-xs text-gray-500 font-normal">{app.email}</div>
                                                <div className="text-xs text-gray-500 font-normal">{app.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {app.program}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {app.file_url ? (
                                                    <a href={app.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 underline">
                                                        View Data
                                                    </a>
                                                ) : (
                                                    "N/A"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {app.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded transition-colors">
                                                    Approve
                                                </button>
                                                <button className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded transition-colors">
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
