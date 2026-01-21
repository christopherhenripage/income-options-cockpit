'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BookOpen,
  Plus,
  Award,
  FlaskConical,
} from 'lucide-react';
import { cn, formatCurrency, getStrategyLabel, getStrategyClass } from '@/lib/utils';
import { usePaperTrading } from '@/contexts/paper-trading-context';

/**
 * Calculate estimated unrealized P&L using time decay approximation
 * Uses square root decay model (options lose value faster near expiration)
 */
function calculateUnrealizedPnL(entryCredit: number, openedAt: string, expiration: string): number {
  const now = new Date();
  const entryDate = new Date(openedAt);
  const expirationDate = new Date(expiration);

  const totalDays = Math.max(1, (expirationDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) return entryCredit;

  const timeDecayFactor = 1 - Math.sqrt(daysRemaining / totalDays);
  return Math.round(entryCredit * timeDecayFactor * 0.85);
}

function calculateDTE(expiration: string): number {
  const now = new Date();
  const expirationDate = new Date(expiration);
  return Math.max(0, Math.round((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// Mock positions data - P&L calculated dynamically
const mockPositionsRaw = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyType: 'cash_secured_put',
    status: 'open',
    openedAt: '2026-01-05',
    strike: 235,
    expiration: '2026-02-21',
    entryCredit: 215,
  },
  {
    id: '2',
    symbol: 'SPY',
    strategyType: 'put_credit_spread',
    status: 'open',
    openedAt: '2025-12-20',
    strike: 575,
    expiration: '2026-02-14',
    entryCredit: 145,
  },
];

// Add calculated P&L and DTE to positions
const mockPositions = mockPositionsRaw.map(p => {
  const currentPnL = calculateUnrealizedPnL(p.entryCredit, p.openedAt, p.expiration);
  const currentValue = p.entryCredit - currentPnL;
  const dte = calculateDTE(p.expiration);
  return { ...p, currentPnL, currentValue, dte };
});

const mockClosedPositions = [
  {
    id: '3',
    symbol: 'MSFT',
    strategyType: 'cash_secured_put',
    openedAt: '2025-12-15',
    closedAt: '2026-01-05',
    entryCredit: 185,
    exitDebit: 45,
    realizedPnL: 140,
    result: 'profit',
  },
];

const mockJournalEntries = [
  {
    id: '1',
    date: '2026-01-18',
    title: 'Weekly Review: Strong start to the year',
    preview: 'Markets continue to trend higher. Closed MSFT position for 76% profit...',
    mood: 'confident',
  },
  {
    id: '2',
    date: '2026-01-11',
    title: 'New positions opened',
    preview: 'Opened AAPL CSP and SPY PCS based on regime analysis...',
    mood: 'cautious',
  },
];

const mockBadges = [
  { type: 'risk_discipline_streak', level: 5, description: '5-day streak following risk rules' },
  { type: 'journaling_streak', level: 3, description: '3 consecutive journal entries' },
];

export default function PortfolioPage() {
  const { trades, stats } = usePaperTrading();

  // Use real paper trades from context
  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status !== 'open');

  // Calculate days remaining for trades
  const getRemaining = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const now = new Date();
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Fall back to mock data if no paper trades exist
  const hasRealTrades = trades.length > 0;
  const totalOpenPnL = hasRealTrades ? 0 : mockPositions.reduce((sum, p) => sum + p.currentPnL, 0);
  const totalRealizedPnL = hasRealTrades ? stats.totalPL : mockClosedPositions.reduce((sum, p) => sum + p.realizedPnL, 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Portfolio"
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Demo Data Banner */}
        {!hasRealTrades && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
            <FlaskConical className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Demo Data</p>
              <p className="text-xs text-muted-foreground">Track trades from the Dashboard to see your real portfolio here</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Positions</p>
                  <p className="text-2xl font-bold">{hasRealTrades ? openTrades.length : mockPositions.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    hasRealTrades && stats.winRate >= 50 ? 'text-profit' : ''
                  )}>
                    {hasRealTrades && stats.closedTrades > 0
                      ? `${stats.winRate.toFixed(0)}%`
                      : '—'
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-profit opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P/L</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    totalRealizedPnL >= 0 ? 'text-profit' : 'text-loss'
                  )}>
                    {totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnL)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{hasRealTrades ? stats.totalTrades : mockBadges.length}</p>
                </div>
                <Award className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList>
            <TabsTrigger value="positions">Open Positions</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="badges">Discipline</TabsTrigger>
          </TabsList>

          {/* Open Positions */}
          <TabsContent value="positions">
            <Card>
              <CardContent className="pt-6">
                {hasRealTrades && openTrades.length > 0 ? (
                  <div className="space-y-4">
                    {openTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="bg-card border border-border p-4 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{trade.symbol}</span>
                            <Badge
                              variant="outline"
                              className={getStrategyClass(trade.strategyType)}
                            >
                              {getStrategyLabel(trade.strategyType)}
                            </Badge>
                          </div>
                          <div className="text-xl font-bold text-profit">
                            +{formatCurrency(trade.entryCredit)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {trade.strike && (
                            <div>
                              <span className="text-muted-foreground">Strike: </span>
                              <span>${trade.strike}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Premium: </span>
                            <span className="text-profit">{formatCurrency(trade.entryCredit)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Loss: </span>
                            <span className="text-loss">{formatCurrency(trade.maxLoss)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {getRemaining(trade.expirationDate)} days to expiration
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasRealTrades ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No open positions</p>
                    <p className="text-sm">Track a trade from the Dashboard to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockPositions.map((position) => (
                      <div
                        key={position.id}
                        className="bg-muted/20 border border-border p-4 rounded-xl opacity-75"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{position.symbol}</span>
                            <Badge
                              variant="outline"
                              className={getStrategyClass(position.strategyType)}
                            >
                              {getStrategyLabel(position.strategyType)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">Demo</Badge>
                          </div>
                          <div className={cn(
                            'text-xl font-bold',
                            position.currentPnL >= 0 ? 'text-profit' : 'text-loss'
                          )}>
                            {position.currentPnL >= 0 ? '+' : ''}{formatCurrency(position.currentPnL)}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Strike: </span>
                            <span>${position.strike}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exp: </span>
                            <span>{position.expiration}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entry: </span>
                            <span className="text-profit">{formatCurrency(position.entryCredit)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current: </span>
                            <span>{formatCurrency(position.currentValue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                {hasRealTrades && closedTrades.length > 0 ? (
                  <div className="space-y-4">
                    {closedTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className={cn(
                          'border p-4 rounded-xl',
                          trade.status === 'won' ? 'bg-profit/5 border-emerald-500/20' : 'bg-loss/5 border-rose-500/20'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{trade.symbol}</span>
                            <Badge
                              variant="outline"
                              className={getStrategyClass(trade.strategyType)}
                            >
                              {getStrategyLabel(trade.strategyType)}
                            </Badge>
                            <Badge variant="outline" className={trade.status === 'won' ? 'text-profit border-emerald-500/30' : 'text-loss border-rose-500/30'}>
                              {trade.status === 'won' ? 'Won' : 'Lost'}
                            </Badge>
                          </div>
                          <div className={cn(
                            'text-xl font-bold',
                            trade.status === 'won' ? 'text-profit' : 'text-loss'
                          )}>
                            {trade.status === 'won'
                              ? `+${formatCurrency(trade.entryCredit)}`
                              : `-${formatCurrency(trade.closeValue || trade.maxLoss)}`
                            }
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Entry Credit: </span>
                            <span className="text-profit">{formatCurrency(trade.entryCredit)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Loss: </span>
                            <span>{formatCurrency(trade.maxLoss)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasRealTrades ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No closed trades yet</p>
                    <p className="text-sm">Mark trades as Won or Lost from the Dashboard</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockClosedPositions.map((position) => (
                      <div
                        key={position.id}
                        className="bg-muted/20 border border-border p-4 rounded-xl opacity-75"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{position.symbol}</span>
                            <Badge
                              variant="outline"
                              className={getStrategyClass(position.strategyType)}
                            >
                              {getStrategyLabel(position.strategyType)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">Demo</Badge>
                          </div>
                          <div className={cn(
                            'text-xl font-bold',
                            position.realizedPnL >= 0 ? 'text-profit' : 'text-loss'
                          )}>
                            {position.realizedPnL >= 0 ? '+' : ''}{formatCurrency(position.realizedPnL)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journal */}
          <TabsContent value="journal">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Trading Journal
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockJournalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="glass-panel p-4 rounded-lg cursor-pointer card-hover"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{entry.title}</span>
                        <Badge variant="outline" className="capitalize">
                          {entry.mood}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {entry.preview}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {entry.date}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discipline Badges */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  Discipline Badges
                </CardTitle>
                <CardDescription>
                  Track your trading discipline and consistency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBadges.map((badge, i) => (
                    <div
                      key={i}
                      className="glass-panel p-4 rounded-lg border-yellow-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Award className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {badge.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Level {badge.level}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        {badge.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
