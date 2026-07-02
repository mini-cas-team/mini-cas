'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/lib/authActions';

export default function SessionTimeoutManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const userType = getCookie('userType');

    // Skip tracking on public auth pages
    const isAuthPage = 
      pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/forgot-password') || 
      pathname.startsWith('/reset-password') ||
      pathname === '/';

    if (!userType || isAuthPage) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        const userEmail = getCookie('userEmail') || '';
        await logoutAction();
        router.push(`/login?type=${encodeURIComponent(userType)}&timeout=true&email=${encodeURIComponent(userEmail)}`);
        router.refresh();
      }, 30000); // 30 seconds timeout
    };

    // Initialize timer
    resetTimer();

    // Event listeners to detect activity and reset the timer
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [pathname, router]);

  return null;
}
