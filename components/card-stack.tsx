'use client';
import { IconPlus } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { formatCentsBRL } from '@/helps/formatCurrency';
import type { AccountWithBalance } from '@/types/trpc';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

let interval: ReturnType<typeof setInterval> | undefined;

export const CardStack = ({ offset, scaleFactor, setOpenCreate, accounts = [], isLoading = false, }: { offset?: number; scaleFactor?: number; setOpenCreate: (open: boolean) => void; accounts?: AccountWithBalance[]; isLoading?: boolean; }) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;

  const [rotationIndex, setRotationIndex] = useState(0);

  const startFlipping = useCallback(() => {
    if (accounts.length === 0) return;

    interval = setInterval(() => {
      setRotationIndex((prevIndex) => (prevIndex + 1) % accounts.length);
    }, 5000);
  }, [accounts.length]);

  useEffect(() => {
    startFlipping();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startFlipping]);

  // Create rotated accounts array
  const rotatedAccounts =
    accounts.length > 0
      ? [...accounts.slice(rotationIndex), ...accounts.slice(0, rotationIndex)]
      : [];

  const getAccountTypeIcon = (accountType: string) => {
    const label = accountType.replace('_', ' ').toUpperCase();
    return (
      <div className="bg-white/10 text-white px-2 py-1 rounded text-xs font-bold">{label}</div>
    );
  };

  // Colors are unified: front card uses black gradient, others use solid black

  const formatAccountNumber = (id: string) => {
    // Use the first 8 characters of the UUID as a mock account number
    return id
      .substring(0, 8)
      .toUpperCase()
      .replace(/(.{4})/g, '$1 ')
      .trim();
  };

  if (isLoading) {
    return (
      <div className="h-48 w-full flex items-center justify-center">
        <div className="h-44 w-full max-w-sm rounded-2xl p-6 bg-muted/50 flex flex-col gap-4 shadow animate-pulse">
          <div className="flex items-center justify-between">
            <Skeleton className="w-16 h-6 rounded" />
            <Skeleton className="w-10 h-6 rounded" />
          </div>
          <Skeleton className="w-24 h-8 rounded mb-2" />
          <Skeleton className="w-32 h-4 rounded mb-2" />
          <div className="flex items-center justify-between mt-auto">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center bg-muted/50 rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-md font-medium">No accounts found</div>
          <div className="text-sm">Create your first account to get started</div>
          <Button variant="outline" size="sm" onClick={() => setOpenCreate(true)}>
            <IconPlus className="size-4" /> Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full">
      {rotatedAccounts.map((account, index) => {
        return (
          <motion.div
            key={account.id}
            className={`absolute h-48 w-full rounded-2xl p-6 shadow-2xl border-0 overflow-hidden ${index === 0 ? 'bg-gradient-to-br from-black to-neutral-900' : 'bg-black'}`}
            style={{
              transformOrigin: 'top center',
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR,
              zIndex: rotatedAccounts.length - index,
            }}
          >
            {/* Bank Logo and Account Type */}
            <div className="flex justify-between items-start mb-8">
              <div className="text-white/80 text-sm font-medium">{account.name}</div>
              {getAccountTypeIcon(account.type)}
            </div>

            {/* Account Icon */}
            <div className="w-12 h-9 bg-yellow-400 rounded-md mb-6 flex items-center justify-center">
              <div className="w-8 h-6 bg-yellow-600 rounded-sm"></div>
            </div>

            {/* Account Number */}
            <div className="flex justify-between gap-2 items-center">
              <div className="text-white text-lg font-mono tracking-wider self-start">
                {formatAccountNumber(account.id)}
              </div>

              <div className="self-end">
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Balance</div>
                <div className="text-white font-bold">{formatCentsBRL(account.balance)}</div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          </motion.div>
        );
      })}
    </div>
  );
};
