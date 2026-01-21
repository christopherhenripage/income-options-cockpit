'use client';

import { useState } from 'react';
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
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronRight,
  Target,
} from 'lucide-react';
import { cn, formatCurrency, getStrategyLabel } from '@/lib/utils';
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
      <div className="card-elevated p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Paper Trading</h3>
        </div>
        <div className="text-center py-6 bg-muted/20 rounded-xl border border-border">
          <Target className="empty-state-icon h-10 w-10 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No trades tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Track" on any opportunity
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Paper Trading</h3>
          </div>
          {stats.openTrades > 0 && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {stats.openTrades} active
            </Badge>
          )}
        </div>

        {/* Stats - Clean */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className={cn(
              'text-lg font-bold tabular-nums',
              stats.totalPL >= 0 ? 'text-profit' : 'text-loss'
            )}>
              {stats.totalPL >= 0 ? '+' : ''}{formatCurrency(stats.totalPL)}
            </p>
            <p className="text-xs text-muted-foreground">P&L</p>
          </div>
          <div className="text-center">
            <p className={cn(
              'text-lg font-bold',
              stats.closedTrades > 0 && (stats.winRate >= 60 ? 'text-profit' : stats.winRate >= 40 ? 'score-medium' : 'text-muted-foreground')
            )}>
              {stats.closedTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{stats.totalTrades}</p>
            <p className="text-xs text-muted-foreground">Trades</p>
          </div>
        </div>

        {/* Open Positions Preview */}
        {openTrades.length > 0 && (
          <div className="space-y-2 mb-4">
            {openTrades.slice(0, 2).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between bg-muted/20 rounded-lg p-2.5"
              >
                <div>
                  <span className="font-medium">{trade.symbol}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {getStrategyLabel(trade.strategyType)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-profit font-medium">
                    +{formatCurrency(trade.entryCredit)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRemaining(trade.expirationDate)}d
                  </span>
                </div>
              </div>
            ))}
            {openTrades.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{openTrades.length - 2} more positions
              </p>
            )}
          </div>
        )}

        {/* Manage Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-border hover:bg-muted"
          onClick={() => setShowPanel(true)}
        >
          Manage Trades
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Full Paper Trading Panel */}
      <Sheet open={showPanel} onOpenChange={setShowPanel}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Paper Trading
            </SheetTitle>
            <SheetDescription>
              Track your practice trades
            </SheetDescription>
          </SheetHeader>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-muted/20 rounded-xl">
            <div className="text-center">
              <p className={cn(
                'text-lg font-bold tabular-nums',
                stats.totalPL >= 0 ? 'text-profit' : 'text-loss'
              )}>
                {stats.totalPL >= 0 ? '+' : ''}{formatCurrency(stats.totalPL)}
              </p>
              <p className="text-xs text-muted-foreground">P&L</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-profit">{stats.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-loss">{stats.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'text-lg font-bold',
                stats.closedTrades > 0 && (stats.winRate >= 60 ? 'text-profit' : stats.winRate >= 40 ? 'score-medium' : '')
              )}>
                {stats.closedTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Rate</p>
            </div>
          </div>

          {/* Open Trades */}
          {openTrades.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Open Positions
              </h4>
              <div className="space-y-3">
                {openTrades.map((trade) => {
                  const daysRemaining = getRemaining(trade.expirationDate);
                  const isExpired = daysRemaining === 0;

                  return (
                    <div
                      key={trade.id}
                      className={cn(
                        'bg-card border border-border rounded-xl p-4',
                        isExpired && 'border-amber-500/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{trade.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {getStrategyLabel(trade.strategyType)}
                            </Badge>
                          </div>
                          {trade.strike && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ${trade.strike} strike
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-profit font-semibold">
                            +{formatCurrency(trade.entryCredit)}
                          </p>
                          <p className={cn(
                            'text-xs',
                            isExpired ? 'score-medium' : 'text-muted-foreground'
                          )}>
                            {isExpired ? 'Expired' : `${daysRemaining}d left`}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-emerald-500/30 text-profit hover:bg-emerald-500/10"
                          onClick={() => closeTrade(trade.id, 'won')}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-rose-500/30 text-loss hover:bg-rose-500/10"
                          onClick={() => closeTrade(trade.id, 'lost', trade.maxLoss)}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Lost
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground px-2"
                          onClick={() => removeTrade(trade.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isExpired && (
                        <p className="text-xs score-medium mt-2">
                          Mark this trade as won or lost to update stats.
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
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                History
              </h4>
              <div className="space-y-2">
                {closedTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      trade.status === 'won' ? 'bg-profit/10' : 'bg-loss/10'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {trade.status === 'won' ? (
                        <CheckCircle className="h-4 w-4 text-profit" />
                      ) : (
                        <XCircle className="h-4 w-4 text-loss" />
                      )}
                      <div>
                        <span className="font-medium text-sm">{trade.symbol}</span>
                        <p className="text-xs text-muted-foreground">
                          {getStrategyLabel(trade.strategyType)}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      'font-semibold text-sm tabular-nums',
                      trade.status === 'won' ? 'text-profit' : 'text-loss'
                    )}>
                      {trade.status === 'won'
                        ? `+${formatCurrency(trade.entryCredit)}`
                        : `-${formatCurrency(trade.closeValue || trade.maxLoss)}`
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {trades.length === 0 && (
            <div className="text-center py-10">
              <Target className="empty-state-icon h-12 w-12 mx-auto mb-4" />
              <p className="text-muted-foreground">No trades yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Track any opportunity to get started
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
