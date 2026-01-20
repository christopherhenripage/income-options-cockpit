'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, getStrategyLabel } from '@/lib/utils';

interface PaperTradeCardProps {
  candidate: {
    id: string;
    symbol: string;
    strategyType: string;
    score: number;
    netCredit: number;
    maxLoss: number;
    dte: number;
    underlyingPrice?: number;
  };
  onTrack?: (id: string) => void;
  isTracked?: boolean;
}

export function PaperTradeCard({
  candidate,
  onTrack,
  isTracked = false,
}: PaperTradeCardProps) {
  const [tracking, setTracking] = useState(isTracked);

  const handleTrack = () => {
    setTracking(true);
    onTrack?.(candidate.id);
  };

  return (
    <Card className={cn(
      "p-4 transition-all",
      tracking && "border-primary/50 bg-primary/5"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{candidate.symbol}</span>
          <Badge variant="outline" className="text-xs">
            {getStrategyLabel(candidate.strategyType)}
          </Badge>
        </div>
        <div className={cn(
          "text-2xl font-bold",
          candidate.score >= 70 ? "text-green-400" :
          candidate.score >= 50 ? "text-yellow-400" : "text-orange-400"
        )}>
          {candidate.score}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-muted-foreground">Premium</span>
          <p className="text-green-400 font-semibold">{formatCurrency(candidate.netCredit)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Max Risk</span>
          <p className="text-red-400 font-semibold">{formatCurrency(candidate.maxLoss)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Days Left</span>
          <p className="font-semibold">{candidate.dte}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Return on Risk</span>
          <p className="text-primary font-semibold">
            {formatPercent((candidate.netCredit / candidate.maxLoss) * 100)}
          </p>
        </div>
      </div>

      {tracking ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm">
            <Eye className="h-4 w-4" />
            <span>Tracking this trade</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Check back to see how this recommendation performs over time.
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleTrack}
        >
          <Play className="h-4 w-4 mr-2" />
          Track This Trade
        </Button>
      )}
    </Card>
  );
}

// Summary of tracked paper trades
interface TrackedTrade {
  id: string;
  symbol: string;
  strategyType: string;
  entryDate: string;
  entryCredit: number;
  currentValue?: number;
  status: 'open' | 'won' | 'lost' | 'expired';
  daysLeft?: number;
}

export function PaperTradesSummary({ trades }: { trades: TrackedTrade[] }) {
  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status !== 'open');
  const wonTrades = closedTrades.filter(t => t.status === 'won');

  const totalPL = closedTrades.reduce((sum, t) => {
    if (t.status === 'won') return sum + t.entryCredit;
    if (t.status === 'lost' && t.currentValue) return sum - t.currentValue;
    return sum;
  }, 0);

  const winRate = closedTrades.length > 0
    ? (wonTrades.length / closedTrades.length) * 100
    : 0;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your Paper Trading Progress</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold">{trades.length}</p>
          <p className="text-sm text-muted-foreground">Total Trades</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-400">{openTrades.length}</p>
          <p className="text-sm text-muted-foreground">Open</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-3xl font-bold",
            totalPL >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </p>
          <p className="text-sm text-muted-foreground">Paper P&L</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-3xl font-bold",
            winRate >= 60 ? "text-green-400" : winRate >= 40 ? "text-yellow-400" : "text-red-400"
          )}>
            {winRate.toFixed(0)}%
          </p>
          <p className="text-sm text-muted-foreground">Win Rate</p>
        </div>
      </div>

      {openTrades.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Open Positions:</p>
          {openTrades.map(trade => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{trade.symbol}</span>
                <Badge variant="outline" className="text-xs">
                  {getStrategyLabel(trade.strategyType)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-400">+{formatCurrency(trade.entryCredit)}</span>
                {trade.daysLeft !== undefined && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {trade.daysLeft}d
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {trades.length === 0 && (
        <div className="text-center py-6">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            No paper trades yet. Start tracking recommendations to see how they perform!
          </p>
        </div>
      )}

      {closedTrades.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Paper trading helps you learn without risking real money.
            Track how recommendations perform to build confidence before trading live.
          </p>
        </div>
      )}
    </Card>
  );
}

// What happened explanation for closed trades
export function TradeOutcomeExplainer({
  trade,
  finalStockPrice,
  strikePrice,
}: {
  trade: TrackedTrade;
  finalStockPrice: number;
  strikePrice: number;
}) {
  const isWin = trade.status === 'won';

  return (
    <Card className={cn(
      "p-4",
      isWin ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
    )}>
      <div className="flex items-center gap-2 mb-3">
        {isWin ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-400" />
        )}
        <h4 className="font-semibold">
          {isWin ? 'Trade Won!' : 'Trade Lost'}
        </h4>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">You collected:</span>
          <span className="text-green-400">+{formatCurrency(trade.entryCredit)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Strike price:</span>
          <span>${strikePrice.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Stock finished at:</span>
          <span className="flex items-center gap-1">
            ${finalStockPrice.toFixed(2)}
            {finalStockPrice > strikePrice ? (
              <TrendingUp className="h-3 w-3 text-green-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-sm text-foreground/80">
          {isWin ? (
            <>
              The stock stayed above your strike price of ${strikePrice}, so the option
              expired worthless. You kept the entire ${formatCurrency(trade.entryCredit)} premium!
            </>
          ) : (
            <>
              The stock dropped below your strike price of ${strikePrice}. In a real trade,
              you would have been assigned (bought the stock at ${strikePrice}).
              Learning moment: consider wider strikes or shorter DTE next time.
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
