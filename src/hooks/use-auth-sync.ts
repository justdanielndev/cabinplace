import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useAuthSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const data = await response.json();
          
          if (data.reason === 'user_banned') {
            router.push(`/banned?reason=${encodeURIComponent(data.banReason || 'Account banned')}`);
          } else {
            router.push('/');
          }
          return;
        }

        const data = await response.json();
        if (!data.authenticated) {
          if (pathname !== '/' && pathname !== '/banned' && pathname !== '/unauthorized') {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Auth sync failed:', error);
        if (pathname !== '/' && pathname !== '/banned' && pathname !== '/unauthorized') {
          router.push('/');
        }
      }
    };

    syncAuth();

    const interval = setInterval(syncAuth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [router, pathname]);
}
