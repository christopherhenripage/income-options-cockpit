'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface PositionRules {
  profitTargetPercent: number;  // e.g., 50 means close at 50% profit
  stopLossPercent: number;      // e.g., 200 means close at 200% of credit received (2x loss)
  dteExit: number;              // Exit when DTE reaches this value (e.g., 21 days)
}

export interface PositionAlert {
  id: string;
  type: 'profit_target' | 'stop_loss' | 'dte_warning' | 'expired' | 'regime_change';
  message: string;
  createdAt: string;
  dismissed: boolean;
}

export interface PaperTrade {
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
  // New fields for Position Co-Pilot
  rules?: PositionRules;
  currentValue?: number;  // Simulated current value for demo
  alerts?: PositionAlert[];
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
  // New functions for Position Co-Pilot
  updateRules: (id: string, rules: PositionRules) => void;
  updateCurrentValue: (id: string, value: number) => void;
  addAlert: (tradeId: string, alert: Omit<PositionAlert, 'id' | 'createdAt' | 'dismissed'>) => void;
  dismissAlert: (tradeId: string, alertId: string) => void;
  getActiveAlerts: () => { trade: PaperTrade; alert: PositionAlert }[];
}

// Default rules for new positions
const DEFAULT_RULES: PositionRules = {
  profitTargetPercent: 50,  // Take profit at 50%
  stopLossPercent: 200,     // Stop loss at 2x credit
  dteExit: 21,              // Exit at 21 DTE
};

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
        rules: DEFAULT_RULES,
        currentValue: trade.entryCredit, // Start at entry credit
        alerts: [],
      };
      setTrades((prev) => [...prev, newTrade]);
    },
    []
  );

  const updateRules = useCallback(
    (id: string, rules: PositionRules) => {
      setTrades((prev) =>
        prev.map((t) => (t.id === id ? { ...t, rules } : t))
      );
    },
    []
  );

  const updateCurrentValue = useCallback(
    (id: string, value: number) => {
      setTrades((prev) =>
        prev.map((t) => (t.id === id ? { ...t, currentValue: value } : t))
      );
    },
    []
  );

  const addAlert = useCallback(
    (tradeId: string, alert: Omit<PositionAlert, 'id' | 'createdAt' | 'dismissed'>) => {
      const newAlert: PositionAlert = {
        ...alert,
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        dismissed: false,
      };
      setTrades((prev) =>
        prev.map((t) =>
          t.id === tradeId
            ? { ...t, alerts: [...(t.alerts || []), newAlert] }
            : t
        )
      );
    },
    []
  );

  const dismissAlert = useCallback(
    (tradeId: string, alertId: string) => {
      setTrades((prev) =>
        prev.map((t) =>
          t.id === tradeId
            ? {
                ...t,
                alerts: t.alerts?.map((a) =>
                  a.id === alertId ? { ...a, dismissed: true } : a
                ),
              }
            : t
        )
      );
    },
    []
  );

  const getActiveAlerts = useCallback(() => {
    const result: { trade: PaperTrade; alert: PositionAlert }[] = [];
    trades.forEach((trade) => {
      trade.alerts?.forEach((alert) => {
        if (!alert.dismissed) {
          result.push({ trade, alert });
        }
      });
    });
    return result.sort(
      (a, b) => new Date(b.alert.createdAt).getTime() - new Date(a.alert.createdAt).getTime()
    );
  }, [trades]);

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
        updateRules,
        updateCurrentValue,
        addAlert,
        dismissAlert,
        getActiveAlerts,
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
