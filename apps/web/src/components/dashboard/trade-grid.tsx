'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  Eye,
  Play,
  ChevronRight,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
  getScoreColor,
} from '@/lib/utils';
import { TradeDetailPanel } from './trade-detail-panel';

interface OptionLeg {
  action: 'buy' | 'sell';
  quantity: number;
  strike: number;
  type: 'call' | 'put';
  expiration: string;
  symbol: string;
}

interface TradeCandidate {
  id: string;
  symbol: string;
  strategyType: string;
  score: number;
  netCredit: number;
  maxLoss: number;
  dte: number;
  underlyingPrice?: number;
  legs?: OptionLeg[];
}

interface TradeGridProps {
  candidates: TradeCandidate[];
  loading?: boolean;
  trackedIds?: Set<string>;
  onPaperTrade?: (trade: TradeCandidate) => void;
}

function TradeCard({
  trade,
  onClick,
  isTracked,
}: {
  trade: TradeCandidate;
  onClick: () => void;
  isTracked?: boolean;
}) {
  const returnPct = (trade.netCredit / trade.maxLoss) * 100;

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5',
        isTracked && 'border-primary/30 bg-primary/5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl">{trade.symbol}</span>
          {isTracked && (
            <Eye className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className={cn('text-2xl font-bold', getScoreColor(trade.score))}>
          {trade.score}
        </div>
      </div>

      <Badge
        variant="outline"
        className={cn('text-xs mb-3', getStrategyClass(trade.strategyType))}
      >
        {getStrategyLabel(trade.strategyType)}
      </Badge>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Premium
          </p>
          <p className="text-green-400 font-semibold">
            {formatCurrency(trade.netCredit)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Shield className="h-3 w-3" /> Max Risk
          </p>
          <p className="text-red-400 font-semibold">
            {formatCurrency(trade.maxLoss)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" /> Expiration
          </p>
          <p className="font-semibold">{trade.dte}d</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Return
          </p>
          <p className="text-primary font-semibold">{formatPercent(returnPct)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Click for details</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-6 w-16 bg-muted/50 rounded" />
        <div className="h-8 w-12 bg-muted/50 rounded" />
      </div>
      <div className="h-5 w-24 bg-muted/50 rounded mb-3" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 bg-muted/50 rounded" />
        <div className="h-10 bg-muted/50 rounded" />
        <div className="h-10 bg-muted/50 rounded" />
        <div className="h-10 bg-muted/50 rounded" />
      </div>
    </Card>
  );
}

export function TradeGrid({
  candidates,
  loading,
  trackedIds = new Set(),
  onPaperTrade,
}: TradeGridProps) {
  const [selectedTrade, setSelectedTrade] = useState<TradeCandidate | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Take trades 2-6 (skip first one which is the hero)
  const gridTrades = candidates.slice(1, 6);

  const handleCardClick = (trade: TradeCandidate) => {
    setSelectedTrade(trade);
    setPanelOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">More Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (gridTrades.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">More Opportunities</h2>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No additional trade opportunities found in current market conditions.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">More Opportunities</h2>
          <span className="text-sm text-muted-foreground">
            {candidates.length} total found
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {gridTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onClick={() => handleCardClick(trade)}
              isTracked={trackedIds.has(trade.id)}
            />
          ))}
        </div>
      </div>

      <TradeDetailPanel
        trade={selectedTrade}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onPaperTrade={onPaperTrade}
        isTracked={selectedTrade ? trackedIds.has(selectedTrade.id) : false}
      />
    </>
  );
}
