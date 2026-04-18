'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { getSchools } from '@/lib/schoolActions';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('student');
  const [schools, setSchools] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadSchools() {
      const schoolData = await getSchools();
      setSchools(schoolData);
    }
    loadSchools();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Use a simple cookie to simulate session state
    document.cookie = `userName=${encodeURIComponent(name.trim())}; path=/; max-age=86400;`;
    document.cookie = `userType=${encodeURIComponent(type)}; path=/; max-age=86400;`;

    // Direct to the right portal
    router.push(`/${type}`);
  };

  const getNameLabel = () => {
    switch (type) {
      case 'student': return 'Student Name';
      case 'admin': return 'Administrador';
      case 'school': return 'School Name';
      default: return 'Full Name';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/50">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg ring-4 ring-blue-50">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-center text-gray-500 mb-8">Sign in to your Mini-CAS account</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {getNameLabel()}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              list={type === 'school' ? 'school-list' : undefined}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              placeholder={type === 'school' ? 'Select or type school name' : 'e.g. John Doe'}
            />
            {type === 'school' && (
              <datalist id="school-list">
                {schools.map((school) => (
                  <option key={school.id} value={school.name} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setName(''); // Reset name when type changes
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
            >
              <option value="student">Student</option>
              <option value="school">School</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  );
}
