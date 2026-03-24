'use client';

import { useState } from 'react';
import { UploadCloud, Trash2, FileText, Loader2 } from 'lucide-react';
import { useStudentContext } from '@/student/context/StudentContext';
import { supabase } from '@/lib/supabase';

export default function RecommendLetterTab() {
    const { studentData, setStudentData, setIsDirty } = useStudentContext();
    const [uploading, setUploading] = useState(false);

    const letters = studentData.recommendation_letters || [];

    const handleDelete = async (index: number) => {
        const fileToDelete = letters[index];
        const newLetters = [...letters];
        newLetters.splice(index, 1);

        setStudentData(prev => ({ ...prev, recommendation_letters: newLetters }));
        setIsDirty(true);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${studentData.id}_${Date.now()}.${fileExt}`;

            // Assumes a 'recommendationLetter' bucket exists in Supabase
            const { data, error } = await supabase.storage
                .from('recommendationLetter')
                .upload(fileName, file);

            if (error) {
                console.error('Upload error', error);
                alert('Failed to upload file. Does the "recommendationLetter" storage bucket exist?');
            } else {
                const newLetter = {
                    name: file.name,
                    path: data.path,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    date: new Date().toLocaleDateString()
                };
                setStudentData(prev => ({
                    ...prev,
                    recommendation_letters: [...(prev.recommendation_letters || []), newLetter]
                }));
                setIsDirty(true);
            }
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommendation Letters</h2>
                    <p className="text-gray-500">Upload and manage your recommendation letters (PDF/Word).</p>
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-colors shadow-sm ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'}`}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Upload New'}
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            <div className="space-y-3">
                {letters.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        No recommendation letters uploaded yet.
                    </div>
                ) : (
                    letters.map((letter, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:border-gray-300">
                            <div className="flex items-center gap-4">
                                <a
                                    href={supabase.storage.from('recommendationLetter').getPublicUrl(letter.path).data.publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white rounded-xl shadow-sm hover:shadow hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group"
                                    title="View Recommendation Letter"
                                >
                                    <FileText className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                                </a>
                                <div>
                                    <p className="font-semibold text-gray-900">{letter.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{letter.date} • {letter.size}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete document"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
