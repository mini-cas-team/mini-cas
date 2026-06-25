'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, Shield, ArrowLeft, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { checkResetStateAction, verifyAndResetPasswordAction } from '@/lib/authActions';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const typeParam = searchParams.get('type') || 'student';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status checks
  const [isCheckingEmail, setIsCheckingEmail] = useState(true);
  const [isEmailActive, setIsEmailActive] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(true);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Check email active status in the database on load
  useEffect(() => {
    async function checkStatus() {
      if (!emailParam) {
        setErrorMsg('No email address provided for password reset.');
        setIsCheckingEmail(false);
        return;
      }

      setIsCheckingEmail(true);
      setErrorMsg(null);

      try {
        const res = await checkResetStateAction(emailParam, typeParam);
        if (res.success && res.active) {
          setIsEmailActive(true);
          setSmtpConfigured(!!res.smtpConfigured);
          setDevCode(res.devCode || null);
        } else if (res.success && !res.active) {
          setIsEmailActive(false);
          setErrorMsg('The email account is not active.');
        } else {
          setIsEmailActive(false);
          setErrorMsg(res.error || 'This email address is not registered.');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to verify reset eligibility.');
      } finally {
        setIsCheckingEmail(false);
      }
    }
    checkStatus();
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailActive) return;

    if (!code.trim() || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await verifyAndResetPasswordAction(emailParam, typeParam, code, newPassword);
      if (res.success) {
        setSuccessMsg('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          router.push(`/login?type=${encodeURIComponent(typeParam)}`);
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Failed to reset password.');
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
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <h1 id="reset-password-title" className="text-3xl font-bold text-center text-gray-900 mb-2 tracking-tight">Reset Password</h1>
      <p className="text-center text-gray-500 mb-6 text-sm">
        Email: <span className="font-semibold text-gray-800">{email || 'Not Specified'}</span>
      </p>

      {/* Dev Mode Banner (SMTP config missing) */}
      {!smtpConfigured && devCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <span className="font-bold block">⚡ [DEV MODE] SMTP not configured</span>
            <span>Simulated email sent. Enter code: <strong className="text-sm bg-blue-100 px-1.5 py-0.5 rounded font-mono">{devCode}</strong></span>
          </div>
        </div>
      )}

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

      {isCheckingEmail ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-gray-500 text-sm">Verifying reset eligibility...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Identification Code
            </label>
            <input
              id="code"
              type="text"
              required
              disabled={!isEmailActive || isSubmitting}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className={`w-full px-4 py-3 rounded-xl border outline-none font-mono text-center tracking-widest text-lg transition-all ${
                isEmailActive
                  ? 'border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-gray-150 bg-gray-50/50 text-gray-400 cursor-not-allowed'
              }`}
              placeholder="000000"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              disabled={!isEmailActive || isSubmitting}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                isEmailActive
                  ? 'border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-gray-150 bg-gray-50/50 text-gray-400 cursor-not-allowed'
              }`}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              disabled={!isEmailActive || isSubmitting}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                isEmailActive
                  ? 'border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-gray-150 bg-gray-50/50 text-gray-400 cursor-not-allowed'
              }`}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={!isEmailActive || isSubmitting || !code.trim() || !newPassword || !confirmPassword}
            className={`w-full py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              isEmailActive && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:-translate-y-0.5'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href={`/login?type=${encodeURIComponent(typeParam)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel & Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/50 flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading reset form...</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
