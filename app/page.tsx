import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/get-server-session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession();
  if (session?.session) redirect('/dashboard');
  redirect('/login');
}
