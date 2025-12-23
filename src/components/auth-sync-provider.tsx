'use client';

import { useAuthSync } from '@/hooks/use-auth-sync';

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  useAuthSync();
  return <>{children}</>;
}
