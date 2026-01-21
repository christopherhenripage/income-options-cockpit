'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertCircle,
  Target,
  Shield,
  Clock,
  Settings2,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Bell,
  ChevronRight,
  Zap,
  Activity,
} from 'lucide-react';
import { cn, formatCurrency, getStrategyLabel } from '@/lib/utils';
import { usePaperTrading, PaperTrade, PositionRules } from '@/contexts/paper-trading-context';

interface PositionTrackerProps {
  regime?: {
    trend: string;
    volatility: string;
    riskOnOff: string;
    breadth: string;
  };
}

export function PositionTracker({ regime }: PositionTrackerProps) {
  const {
    trades,
    stats,
    closeTrade,
    updateRules,
    updateCurrentValue,
    addAlert,
    dismissAlert,
    getActiveAlerts,
  } = usePaperTrading();

  const [editingPosition, setEditingPosition] = useState<PaperTrade | null>(null);
  const [editRules, setEditRules] = useState<PositionRules | null>(null);
  const [lastRegime, setLastRegime] = useState<string | null>(null);

  const openTrades = trades.filter((t) => t.status === 'open');
  const activeAlerts = getActiveAlerts();

  // Watch for regime changes and alert on positions at risk
  useEffect(() => {
    if (!regime || openTrades.length === 0) return;

    const currentRegime = `${regime.trend}-${regime.volatility}`;

    // Only trigger on regime change, not initial load
    if (lastRegime && lastRegime !== currentRegime) {
      // Check if regime change affects any positions
      openTrades.forEach((trade) => {
        const isShortPut = trade.strategyType.includes('put') || trade.strategyType === 'cash_secured_put';
        const isShortCall = trade.strategyType.includes('call') && trade.strategyType !== 'cash_secured_put';

        let shouldAlert = false;
        let message = '';

        // Short puts are hurt by downtrends
        if (isShortPut && regime.trend.includes('downtrend')) {
          shouldAlert = true;
          message = `Market shifted to ${regime.trend.replace('_', ' ')} - watch your ${trade.symbol} short put position`;
        }

        // Short calls are hurt by uptrends
        if (isShortCall && regime.trend.includes('uptrend')) {
          shouldAlert = true;
          message = `Market shifted to ${regime.trend.replace('_', ' ')} - watch your ${trade.symbol} short call position`;
        }

        // High volatility affects all positions
        if (regime.volatility === 'high' && !lastRegime.includes('high')) {
          shouldAlert = true;
          message = `Volatility spiked to high - consider tightening stops on ${trade.symbol}`;
        }

        if (shouldAlert) {
          const hasAlert = trade.alerts?.some(
            (a) => a.type === 'regime_change' && !a.dismissed && a.message === message
          );
          if (!hasAlert) {
            addAlert(trade.id, { type: 'regime_change', message });
          }
        }
      });
    }

    setLastRegime(currentRegime);
  }, [regime, openTrades, lastRegime, addAlert]);

  // Calculate days remaining
  const getRemaining = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const now = new Date();
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Calculate P&L percentage for a position
  const getPLPercent = (trade: PaperTrade) => {
    if (!trade.currentValue) return 0;
    return ((trade.entryCredit - trade.currentValue) / trade.entryCredit) * 100;
  };

  // Simulate price changes for demo (in production, this would fetch real prices)
  useEffect(() => {
    const interval = setInterval(() => {
      openTrades.forEach((trade) => {
        // Simulate some random price movement for demo
        const change = (Math.random() - 0.45) * trade.entryCredit * 0.1;
        const newValue = Math.max(0, (trade.currentValue || trade.entryCredit) + change);
        updateCurrentValue(trade.id, Math.round(newValue * 100) / 100);

        // Check rules and generate alerts
        if (trade.rules) {
          const plPercent = ((trade.entryCredit - newValue) / trade.entryCredit) * 100;
          const daysRemaining = getRemaining(trade.expirationDate);

          // Check profit target
          if (plPercent >= trade.rules.profitTargetPercent) {
            const hasAlert = trade.alerts?.some(
              (a) => a.type === 'profit_target' && !a.dismissed
            );
            if (!hasAlert) {
              addAlert(trade.id, {
                type: 'profit_target',
                message: `${trade.symbol} hit ${trade.rules.profitTargetPercent}% profit target!`,
              });
            }
          }

          // Check stop loss (negative P&L means loss)
          if (plPercent <= -trade.rules.stopLossPercent) {
            const hasAlert = trade.alerts?.some(
              (a) => a.type === 'stop_loss' && !a.dismissed
            );
            if (!hasAlert) {
              addAlert(trade.id, {
                type: 'stop_loss',
                message: `${trade.symbol} hit stop loss at ${Math.abs(plPercent).toFixed(0)}% loss`,
              });
            }
          }

          // Check DTE warning
          if (daysRemaining <= trade.rules.dteExit && daysRemaining > 0) {
            const hasAlert = trade.alerts?.some(
              (a) => a.type === 'dte_warning' && !a.dismissed
            );
            if (!hasAlert) {
              addAlert(trade.id, {
                type: 'dte_warning',
                message: `${trade.symbol} approaching ${trade.rules.dteExit} DTE exit point`,
              });
            }
          }
        }
      });
    }, 5000); // Update every 5 seconds for demo

    return () => clearInterval(interval);
  }, [openTrades, updateCurrentValue, addAlert]);

  const handleSaveRules = () => {
    if (editingPosition && editRules) {
      updateRules(editingPosition.id, editRules);
      setEditingPosition(null);
      setEditRules(null);
    }
  };

  // Empty state
  if (openTrades.length === 0 && activeAlerts.length === 0) {
    return (
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Position Co-Pilot</h2>
            <p className="text-sm text-muted-foreground">Your open positions will appear here</p>
          </div>
        </div>

        <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
          <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No active positions</p>
          <p className="text-sm text-muted-foreground">
            Track a trade below to start managing your positions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="card-elevated border-amber-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-amber-400" />
            <span className="font-medium text-sm">Position Alerts</span>
            <Badge variant="outline" className="text-amber-400 border-amber-500/30">
              {activeAlerts.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map(({ trade, alert }) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg text-sm',
                  alert.type === 'profit_target' && 'bg-emerald-500/10 border border-emerald-500/20',
                  alert.type === 'stop_loss' && 'bg-rose-500/10 border border-rose-500/20',
                  alert.type === 'dte_warning' && 'bg-amber-500/10 border border-amber-500/20',
                  alert.type === 'regime_change' && 'bg-violet-500/10 border border-violet-500/20'
                )}
              >
                <div className="flex items-center gap-2">
                  {alert.type === 'profit_target' && <TrendingUp className="h-4 w-4 text-profit" />}
                  {alert.type === 'stop_loss' && <TrendingDown className="h-4 w-4 text-loss" />}
                  {alert.type === 'dte_warning' && <Clock className="h-4 w-4 text-amber-400" />}
                  {alert.type === 'regime_change' && <Activity className="h-4 w-4 text-violet-400" />}
                  <span>{alert.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => dismissAlert(trade.id, alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Position Tracker */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Position Co-Pilot</h2>
              <p className="text-sm text-muted-foreground">
                {openTrades.length} active position{openTrades.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className={cn(
                'font-bold tabular-nums',
                stats.totalPL >= 0 ? 'text-profit' : 'text-loss'
              )}>
                {stats.totalPL >= 0 ? '+' : ''}{formatCurrency(stats.totalPL)}
              </p>
              <p className="text-xs text-muted-foreground">Total P&L</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="font-bold">
                {stats.closedTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Positions List */}
        <div className="space-y-3">
          {openTrades.map((trade) => {
            const daysRemaining = getRemaining(trade.expirationDate);
            const plPercent = getPLPercent(trade);
            const isProfit = plPercent > 0;
            const currentPL = trade.entryCredit - (trade.currentValue || trade.entryCredit);

            return (
              <div
                key={trade.id}
                className={cn(
                  'bg-card border rounded-xl p-4 transition-all',
                  trade.alerts?.some((a) => !a.dismissed)
                    ? 'border-amber-500/50'
                    : 'border-border hover:border-primary/30'
                )}
              >
                {/* Position Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg',
                      isProfit ? 'bg-emerald-500/15 text-profit' : 'bg-rose-500/15 text-loss'
                    )}>
                      {trade.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{trade.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {getStrategyLabel(trade.strategyType)}
                        </Badge>
                      </div>
                      {trade.strike && (
                        <p className="text-xs text-muted-foreground">
                          ${trade.strike} strike
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={cn(
                      'font-bold tabular-nums',
                      isProfit ? 'text-profit' : 'text-loss'
                    )}>
                      {isProfit ? '+' : ''}{formatCurrency(currentPL)}
                    </p>
                    <p className={cn(
                      'text-xs tabular-nums',
                      isProfit ? 'text-emerald-400/70' : 'text-rose-400/70'
                    )}>
                      {isProfit ? '+' : ''}{plPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Position Details */}
                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Entry Credit</p>
                    <p className="font-medium text-profit">+{formatCurrency(trade.entryCredit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Current Value</p>
                    <p className="font-medium">{formatCurrency(trade.currentValue || trade.entryCredit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Max Risk</p>
                    <p className="font-medium text-loss">{formatCurrency(trade.maxLoss)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Days Left</p>
                    <p className={cn(
                      'font-medium',
                      daysRemaining <= 7 ? 'text-amber-400' : ''
                    )}>
                      {daysRemaining}d
                    </p>
                  </div>
                </div>

                {/* Rules Display */}
                {trade.rules && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mb-4">
                    <span className="text-xs text-muted-foreground">Your Rules:</span>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="gap-1 text-profit border-emerald-500/30">
                        <Target className="h-3 w-3" />
                        Take profit @ {trade.rules.profitTargetPercent}%
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-loss border-rose-500/30">
                        <Shield className="h-3 w-3" />
                        Stop @ {trade.rules.stopLossPercent}%
                      </Badge>
                      <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-400">
                        <Clock className="h-3 w-3" />
                        Exit @ {trade.rules.dteExit} DTE
                      </Badge>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="end">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Edit Rules</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Profit Target (%)</Label>
                              <Input
                                type="number"
                                defaultValue={trade.rules.profitTargetPercent}
                                className="h-8"
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (trade.rules && value > 0) {
                                    updateRules(trade.id, { ...trade.rules, profitTargetPercent: value });
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Stop Loss (%)</Label>
                              <Input
                                type="number"
                                defaultValue={trade.rules.stopLossPercent}
                                className="h-8"
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (trade.rules && value > 0) {
                                    updateRules(trade.id, { ...trade.rules, stopLossPercent: value });
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">DTE Exit</Label>
                              <Input
                                type="number"
                                defaultValue={trade.rules.dteExit}
                                className="h-8"
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (trade.rules && value >= 0) {
                                    updateRules(trade.id, { ...trade.rules, dteExit: value });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-emerald-500/30 text-profit hover:bg-emerald-500/10"
                    onClick={() => closeTrade(trade.id, 'won')}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Close Winner
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-rose-500/30 text-loss hover:bg-rose-500/10"
                    onClick={() => closeTrade(trade.id, 'lost', trade.maxLoss)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Close Loser
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
