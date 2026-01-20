'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface PaperTrade {
  id: string;
  tradeId: string;
  symbol: string;
  strategyType: string;
  entryDate: string;
  entryCredit: number;
  maxLoss: number;
  strike?: number;
  dte: number;
  expirationDate: string;
  status: 'open' | 'won' | 'lost' | 'expired';
  closeDate?: string;
  closeValue?: number;
  notes?: string;
}

interface PaperTradingStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPL: number;
}

interface PaperTradingContextType {
  trades: PaperTrade[];
  trackedIds: Set<string>;
  stats: PaperTradingStats;
  addTrade: (trade: Omit<PaperTrade, 'id' | 'entryDate' | 'status'>) => void;
  closeTrade: (id: string, status: 'won' | 'lost', closeValue?: number) => void;
  removeTrade: (id: string) => void;
  isTracked: (tradeId: string) => boolean;
}

const PaperTradingContext = createContext<PaperTradingContextType | undefined>(undefined);

function calculateStats(trades: PaperTrade[]): PaperTradingStats {
  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status !== 'open');
  const wins = closedTrades.filter((t) => t.status === 'won');
  const losses = closedTrades.filter((t) => t.status === 'lost');

  const totalPL = closedTrades.reduce((sum, t) => {
    if (t.status === 'won') return sum + t.entryCredit;
    if (t.status === 'lost' && t.closeValue) return sum - t.closeValue;
    if (t.status === 'lost') return sum - t.maxLoss;
    return sum;
  }, 0);

  return {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalPL,
  };
}

export function PaperTradingProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('paperTrades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTrades(parsed);
      } catch {
        // Invalid JSON
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('paperTrades', JSON.stringify(trades));
    }
  }, [trades, isLoaded]);

  const trackedIds = new Set(trades.map((t) => t.tradeId));

  const addTrade = useCallback(
    (trade: Omit<PaperTrade, 'id' | 'entryDate' | 'status'>) => {
      const newTrade: PaperTrade = {
        ...trade,
        id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        entryDate: new Date().toISOString(),
        status: 'open',
      };
      setTrades((prev) => [...prev, newTrade]);
    },
    []
  );

  const closeTrade = useCallback(
    (id: string, status: 'won' | 'lost', closeValue?: number) => {
      setTrades((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                closeDate: new Date().toISOString(),
                closeValue,
              }
            : t
        )
      );
    },
    []
  );

  const removeTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isTracked = useCallback(
    (tradeId: string) => trackedIds.has(tradeId),
    [trackedIds]
  );

  const stats = calculateStats(trades);

  return (
    <PaperTradingContext.Provider
      value={{
        trades,
        trackedIds,
        stats,
        addTrade,
        closeTrade,
        removeTrade,
        isTracked,
      }}
    >
      {children}
    </PaperTradingContext.Provider>
  );
}

export function usePaperTrading() {
  const context = useContext(PaperTradingContext);
  if (context === undefined) {
    throw new Error('usePaperTrading must be used within a PaperTradingProvider');
  }
  return context;
}
