'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronRight,
  Target,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, getStrategyLabel } from '@/lib/utils';
import { usePaperTrading } from '@/contexts/paper-trading-context';

export function PaperTradingWidget() {
  const { trades, stats, closeTrade, removeTrade } = usePaperTrading();
  const [showPanel, setShowPanel] = useState(false);

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status !== 'open');

  // Calculate days remaining for open trades
  const getRemaining = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const now = new Date();
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (trades.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Paper Trading</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Track trades to see how recommendations perform without risking real money.
        </p>
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No trades tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Paper Trade" on any recommendation
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Paper Trading</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.openTrades} open
          </Badge>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="bg-muted/30 rounded-lg p-2">
            <p className={cn(
              'text-lg font-bold',
              stats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {stats.totalPL >= 0 ? '+' : ''}
              {formatCurrency(stats.totalPL)}
            </p>
            <p className="text-xs text-muted-foreground">P&L</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <p className={cn(
              'text-lg font-bold',
              stats.winRate >= 60 ? 'text-green-400' : stats.winRate >= 40 ? 'text-yellow-400' : 'text-muted-foreground'
            )}>
              {stats.closedTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-bold">{stats.totalTrades}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Open Positions Preview */}
        {openTrades.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs text-muted-foreground font-medium">Open Positions:</p>
            {openTrades.slice(0, 2).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between bg-muted/20 rounded-lg p-2"
              >
                <div>
                  <span className="font-medium">{trade.symbol}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {getStrategyLabel(trade.strategyType)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">
                    +{formatCurrency(trade.entryCredit)}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getRemaining(trade.expirationDate)}d
                  </span>
                </div>
              </div>
            ))}
            {openTrades.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{openTrades.length - 2} more
              </p>
            )}
          </div>
        )}

        {/* View All Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowPanel(true)}
        >
          Manage Trades
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Card>

      {/* Full Paper Trading Panel */}
      <Sheet open={showPanel} onOpenChange={setShowPanel}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Paper Trading
            </SheetTitle>
            <SheetDescription>
              Track and manage your paper trades
            </SheetDescription>
          </SheetHeader>

          {/* Full Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="text-center">
              <p className={cn(
                'text-xl font-bold',
                stats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {stats.totalPL >= 0 ? '+' : ''}{formatCurrency(stats.totalPL)}
              </p>
              <p className="text-xs text-muted-foreground">Total P&L</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-400">{stats.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-400">{stats.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'text-xl font-bold',
                stats.winRate >= 60 ? 'text-green-400' : stats.winRate >= 40 ? 'text-yellow-400' : 'text-muted-foreground'
              )}>
                {stats.closedTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>

          {/* Open Trades */}
          {openTrades.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Open Positions ({openTrades.length})
              </h4>
              <div className="space-y-3">
                {openTrades.map((trade) => {
                  const daysRemaining = getRemaining(trade.expirationDate);
                  const isExpired = daysRemaining === 0;

                  return (
                    <div
                      key={trade.id}
                      className={cn(
                        'bg-muted/30 rounded-lg p-4',
                        isExpired && 'border border-yellow-500/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{trade.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {getStrategyLabel(trade.strategyType)}
                            </Badge>
                          </div>
                          {trade.strike && (
                            <p className="text-sm text-muted-foreground">
                              ${trade.strike} strike
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">
                            +{formatCurrency(trade.entryCredit)}
                          </p>
                          <p className={cn(
                            'text-sm',
                            isExpired ? 'text-yellow-400' : 'text-muted-foreground'
                          )}>
                            {isExpired ? 'Expired!' : `${daysRemaining}d left`}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => closeTrade(trade.id, 'won')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => closeTrade(trade.id, 'lost', trade.maxLoss)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Lost
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => removeTrade(trade.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {isExpired && (
                        <p className="text-xs text-yellow-400 mt-2">
                          This trade has expired. Mark it as won or lost to update your stats.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Closed Trades */}
          {closedTrades.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Trade History ({closedTrades.length})
              </h4>
              <div className="space-y-2">
                {closedTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      trade.status === 'won' ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {trade.status === 'won' ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <span className="font-medium">{trade.symbol}</span>
                        <p className="text-xs text-muted-foreground">
                          {getStrategyLabel(trade.strategyType)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-semibold',
                        trade.status === 'won' ? 'text-green-400' : 'text-red-400'
                      )}>
                        {trade.status === 'won'
                          ? `+${formatCurrency(trade.entryCredit)}`
                          : `-${formatCurrency(trade.closeValue || trade.maxLoss)}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {trades.length === 0 && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No paper trades yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Paper Trade" on any recommendation to start tracking
              </p>
            </div>
          )}

          {/* Learning Note */}
          {trades.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Paper trading helps you learn without risking real money.
                Track how recommendations perform to build confidence.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
