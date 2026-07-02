'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { LogIn, Key, Mail, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { verifyEmailAction, loginAction } from '@/lib/authActions';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') || 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState(defaultType);
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'verified' | 'new_user'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (emailStatus === 'verified') {
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    }
  }, [emailStatus]);

  useEffect(() => {
    if (defaultType) {
      setType(defaultType);
    }
  }, [defaultType]);

  useEffect(() => {
    const isTimeout = searchParams.get('timeout') === 'true';
    const emailParam = searchParams.get('email') || '';
    if (isTimeout) {
      setErrorMsg('Your session has expired due to inactivity. Please sign in again.');
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
        setIsPasswordEnabled(true);
        setEmailStatus('verified');
      }
    }
  }, [searchParams]);

  const handleEmailCheck = async (emailVal: string) => {
    const trimmed = emailVal.trim();
    if (!trimmed) {
      setIsPasswordEnabled(false);
      setEmailStatus('idle');
      return;
    }

    setIsVerifyingEmail(true);
    setErrorMsg(null);
    try {
      const res = await verifyEmailAction(trimmed, type);
      if (res.exists && res.active) {
        setIsPasswordEnabled(true);
        setEmailStatus('verified');
      } else {
        setIsPasswordEnabled(false);
        setEmailStatus('new_user');
        router.push(`/register?email=${encodeURIComponent(trimmed)}&type=${encodeURIComponent(type)}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to check email.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (!email.trim() || !password) return;

    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await loginAction(email, password, type);
      if (res.success && res.type) {
        let destination = (res.type === 'student' || res.type === 'admin' || res.type === 'school') ? `/${res.type}` : '/school';
        try {
          const savedStateStr = localStorage.getItem(`lastState_${email.trim().toLowerCase()}_${res.type}`);
          if (savedStateStr) {
            const savedState = JSON.parse(savedStateStr);
            if (savedState.pathname) {
              destination = savedState.pathname;
            }
          }
        } catch (e) {
          console.error('Failed to parse last user state:', e);
        }
        router.push(destination);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Login failed.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailStatus !== 'verified') {
      await handleEmailCheck(email);
    } else {
      await handleLoginSubmit();
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
      
      <div className="flex justify-center mb-6">
        <div className="bg-blue-600/10 p-3 rounded-2xl ring-8 ring-blue-50">
          <LogIn className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center text-gray-900 mb-2 tracking-tight">Mini-CAS Portal</h1>
      <p className="text-center text-gray-500 mb-8 text-sm">
        Sign in or create your <span className="font-semibold text-blue-600 capitalize">{type}</span> account
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {emailStatus === 'new_user' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1">
            <span className="font-bold block">new user</span>
            <span>This email is not registered or active. Redirecting you to create an account...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="type" value={type} />

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="text"
              required
              disabled={emailStatus === 'verified'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (isPasswordEnabled || emailStatus !== 'idle') {
                  setIsPasswordEnabled(false);
                  setEmailStatus('idle');
                  setPassword('');
                }
              }}
              className={`w-full pl-12 pr-12 py-3 rounded-xl border outline-none transition-all bg-white/50 backdrop-blur-sm ${
                emailStatus === 'verified'
                  ? 'border-green-500 focus:ring-2 focus:ring-green-200'
                  : emailStatus === 'new_user'
                  ? 'border-amber-500 focus:ring-2 focus:ring-amber-200'
                  : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
              } disabled:bg-gray-100/80 disabled:text-gray-500 disabled:cursor-not-allowed`}
              placeholder="you@university.edu"
            />
            <div className="absolute right-4 top-3.5 flex items-center justify-center">
              {isVerifyingEmail ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : emailStatus === 'verified' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : null}
            </div>
          </div>
        </div>

        <div className={emailStatus === 'verified' ? 'animate-in fade-in duration-300 space-y-2 block' : 'hidden'}>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <Link
              href={`/forgot-password?email=${encodeURIComponent(email)}&type=${encodeURIComponent(type)}`}
              className="text-xs font-semibold text-blue-600 hover:underline hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              id="password"
              ref={passwordInputRef}
              type="password"
              required={emailStatus === 'verified'}
              disabled={emailStatus !== 'verified'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        {emailStatus === 'verified' ? (
          <div className="flex gap-4 animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => {
                setIsPasswordEnabled(false);
                setEmailStatus('idle');
                setPassword('');
                setErrorMsg(null);
                setTimeout(() => document.getElementById('email')?.focus(), 50);
              }}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer hover:-translate-y-0.5"
            >
              <span>← Change Email</span>
            </button>
            <button
              type="submit"
              disabled={!password || isLoggingIn}
              className={`flex-1 py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                password && !isLoggingIn
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!email.trim() || isVerifyingEmail}
            className={`w-full py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              email.trim() && !isVerifyingEmail
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:-translate-y-0.5'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isVerifyingEmail ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Email...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/50 flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Preparing secure login...</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
