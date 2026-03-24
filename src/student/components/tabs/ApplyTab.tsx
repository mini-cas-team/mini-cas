'use client';

import { useState, useEffect } from 'react';
import { useStudentContext } from '@/student/context/StudentContext';
import { FileText, ChevronDown, Trash2, Building2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSchools } from '@/lib/schoolActions';
import { generateApplicationPdf } from '@/lib/pdfGenerator';

export default function ApplyTab() {
    const { studentData } = useStudentContext();
    const [selectedLetterPaths, setSelectedLetterPaths] = useState<string[]>([]);
    const [dropdownLettersOpen, setDropdownLettersOpen] = useState(false);

    const [selectedTranscriptPaths, setSelectedTranscriptPaths] = useState<string[]>([]);
    const [dropdownTranscriptsOpen, setDropdownTranscriptsOpen] = useState(false);

    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchools, setSelectedSchools] = useState<number[]>([]);
    const [dropdownSchoolsOpen, setDropdownSchoolsOpen] = useState(false);

    const [includeGre, setIncludeGre] = useState(false);
    const [includeGmat, setIncludeGmat] = useState(false);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        async function loadSchools() {
            const data = await getSchools();
            setSchools(data || []);
        }
        loadSchools();
    }, []);

    const toggleLetter = (path: string) => {
        setSelectedLetterPaths(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const toggleTranscript = (path: string) => {
        setSelectedTranscriptPaths(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const toggleSchool = (id: number) => {
        setSelectedSchools(prev => {
            if (prev.includes(id)) return prev.filter(s => s !== id);
            return [...prev, id];
        });
    };

    const selectedLetters = studentData.recommendation_letters?.filter(l => selectedLetterPaths.includes(l.path)) || [];
    const selectedTranscripts = studentData.transcripts?.filter(t => selectedTranscriptPaths.includes(t.path)) || [];
    const activeSchools = schools.filter(s => selectedSchools.includes(s.id));

    const handlePreview = async () => {
        if (!activeSchools.length) {
            alert('Please select at least one program to preview your application.');
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const result = await generateApplicationPdf({
                school: activeSchools[0],
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-indigo-900 mb-6">Submit Application</h2>

            <div className="space-y-8">

                {/* Profile Details (All fields, labels highlighted, title removed) */}
                <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-700">
                        <p><span className="font-bold text-indigo-900 mr-2">Name:</span>{studentData.name}</p>
                        <p><span className="font-bold text-indigo-900 mr-2">Email:</span>{studentData.email || 'N/A'}</p>
                        <p><span className="font-bold text-indigo-900 mr-2">Address:</span>{studentData.address || 'N/A'}</p>
                        <p><span className="font-bold text-indigo-900 mr-2">College:</span>{studentData.college_university || 'N/A'}</p>
                        <p><span className="font-bold text-indigo-900 mr-2">Major:</span>{studentData.major || 'N/A'}</p>
                    </div>
                </div>

                {/* Select Program */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownSchoolsOpen(!dropdownSchoolsOpen)}
                        className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                            Select Program (School)
                            {selectedSchools.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs ml-1">
                                    {selectedSchools.length}
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownSchoolsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownSchoolsOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-xl max-h-60 overflow-auto p-2">
                            {schools.length > 0 ? (
                                schools.map((school) => (
                                    <label key={school.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                            checked={selectedSchools.includes(school.id)}
                                            onChange={() => toggleSchool(school.id)}
                                        />
                                        <div>
                                            <span className="block text-sm font-semibold text-gray-800">{school.name}</span>
                                            <span className="block text-xs text-gray-500">{school.location}</span>
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">Loading school database...</div>
                            )}
                        </div>
                    )}

                    {/* Normal Text Selection Display */}
                    {activeSchools.length > 0 && (
                        <div className="mt-3 px-2 space-y-1">
                            {activeSchools.map((school) => (
                                <div key={school.id} className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 group">
                                    <span className="font-medium">• {school.name} <span className="text-gray-400 font-normal">({school.location})</span></span>
                                    <button onClick={() => toggleSchool(school.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Exam Scores (Action Row Styling) */}
                <div className="flex flex-col gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm w-full">
                    <span className="font-semibold text-gray-700">Exam Scores</span>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <input
                                type="checkbox"
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                checked={includeGre}
                                onChange={(e) => setIncludeGre(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-gray-600">GRE ({studentData.exams?.gre || 'N/A'})</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <input
                                type="checkbox"
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                checked={includeGmat}
                                onChange={(e) => setIncludeGmat(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-gray-600">GMAT ({studentData.exams?.gmat || 'N/A'})</span>
                        </label>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Recommendation Letters */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownLettersOpen(!dropdownLettersOpen)}
                        className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                            Select Recommendation Letters
                            {selectedLetterPaths.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs ml-1">
                                    {selectedLetterPaths.length}
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownLettersOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownLettersOpen && (
                        <div className="absolute z-10 w-full md:w-96 mt-2 bg-white border border-gray-100 shadow-xl rounded-xl max-h-60 overflow-auto p-2">
                            {studentData.recommendation_letters?.length > 0 ? (
                                studentData.recommendation_letters.map((letter, idx) => (
                                    <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                            checked={selectedLetterPaths.includes(letter.path)}
                                            onChange={() => toggleLetter(letter.path)}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{letter.name}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">No uploaded letters available. Check the Recommend Letter tab!</div>
                            )}
                        </div>
                    )}

                    {/* Normal Text Selection Display */}
                    {selectedLetters.length > 0 && (
                        <div className="mt-3 px-2 space-y-1">
                            {selectedLetters.map((letter, index) => (
                                <div key={index} className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 group">
                                    <span className="flex items-center gap-2">
                                        • <a href={supabase.storage.from('recommendationLetter').getPublicUrl(letter.path).data.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-500" /> {letter.name}</a>
                                    </span>
                                    <button onClick={() => toggleLetter(letter.path)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Official Transcripts */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownTranscriptsOpen(!dropdownTranscriptsOpen)}
                        className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                            Select Official Transcripts
                            {selectedTranscriptPaths.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs ml-1">
                                    {selectedTranscriptPaths.length}
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownTranscriptsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownTranscriptsOpen && (
                        <div className="absolute z-10 w-full md:w-96 mt-2 bg-white border border-gray-100 shadow-xl rounded-xl max-h-60 overflow-auto p-2">
                            {studentData.transcripts?.length > 0 ? (
                                studentData.transcripts.map((transcript, idx) => (
                                    <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                            checked={selectedTranscriptPaths.includes(transcript.path)}
                                            onChange={() => toggleTranscript(transcript.path)}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{transcript.name}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">No uploaded transcripts available. Check the Transcripts tab!</div>
                            )}
                        </div>
                    )}

                    {/* Normal Text Selection Display */}
                    {selectedTranscripts.length > 0 && (
                        <div className="mt-3 px-2 space-y-1">
                            {selectedTranscripts.map((transcript, index) => (
                                <div key={index} className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 group">
                                    <span className="flex items-center gap-2">
                                        • <a href={supabase.storage.from('transcripts').getPublicUrl(transcript.path).data.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-500" /> {transcript.name}</a>
                                    </span>
                                    <button onClick={() => toggleTranscript(transcript.path)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-4 justify-end">
                    <button
                        onClick={handlePreview}
                        disabled={isGeneratingPdf}
                        className="px-6 py-3 font-medium text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                        {isGeneratingPdf ? 'Generating PDF...' : 'Preview'}
                    </button>
                    <button className="px-6 py-3 font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                        Submit Application
                    </button>
                </div>
            </div>
        </div>
    );
}
