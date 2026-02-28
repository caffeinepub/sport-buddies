import { useState, useEffect } from 'react';

const REDEMPTIONS_KEY = 'redemptions';

export interface Redemption {
  id: string;
  item: string;
  cost: number;
  code: string;
  createdAt: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SB-${part1}-${part2}`;
}

export function useRedemptions() {
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => {
    const stored = localStorage.getItem(REDEMPTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const addRedemption = (item: string, cost: number): Redemption => {
    const newRedemption: Redemption = {
      id: crypto.randomUUID(),
      item,
      cost,
      code: generateRedemptionCode(),
      createdAt: Date.now(),
      status: 'PENDING',
    };

    const updated = [newRedemption, ...redemptions];
    setRedemptions(updated);
    localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(updated));
    return newRedemption;
  };

  const getRedemptionById = (id: string): Redemption | null => {
    return redemptions.find(r => r.id === id) || null;
  };

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === REDEMPTIONS_KEY && e.newValue) {
        setRedemptions(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { redemptions, addRedemption, getRedemptionById };
}
