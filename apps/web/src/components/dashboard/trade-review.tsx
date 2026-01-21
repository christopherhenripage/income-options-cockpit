'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { cn, formatCurrency, getStrategyLabel } from '@/lib/utils';
import { usePaperTrading, PaperTrade } from '@/contexts/paper-trading-context';

interface TradeReviewProps {
  regime?: {
    trend: string;
    volatility: string;
    riskOnOff: string;
    breadth: string;
  };
}

// Generate AI-like feedback based on trade outcome and rules
function generateReview(trade: PaperTrade, regime?: TradeReviewProps['regime']) {
  const isWin = trade.status === 'won';
  const holdingDays = trade.closeDate
    ? Math.ceil(
        (new Date(trade.closeDate).getTime() - new Date(trade.entryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : trade.dte;

  const reviews: string[] = [];
  const lessons: string[] = [];

  if (isWin) {
    reviews.push(`Nice work on ${trade.symbol}! You collected ${formatCurrency(trade.entryCredit)} in premium.`);

    if (holdingDays < trade.dte * 0.5) {
      reviews.push(`You closed early at ${holdingDays} days, capturing profit quickly.`);
      lessons.push('Early profit-taking reduces gamma risk as expiration approaches.');
    } else if (holdingDays >= trade.dte * 0.8) {
      reviews.push(`You held close to expiration (${holdingDays} days).`);
      lessons.push('Consider taking profits earlier (around 50% of max profit) to reduce risk and free up capital.');
    }

    if (trade.rules?.profitTargetPercent && trade.rules.profitTargetPercent <= 50) {
      lessons.push('Your 50% profit target is a solid, mechanical approach that works well for credit spreads.');
    }
  } else {
    reviews.push(`${trade.symbol} didn't work out. Max loss was ${formatCurrency(trade.maxLoss)}.`);

    if (regime?.trend === 'strong_downtrend' && trade.strategyType.includes('put')) {
      reviews.push('The market was in a strong downtrend, which hurt this short put position.');
      lessons.push('In downtrends, consider put credit spreads instead of naked puts, or wait for better conditions.');
    } else if (regime?.volatility === 'high') {
      reviews.push('High volatility likely contributed to adverse price movement.');
      lessons.push('In high-vol environments, use smaller position sizes and wider strikes.');
    }

    lessons.push('Losses are part of the game. A 70% win rate with proper position sizing is a winning strategy.');
  }

  // Strategy-specific feedback
  if (trade.strategyType === 'cash_secured_put') {
    lessons.push('CSPs work best on stocks you\'d be happy to own. Were you prepared to take assignment?');
  } else if (trade.strategyType.includes('spread')) {
    lessons.push('Spreads have defined risk - you knew your max loss going in. That\'s good risk management.');
  }

  return { reviews, lessons };
}

export function TradeReview({ regime }: TradeReviewProps) {
  const { trades } = usePaperTrading();
  const [reviewTrade, setReviewTrade] = useState<PaperTrade | null>(null);
  const [seenTrades, setSeenTrades] = useState<Set<string>>(new Set());

  // Watch for newly closed trades
  useEffect(() => {
    const stored = localStorage.getItem('reviewedTrades');
    if (stored) {
      setSeenTrades(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    const closedTrades = trades.filter((t) => t.status !== 'open');
    const newlyClosed = closedTrades.find(
      (t) => t.closeDate && !seenTrades.has(t.id)
    );

    if (newlyClosed) {
      // Show review for the most recently closed trade
      const sortedClosed = closedTrades
        .filter((t) => t.closeDate && !seenTrades.has(t.id))
        .sort(
          (a, b) =>
            new Date(b.closeDate!).getTime() - new Date(a.closeDate!).getTime()
        );

      if (sortedClosed.length > 0) {
        setReviewTrade(sortedClosed[0]);
      }
    }
  }, [trades, seenTrades]);

  const handleDismiss = () => {
    if (reviewTrade) {
      const newSeen = new Set(seenTrades);
      newSeen.add(reviewTrade.id);
      setSeenTrades(newSeen);
      localStorage.setItem('reviewedTrades', JSON.stringify([...newSeen]));
    }
    setReviewTrade(null);
  };

  if (!reviewTrade) return null;

  const { reviews, lessons } = generateReview(reviewTrade, regime);
  const isWin = reviewTrade.status === 'won';
  const pnl = isWin
    ? reviewTrade.entryCredit
    : -(reviewTrade.closeValue || reviewTrade.maxLoss);

  return (
    <Dialog open={!!reviewTrade} onOpenChange={() => handleDismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isWin ? 'bg-emerald-500/15' : 'bg-rose-500/15'
            )}>
              <Brain className={cn(
                'h-5 w-5',
                isWin ? 'text-profit' : 'text-loss'
              )} />
            </div>
            Trade Review
          </DialogTitle>
          <DialogDescription>
            Here's what I noticed about your {reviewTrade.symbol} trade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trade Summary */}
          <div className={cn(
            'p-4 rounded-xl border',
            isWin ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isWin ? (
                  <CheckCircle className="h-5 w-5 text-profit" />
                ) : (
                  <XCircle className="h-5 w-5 text-loss" />
                )}
                <span className="font-bold text-lg">{reviewTrade.symbol}</span>
                <Badge variant="outline" className="text-xs">
                  {getStrategyLabel(reviewTrade.strategyType)}
                </Badge>
              </div>
              <p className={cn(
                'text-xl font-bold tabular-nums',
                isWin ? 'text-profit' : 'text-loss'
              )}>
                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Entry Credit</p>
                <p className="font-medium">{formatCurrency(reviewTrade.entryCredit)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Max Risk</p>
                <p className="font-medium">{formatCurrency(reviewTrade.maxLoss)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Result</p>
                <p className={cn('font-medium', isWin ? 'text-profit' : 'text-loss')}>
                  {isWin ? 'Winner' : 'Loser'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Review */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              What Happened
            </h4>
            {reviews.map((review, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {review}
              </p>
            ))}
          </div>

          {/* Lessons */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Lessons & Tips
            </h4>
            <ul className="space-y-2">
              {lessons.map((lesson, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{lesson}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleDismiss}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
