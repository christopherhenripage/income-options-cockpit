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
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
  getScoreColor,
} from '@/lib/utils';

// Mock data
const mockTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyType: 'cash_secured_put',
    score: 78,
    netCredit: 215,
    maxLoss: 2285,
    dte: 32,
    strike: 235,
    returnOnRisk: 28.5,
    conviction: { confidence: 72, uncertainty: 18 },
  },
  {
    id: '2',
    symbol: 'MSFT',
    strategyType: 'put_credit_spread',
    score: 72,
    netCredit: 145,
    maxLoss: 355,
    dte: 28,
    strike: 420,
    returnOnRisk: 45.2,
    conviction: { confidence: 68, uncertainty: 22 },
  },
  {
    id: '3',
    symbol: 'SPY',
    strategyType: 'cash_secured_put',
    score: 68,
    netCredit: 185,
    maxLoss: 5815,
    dte: 35,
    strike: 575,
    returnOnRisk: 21.8,
    conviction: { confidence: 65, uncertainty: 25 },
  },
  {
    id: '4',
    symbol: 'NVDA',
    strategyType: 'call_credit_spread',
    score: 65,
    netCredit: 120,
    maxLoss: 380,
    dte: 21,
    strike: 150,
    returnOnRisk: 52.3,
    conviction: { confidence: 58, uncertainty: 32 },
  },
];

export function TopTrades() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top Trade Candidates
          </CardTitle>
          <Link href="/trades">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {mockTrades.map((trade) => (
            <Link key={trade.id} href={`/trades/${trade.id}`}>
              <div className="glass-panel p-4 rounded-lg card-hover h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{trade.symbol}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getStrategyClass(trade.strategyType))}
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
                    </span>
                    <span className="text-green-400 font-medium">
                      {formatCurrency(trade.netCredit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Max Risk
                    </span>
                    <span className="text-red-400 font-medium">
                      {formatCurrency(trade.maxLoss)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Ann. Return
                    </span>
                    <span className="text-primary font-medium">
                      {formatPercent(trade.returnOnRisk)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> DTE
                    </span>
                    <span className="font-medium">{trade.dte} days</span>
                  </div>
                </div>

                {/* Conviction Meter */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span>{trade.conviction.confidence}%</span>
                  </div>
                  <Progress value={trade.conviction.confidence} className="h-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
