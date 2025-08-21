// lib/get-server-session.ts
import { headers as nextHeaders } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getServerSession(h?: Headers) {
  try {
    const hdrs = h ?? new Headers(Object.fromEntries((await nextHeaders()).entries()));

    const result = await auth.api.getSession({ headers: hdrs });
    return result?.session ? result : null;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    // Return null instead of throwing to prevent the app from crashing
    return null;
  }
}
