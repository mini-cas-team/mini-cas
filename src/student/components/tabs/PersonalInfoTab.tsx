'use client';

import { useStudentContext } from '@/student/context/StudentContext';

export default function PersonalInfoTab() {
    const { setIsDirty, studentData, setStudentData, loading } = useStudentContext();

    const handleChange = (field: string, value: string) => {
        setStudentData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    if (loading) return <div className="p-8 text-gray-500 animate-pulse">Loading profile...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <p className="text-gray-500 mb-8">Update your contact details and academic background.</p>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            disabled
                            value={studentData.name}
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed rounded-xl outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input type="email" value={studentData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input type="text" value={studentData.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">College/University</label>
                        <input type="text" value={studentData.college_university} onChange={(e) => handleChange('college_university', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
                        <input type="text" value={studentData.major} onChange={(e) => handleChange('major', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
}
