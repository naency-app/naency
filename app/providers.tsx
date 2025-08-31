'use client';

import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TRPCProvider } from '@/lib/trpc-provider';
import { DockApp } from '@/components/Docke';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Toaster />
        <Analytics />
        {children}

      </ThemeProvider>
    </TRPCProvider>
  );
}
