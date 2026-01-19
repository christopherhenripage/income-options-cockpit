'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  DollarSign,
  Clock,
  Target,
  Loader2,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
  getScoreColor,
} from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/jargon-tooltip';

interface TradeCandidate {
  id: string;
  symbol: string;
  strategyType: string;
  score: number;
  netCredit: number;
  maxLoss: number;
  dte: number;
}

interface TopTradesProps {
  candidates?: TradeCandidate[];
  loading?: boolean;
}

// Mock data as fallback
const mockTrades: TradeCandidate[] = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyType: 'cash_secured_put',
    score: 78,
    netCredit: 215,
    maxLoss: 2285,
    dte: 32,
  },
  {
    id: '2',
    symbol: 'MSFT',
    strategyType: 'put_credit_spread',
    score: 72,
    netCredit: 145,
    maxLoss: 355,
    dte: 28,
  },
  {
    id: '3',
    symbol: 'SPY',
    strategyType: 'cash_secured_put',
    score: 68,
    netCredit: 185,
    maxLoss: 5815,
    dte: 35,
  },
  {
    id: '4',
    symbol: 'NVDA',
    strategyType: 'call_credit_spread',
    score: 65,
    netCredit: 120,
    maxLoss: 380,
    dte: 21,
  },
];

export function TopTrades({ candidates, loading }: TopTradesProps) {
  const trades = candidates && candidates.length > 0 ? candidates : mockTrades;
  const isLiveData = candidates && candidates.length > 0;

  // Calculate annualized return from credit/max loss and DTE
  const getAnnualizedReturn = (trade: TradeCandidate) => {
    const returnPct = (trade.netCredit / trade.maxLoss) * 100;
    const annualized = (returnPct / trade.dte) * 365;
    return annualized;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top Trade Candidates
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isLiveData && (
              <Badge variant="outline" className="ml-2 text-green-400 border-green-400/50">
                Live Data
              </Badge>
            )}
          </CardTitle>
          <Link href="/trades">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !candidates ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing market opportunities...</p>
            </div>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No trade opportunities found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your risk settings or checking back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {trades.slice(0, 4).map((trade) => (
              <Link key={trade.id} href={`/trades/${trade.id}`}>
                <div className="glass-panel p-4 rounded-lg card-hover h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{trade.symbol}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-sm', getStrategyClass(trade.strategyType))}
                      >
                        {getStrategyLabel(trade.strategyType)}
                      </Badge>
                    </div>
                    <div className={cn(
                      'text-2xl font-bold',
                      getScoreColor(trade.score)
                    )}>
                      {trade.score}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Credit
                        <InfoTooltip term="credit" />
                      </span>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(trade.netCredit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Max Risk
                        <InfoTooltip term="max loss" />
                      </span>
                      <span className="text-red-400 font-medium">
                        {formatCurrency(trade.maxLoss)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Ann. Return
                        <InfoTooltip term="annualized return" />
                      </span>
                      <span className="text-primary font-medium">
                        {formatPercent(getAnnualizedReturn(trade))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> DTE
                        <InfoTooltip term="dte" />
                      </span>
                      <span className="font-medium">{trade.dte} days</span>
                    </div>
                  </div>

                  {/* Score indicator */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground flex items-center">
                        Score
                        <InfoTooltip term="score" />
                      </span>
                      <span>{trade.score}/100</span>
                    </div>
                    <Progress value={trade.score} className="h-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
