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
  Target,
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
  onQuickTrack,
  isTracked,
}: {
  trade: TradeCandidate;
  onClick: () => void;
  onQuickTrack: () => void;
  isTracked?: boolean;
}) {
  const returnPct = (trade.netCredit / trade.maxLoss) * 100;
  const strike = trade.legs?.[0]?.strike;
  const buffer = trade.underlyingPrice && strike
    ? ((trade.underlyingPrice - strike) / trade.underlyingPrice) * 100
    : null;

  return (
    <Card
      className={cn(
        'p-4 transition-all hover:border-primary/50',
        isTracked && 'border-primary/30 bg-primary/5'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">{trade.symbol}</span>
            {isTracked && <Eye className="h-4 w-4 text-primary" />}
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs mt-1', getStrategyClass(trade.strategyType))}
          >
            {getStrategyLabel(trade.strategyType)}
          </Badge>
        </div>
        <div className={cn('text-2xl font-bold', getScoreColor(trade.score))}>
          {trade.score}
        </div>
      </div>

      {/* Price Info */}
      {trade.underlyingPrice && strike && (
        <div className="bg-muted/30 rounded-lg p-2 mb-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stock:</span>
            <span className="font-medium">${trade.underlyingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strike:</span>
            <span className="font-medium">${strike}</span>
          </div>
          {buffer !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buffer:</span>
              <span className={cn(
                'font-medium',
                buffer >= 5 ? 'text-green-400' : buffer >= 3 ? 'text-yellow-400' : 'text-orange-400'
              )}>
                {buffer.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
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

      {/* Actions */}
      <div className="flex gap-2">
        {isTracked ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Details
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs btn-premium"
              onClick={(e) => {
                e.stopPropagation();
                onQuickTrack();
              }}
            >
              <Play className="h-3 w-3 mr-1" />
              Track
            </Button>
          </>
        )}
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
      <div className="h-16 bg-muted/50 rounded mb-3" />
      <div className="grid grid-cols-2 gap-2">
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
              onQuickTrack={() => onPaperTrade?.(trade)}
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
