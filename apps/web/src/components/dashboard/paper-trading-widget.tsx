'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Trophy,
  Clock,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { usePaperTrading } from '@/contexts/paper-trading-context';

export function PaperTradingWidget() {
  const { trades, stats } = usePaperTrading();

  const openTrades = trades.filter((t) => t.status === 'open');

  if (trades.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Paper Trading</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Start tracking trades to see your paper trading performance here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Paper Trading</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {stats.openTrades} open
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div>
          <p className={cn(
            'text-lg font-bold',
            stats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {stats.totalPL >= 0 ? '+' : ''}
            {formatCurrency(stats.totalPL)}
          </p>
          <p className="text-xs text-muted-foreground">P&L</p>
        </div>
        <div>
          <p className={cn(
            'text-lg font-bold',
            stats.winRate >= 60 ? 'text-green-400' : stats.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {stats.winRate.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
        <div>
          <p className="text-lg font-bold">{stats.totalTrades}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {openTrades.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Open positions:</p>
          <div className="space-y-1">
            {openTrades.slice(0, 3).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{trade.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-xs">
                    +{formatCurrency(trade.entryCredit)}
                  </span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {trade.dte}d
                  </span>
                </div>
              </div>
            ))}
            {openTrades.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{openTrades.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
