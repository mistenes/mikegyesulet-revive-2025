import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout, type Session } from '@/services/authService';

export function useAdminAuthGuard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function validateSession() {
      try {
        const current = await getSession();

        if (!current) {
          navigate('/auth');
          return;
        }
        if (!isActive) return;
        setSession(current);
      } catch (error) {
        await logout();
        navigate('/auth');
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
  }, [navigate]);

  return { isLoading, session };
}
