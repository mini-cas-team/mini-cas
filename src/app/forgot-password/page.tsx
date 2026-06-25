'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, AlertTriangle, Key, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { sendResetCodeAction } from '@/lib/authActions';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const emailParam = searchParams.get('email') || '';
  const typeParam = searchParams.get('type') || 'student';
  
  const [email, setEmail] = useState(emailParam);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await sendResetCodeAction(trimmed, typeParam);
      if (res.success) {
        setSuccessMsg('Identification code sent successfully! Redirecting...');
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(trimmed)}&type=${encodeURIComponent(typeParam)}`);
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
      
      <div className="flex justify-center mb-6">
        <div className="bg-blue-600/10 p-3 rounded-2xl ring-8 ring-blue-50">
          <Key className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <h1 id="forgot-password-title" className="text-3xl font-bold text-center text-gray-900 mb-2 tracking-tight">Forgot Password</h1>
      <p className="text-center text-gray-500 mb-8 text-sm">
        Enter your email to receive a 6-digit identification code
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none transition-all bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@university.edu"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className={`w-full py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            email.trim() && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending Code...</span>
            </>
          ) : (
            <span>Send Identification Code</span>
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            href={`/login?type=${encodeURIComponent(typeParam)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/50 flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading request...</p>
        </div>
      }>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
