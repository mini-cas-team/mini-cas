'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { getSchools } from '@/lib/schoolActions';

interface LoginViewProps {
  defaultType: 'student' | 'school' | 'admin';
  onLoginSuccess?: (name: string, type: string) => void;
}

export default function LoginView({ defaultType, onLoginSuccess }: LoginViewProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState(defaultType);
  const [schools, setSchools] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadSchools() {
      try {
        const schoolData = await getSchools();
        setSchools(schoolData || []);
      } catch (error) {
        console.error('Failed to load schools', error);
      }
    }
    loadSchools();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedName = name.trim();
    // Use a simple cookie to simulate session state
    document.cookie = `userName=${encodeURIComponent(trimmedName)}; path=/; max-age=86400;`;
    document.cookie = `userType=${encodeURIComponent(type)}; path=/; max-age=86400;`;

    if (onLoginSuccess && type === defaultType) {
      onLoginSuccess(trimmedName, type);
    } else {
      // Direct to the right portal
      router.push(`/${type}`);
      if (type === defaultType) {
        router.refresh();
      }
    }
  };

  const getNameLabel = () => {
    switch (type) {
      case 'student': return 'Student Name';
      case 'admin': return 'Administrator';
      case 'school': return 'School Name';
      default: return 'Full Name';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/50">
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



          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  );
}
