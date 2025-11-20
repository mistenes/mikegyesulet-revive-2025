import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout, type Session } from '@/services/authService';

interface AdminAuthOptions {
  redirectToAuth?: boolean;
}

export function useAdminAuthGuard(options: AdminAuthOptions = { redirectToAuth: true }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    async function validateSession() {
      try {
        const current = await getSession();

        if (!isActive) return;
        if (!current) {
          setSession(null);
          if (options.redirectToAuth && !hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate('/auth', { replace: true });
          }
          return;
        }

        setSession(current);
        setError(null);
      } catch (err) {
        if (!isActive) return;
        setSession(null);
        setError((err as Error)?.message || 'Nem sikerült ellenőrizni a munkamenetet.');
        await logout();
        if (options.redirectToAuth && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigate('/auth', { replace: true });
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    validateSession();

    return () => {
      isActive = false;
    };
  }, [navigate, options.redirectToAuth]);

  return { isLoading, session, error };
}
