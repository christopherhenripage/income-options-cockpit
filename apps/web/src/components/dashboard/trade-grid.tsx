'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Play,
  ArrowRight,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
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

// Score badge styling
function getScoreBadgeClass(score: number): string {
  if (score >= 70) return 'score-badge-high';
  if (score >= 50) return 'score-badge-medium';
  return 'score-badge-low';
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
    <div
      className={cn(
        'card-elevated cursor-pointer group',
        isTracked && 'border-primary/30'
      )}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold">{trade.symbol}</span>
              {isTracked && (
                <Eye className="h-4 w-4 text-primary" />
              )}
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs', getStrategyClass(trade.strategyType))}
            >
              {getStrategyLabel(trade.strategyType)}
            </Badge>
          </div>
          <div className={cn('score-badge text-xl w-12 h-12', getScoreBadgeClass(trade.score))}>
            {trade.score}
          </div>
        </div>

        {/* Price Context */}
        {trade.underlyingPrice && strike && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>${trade.underlyingPrice.toFixed(0)} → ${strike}</span>
            {buffer !== null && (
              <span className={cn(
                'font-medium',
                buffer >= 5 ? 'text-profit' : buffer >= 3 ? 'score-medium' : 'text-loss'
              )}>
                {buffer.toFixed(1)}% buffer
              </span>
            )}
          </div>
        )}

        {/* Key Metrics - Clean horizontal */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="metric">
            <span className="metric-label">Premium</span>
            <span className="metric-value text-profit">{formatCurrency(trade.netCredit)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Max Risk</span>
            <span className="metric-value text-loss">{formatCurrency(trade.maxLoss)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Return</span>
            <span className="metric-value text-primary">{formatPercent(returnPct)}</span>
          </div>
        </div>

        {/* Expiration */}
        <div className="flex items-center justify-between text-sm border-t border-border pt-4">
          <span className="text-muted-foreground">
            Expires in <span className="text-foreground font-medium">{trade.dte} days</span>
          </span>
          {isTracked ? (
            <span className="text-primary text-xs font-medium flex items-center gap-1">
              View Details <ArrowRight className="h-3 w-3" />
            </span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-primary hover:bg-primary/10 -mr-2"
              onClick={(e) => {
                e.stopPropagation();
                onQuickTrack();
              }}
            >
              <Play className="h-3 w-3 mr-1" />
              Track
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-7 w-20 bg-muted/50 rounded" />
          <div className="h-5 w-24 bg-muted/50 rounded" />
        </div>
        <div className="h-12 w-12 bg-muted/50 rounded-xl" />
      </div>
      <div className="h-5 w-32 bg-muted/50 rounded mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="h-12 bg-muted/50 rounded" />
        <div className="h-12 bg-muted/50 rounded" />
        <div className="h-12 bg-muted/50 rounded" />
      </div>
      <div className="h-10 bg-muted/50 rounded" />
    </div>
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

  // Take trades 2-4 (skip first one which is the hero) - just 3 more for breathing room
  const gridTrades = candidates.slice(1, 4);

  const handleCardClick = (trade: TradeCandidate) => {
    setSelectedTrade(trade);
    setPanelOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold">More Opportunities</h2>
        <div className="trade-grid">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (gridTrades.length === 0) {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold">More Opportunities</h2>
        <div className="bg-muted/20 rounded-xl p-8 text-center border border-border">
          <p className="text-muted-foreground">
            No additional opportunities match current criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">More Opportunities</h2>
          {candidates.length > 4 && (
            <span className="text-sm text-muted-foreground">
              Showing top 4 of {candidates.length}
            </span>
          )}
        </div>
        <div className="trade-grid">
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
