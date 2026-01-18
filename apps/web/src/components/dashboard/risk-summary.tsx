'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

// Mock risk data
const riskData = {
  preset: 'balanced',
  accountSize: 50000,
  limits: {
    maxRiskPerTrade: { pct: 3, current: 1.8, status: 'ok' },
    maxTotalRisk: { pct: 15, current: 8.5, status: 'ok' },
    dailyLossLimit: { pct: 5, current: 0, status: 'ok' },
    maxOrdersPerDay: { max: 5, current: 2, status: 'ok' },
  },
  killSwitches: {
    tradingEnabled: false,
    brokerExecutionEnabled: false,
    paperModeEnabled: true,
  },
};

export function RiskSummary() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'danger':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risk Status
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {riskData.preset}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Kill Switches */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Safety Switches
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={cn(
              'glass-panel p-2 rounded-lg text-center',
              riskData.killSwitches.tradingEnabled ? 'border-green-500/50' : 'border-red-500/50'
            )}>
              <div className={cn(
                'text-xs font-medium',
                riskData.killSwitches.tradingEnabled ? 'text-green-400' : 'text-red-400'
              )}>
                Trading
              </div>
              <div className="text-xs text-muted-foreground">
                {riskData.killSwitches.tradingEnabled ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className={cn(
              'glass-panel p-2 rounded-lg text-center',
              riskData.killSwitches.brokerExecutionEnabled ? 'border-green-500/50' : 'border-red-500/50'
            )}>
              <div className={cn(
                'text-xs font-medium',
                riskData.killSwitches.brokerExecutionEnabled ? 'text-green-400' : 'text-red-400'
              )}>
                Broker
              </div>
              <div className="text-xs text-muted-foreground">
                {riskData.killSwitches.brokerExecutionEnabled ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className={cn(
              'glass-panel p-2 rounded-lg text-center',
              riskData.killSwitches.paperModeEnabled ? 'border-green-500/50' : 'border-muted'
            )}>
              <div className={cn(
                'text-xs font-medium',
                riskData.killSwitches.paperModeEnabled ? 'text-green-400' : 'text-muted-foreground'
              )}>
                Paper
              </div>
              <div className="text-xs text-muted-foreground">
                {riskData.killSwitches.paperModeEnabled ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Limits */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Risk Limits
          </div>

          {/* Per Trade */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(riskData.limits.maxRiskPerTrade.status)}
                Per Trade
              </span>
              <span className="text-muted-foreground">
                {formatPercent(riskData.limits.maxRiskPerTrade.current)} / {formatPercent(riskData.limits.maxRiskPerTrade.pct)}
              </span>
            </div>
            <Progress
              value={(riskData.limits.maxRiskPerTrade.current / riskData.limits.maxRiskPerTrade.pct) * 100}
              className="h-1.5"
            />
          </div>

          {/* Total Risk */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(riskData.limits.maxTotalRisk.status)}
                Total Risk
              </span>
              <span className="text-muted-foreground">
                {formatPercent(riskData.limits.maxTotalRisk.current)} / {formatPercent(riskData.limits.maxTotalRisk.pct)}
              </span>
            </div>
            <Progress
              value={(riskData.limits.maxTotalRisk.current / riskData.limits.maxTotalRisk.pct) * 100}
              className="h-1.5"
            />
          </div>

          {/* Daily Loss */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(riskData.limits.dailyLossLimit.status)}
                Daily Loss
              </span>
              <span className="text-muted-foreground">
                {formatPercent(riskData.limits.dailyLossLimit.current)} / {formatPercent(riskData.limits.dailyLossLimit.pct)}
              </span>
            </div>
            <Progress
              value={(riskData.limits.dailyLossLimit.current / riskData.limits.dailyLossLimit.pct) * 100}
              className="h-1.5"
            />
          </div>

          {/* Orders Today */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(riskData.limits.maxOrdersPerDay.status)}
                Orders Today
              </span>
              <span className="text-muted-foreground">
                {riskData.limits.maxOrdersPerDay.current} / {riskData.limits.maxOrdersPerDay.max}
              </span>
            </div>
            <Progress
              value={(riskData.limits.maxOrdersPerDay.current / riskData.limits.maxOrdersPerDay.max) * 100}
              className="h-1.5"
            />
          </div>
        </div>

        {/* Account Size */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Account Size</span>
            <span className="font-medium">{formatCurrency(riskData.accountSize)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
