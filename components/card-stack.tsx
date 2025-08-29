'use client';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { formatCentsBRL } from '@/helps/formatCurrency';
import { trpc } from '@/lib/trpc';

let interval: any;

export const CardStack = ({ offset, scaleFactor }: { offset?: number; scaleFactor?: number }) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;

  // Query: contas com saldo
  const { data: accounts = [], isLoading } = trpc.accounts.getAllWithBalance.useQuery({
    includeArchived: false,
  });

  const [rotationIndex, setRotationIndex] = useState(0);

  const startFlipping = useCallback(() => {
    if (accounts.length === 0) return;

    interval = setInterval(() => {
      setRotationIndex((prevIndex) => (prevIndex + 1) % accounts.length);
    }, 5000);
  }, [accounts.length]);

  useEffect(() => {
    startFlipping();

    return () => clearInterval(interval);
  }, [startFlipping]);

  // Create rotated accounts array
  const rotatedAccounts = accounts.length > 0
    ? [...accounts.slice(rotationIndex), ...accounts.slice(0, rotationIndex)]
    : [];

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'bank':
        return (
          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">BANK</div>
        );
      case 'cash':
        return (
          <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">CASH</div>
        );
      case 'credit_card':
        return (
          <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">CREDIT</div>
        );
      case 'ewallet':
        return (
          <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">
            E-WALLET
          </div>
        );
      case 'other':
        return (
          <div className="bg-slate-600 text-white px-2 py-1 rounded text-xs font-bold">OTHER</div>
        );
      default:
        return null;
    }
  };

  const getAccountGradient = (accountType: string) => {
    switch (accountType) {
      case 'bank':
        return 'from-blue-600 to-blue-800';
      case 'cash':
        return 'from-green-600 to-green-800';
      case 'credit_card':
        return 'from-purple-600 to-purple-800';
      case 'ewallet':
        return 'from-orange-600 to-orange-800';
      case 'other':
        return 'from-slate-600 to-slate-800';
      default:
        return 'from-slate-600 to-slate-800';
    }
  };

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
      <div className="relative h-64 w-full">
        <div className="absolute h-64 w-full rounded-2xl p-6 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse">
          <div className="h-4 bg-slate-400 rounded mb-8"></div>
          <div className="w-12 h-9 bg-slate-400 rounded-md mb-6"></div>
          <div className="h-6 bg-slate-400 rounded mb-6"></div>
          <div className="flex justify-between">
            <div className="h-4 bg-slate-400 rounded w-24"></div>
            <div className="h-4 bg-slate-400 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="relative h-64 w-full">
        <div className="absolute h-64 w-full rounded-2xl p-6 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="text-lg font-medium mb-2">No accounts found</div>
            <div className="text-sm">Create your first account to get started</div>
          </div>
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
            className={`absolute h-48 w-full rounded-2xl p-6 shadow-2xl border-0 overflow-hidden ${getAccountGradient(account.type)} bg-gradient-to-br`}
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
