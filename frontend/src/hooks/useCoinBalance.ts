import { useState, useEffect } from 'react';

const COIN_BALANCE_KEY = 'sb_coinBalance';

export function useCoinBalance() {
  const [balance, setBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(COIN_BALANCE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem(COIN_BALANCE_KEY, newBalance.toString());
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('coinBalanceUpdated', { detail: newBalance }));
  };

  const addCoins = (amount: number) => {
    const newBalance = balance + amount;
    updateBalance(newBalance);
  };

  // Listen for updates from other components
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      setBalance(customEvent.detail);
    };

    window.addEventListener('coinBalanceUpdated', handleUpdate);
    return () => window.removeEventListener('coinBalanceUpdated', handleUpdate);
  }, []);

  return { balance, updateBalance, addCoins };
}
