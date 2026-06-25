'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Mail, User, Key, Shield, ArrowRight, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { registerAction, loginAction } from '@/lib/authActions';
import { getSchools, createNewSchool, checkSchoolDuplicate } from '@/lib/schoolActions';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const typeParam = searchParams.get('type') || 'student';

  const [email, setEmail] = useState(emailParam);
  const [name, setName] = useState('');
  const [type, setType] = useState(typeParam); // prefilled role type
  const [selectedSchool, setSelectedSchool] = useState('select or add one');
  const [password, setPassword] = useState('');
  
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(typeParam !== 'school');
  
  // School Modal Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLocation, setNewSchoolLocation] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Main Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync params when loaded
  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (typeParam) {
      setType(typeParam);
      setIsPasswordEnabled(typeParam !== 'school');
    }
  }, [emailParam, typeParam]);

  // Load schools from database if type is school
  useEffect(() => {
    async function fetchSchools() {
      try {
        const data = await getSchools();
        setSchoolsList(data || []);
      } catch (err) {
        console.error('Failed to load schools list', err);
      }
    }
    fetchSchools();
  }, []);

  const handleSchoolSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'add new one') {
      setIsModalOpen(true);
      // Reset dropdown visual selection until modal completes
      setSelectedSchool('select or add one');
      setIsPasswordEnabled(false);
    } else {
      setSelectedSchool(val);
      setIsPasswordEnabled(val !== 'select or add one');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setNewSchoolName('');
    setNewSchoolLocation('');
    setModalError(null);
  };

  const handleCreateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newSchoolName.trim();
    const trimmedLoc = newSchoolLocation.trim();

    if (!trimmedName || !trimmedLoc) {
      setModalError('Please fill in all fields.');
      return;
    }

    setIsModalSaving(true);
    setModalError(null);

    try {
      // 1. Check duplicate
      const dupRes = await checkSchoolDuplicate(trimmedName);
      if (dupRes.success && dupRes.duplicate) {
        setModalError('duplicate warning: School name already exists.');
        setIsModalSaving(false);
        return;
      }

      // 2. Create school
      const createRes = await createNewSchool(trimmedName, trimmedLoc);
      if (createRes.success && createRes.data) {
        // Add to local state list
        const newSchoolRecord = createRes.data;
        setSchoolsList((prev) => [...prev, newSchoolRecord].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Auto select and enable password
        setSelectedSchool(newSchoolRecord.name);
        setIsPasswordEnabled(true);
        handleModalClose();
      } else {
        setModalError(createRes.error || 'Failed to create school.');
      }
    } catch (err: any) {
      console.error(err);
      setModalError('An error occurred. Please try again.');
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((type !== 'school' && !name.trim()) || !password) return;

    // Resolve the final role parameters to save
    const finalType = type;
    const finalName = type === 'school' ? selectedSchool : name;

    if (type === 'school' && selectedSchool === 'select or add one') {
      setErrorMsg('Please select or add a school.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await registerAction(email, finalName, finalType, password);
      if (res.success) {
        setSuccessMsg('Account created successfully! Logging you in...');
        // Auto-login after successful registration
        const logRes = await loginAction(email, password, finalType);
        if (logRes.success && logRes.type) {
          const destination = (logRes.type === 'student' || logRes.type === 'admin' || logRes.type === 'school') 
            ? `/${logRes.type}` 
            : '/school';
          router.push(destination);
          router.refresh();
        } else {
          // Fallback to login screen
          router.push(`/login?type=${encodeURIComponent(type)}`);
        }
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPrefilledType = typeParam === 'student' || typeParam === 'admin';

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
      
      <div className="flex justify-center mb-6">
        <div className="bg-blue-600/10 p-3 rounded-2xl ring-8 ring-blue-50">
          <UserPlus className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center text-gray-900 mb-2 tracking-tight">Create Account</h1>
      <p className="text-center text-blue-600 font-semibold mb-8 text-sm animate-pulse">
        please create your account
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="space-y-6">
        {/* 1. Email Address (Pre-filled and read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              required
              readOnly
              value={email}
              className="w-full pl-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-500 cursor-not-allowed outline-none"
            />
          </div>
        </div>

        {/* 2. Full Name (Only show for non-school users) */}
        {type !== 'school' && (
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Jane Doe"
              />
            </div>
          </div>
        )}

        {/* 3. Account Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
            {type === 'school' ? 'Institute Name' : 'Account Type'}
          </label>
          <div className="relative">
            {isPrefilledType ? (
              <>
                <Shield className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="type"
                  type="text"
                  readOnly
                  value={type === 'student' ? 'Student' : 'Administrator'}
                  className="w-full pl-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-500 cursor-not-allowed outline-none capitalize font-medium"
                />
              </>
            ) : (
              <select
                id="type"
                value={selectedSchool}
                onChange={handleSchoolSelectChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm cursor-pointer"
              >
                <option value="select or add one">select or add one</option>
                {schoolsList.map((sch) => (
                  <option key={sch.id} value={sch.name}>
                    {sch.name}
                  </option>
                ))}
                <option value="add new one" className="font-bold text-blue-600">
                  + Add New One
                </option>
              </select>
            )}
          </div>
        </div>

        {/* 4. Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
              Password
            </label>
            {!isPasswordEnabled && (
              <span className="text-xs text-gray-400 italic">Select a school first</span>
            )}
          </div>
          <div className="relative">
            <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type="password"
              required
              disabled={!isPasswordEnabled}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-12 py-3 rounded-xl border outline-none transition-all ${
                isPasswordEnabled
                  ? 'border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 cursor-text'
                  : 'border-gray-100 bg-gray-50/50 text-gray-400 cursor-not-allowed'
              }`}
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isPasswordEnabled || isSubmitting}
          className={`w-full py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            isPasswordEnabled && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* School Creation Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={handleModalClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Add New School</h3>
            <p className="text-gray-500 text-xs mb-6">Create a new university record in the system.</p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchoolSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">School Name</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  required
                  value={newSchoolLocation}
                  onChange={(e) => setNewSchoolLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="e.g. Stanford, CA"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModalSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isModalSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add School</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/50 flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Preparing registration form...</p>
        </div>
      }>
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}
