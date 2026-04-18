'use client';

import { useStudentContext } from '@/student/context/StudentContext';

export default function ExamScoreTab() {
    const { studentData, setStudentData, setIsDirty } = useStudentContext();

    const handleExamChange = (exam: 'gre' | 'gmat', value: string) => {
        setStudentData(prev => ({
            ...prev,
            exams: { ...prev.exams, [exam]: value }
        }));
        setIsDirty(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Scores</h2>
            <p className="text-gray-500 mb-8">Enter your standardized test results.</p>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GRE Score</label>
                    <input
                        type="number"
                        value={studentData.exams?.gre || ''}
                        onChange={e => handleExamChange('gre', e.target.value)}
                        className="w-full max-w-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. 320"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GMAT Score</label>
                    <input
                        type="number"
                        value={studentData.exams?.gmat || ''}
                        onChange={e => handleExamChange('gmat', e.target.value)}
                        className="w-full max-w-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. 700"
                    />
                </div>
            </div>
        </div>
    );
}
