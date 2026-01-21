'use client';

import { usePaperTrading } from '@/contexts/paper-trading-context';
import { formatCurrency } from '@/lib/utils';
import {
  Briefcase,
  TrendingUp,
  Shield,
  DollarSign,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PortfolioSummary() {
  const { trades, stats } = usePaperTrading();

  const openTrades = trades.filter((t) => t.status === 'open');

  // Calculate portfolio metrics
  const totalExposure = openTrades.reduce((sum, t) => sum + t.maxLoss, 0);
  const totalCredit = openTrades.reduce((sum, t) => sum + t.entryCredit, 0);
  const unrealizedPL = openTrades.reduce((sum, t) => {
    const current = t.currentValue || t.entryCredit;
    return sum + (t.entryCredit - current);
  }, 0);

  // Estimate delta exposure (simplified - in production would use real Greeks)
  const estimatedDelta = openTrades.reduce((sum, t) => {
    // CSP/PCS are short puts = positive delta
    // CC/CCS are short calls = negative delta
    const isShortPut = t.strategyType.includes('put') || t.strategyType === 'cash_secured_put';
    const delta = isShortPut ? 0.3 : -0.3; // Simplified estimate
    return sum + (delta * t.maxLoss / 100);
  }, 0);

  if (openTrades.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Open Positions */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Briefcase className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">Positions</span>
        </div>
        <p className="text-2xl font-bold">{openTrades.length}</p>
      </div>

      {/* Total Credit Collected */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">Credit</span>
        </div>
        <p className="text-2xl font-bold text-profit">+{formatCurrency(totalCredit)}</p>
      </div>

      {/* Unrealized P&L */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">Unrealized</span>
        </div>
        <p className={cn(
          'text-2xl font-bold',
          unrealizedPL >= 0 ? 'text-profit' : 'text-loss'
        )}>
          {unrealizedPL >= 0 ? '+' : ''}{formatCurrency(unrealizedPL)}
        </p>
      </div>

      {/* Max Exposure */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Shield className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">Max Risk</span>
        </div>
        <p className="text-2xl font-bold text-loss">{formatCurrency(totalExposure)}</p>
      </div>

      {/* Estimated Delta */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Activity className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">Est. Delta</span>
        </div>
        <p className={cn(
          'text-2xl font-bold',
          estimatedDelta >= 0 ? 'text-profit' : 'text-loss'
        )}>
          {estimatedDelta >= 0 ? '+' : ''}{estimatedDelta.toFixed(0)}
        </p>
      </div>
    </div>
  );
}
