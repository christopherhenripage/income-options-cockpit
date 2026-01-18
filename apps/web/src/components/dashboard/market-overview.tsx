'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3 } from 'lucide-react';
import { cn, getTrendClass, getVolatilityClass } from '@/lib/utils';

// Mock data - in real app, this would come from the engine
const mockRegime = {
  trend: 'uptrend',
  volatility: 'normal',
  riskOnOff: 'risk_on',
  breadth: {
    assessment: 'healthy',
    percentAbove50MA: 62,
  },
  spyChange: 0.85,
  qqqChange: 1.12,
  vixLevel: 16.5,
};

const symbols = [
  { symbol: 'SPY', price: 585.42, change: 0.85, trend: 'uptrend', vol: 'normal' },
  { symbol: 'QQQ', price: 512.35, change: 1.12, trend: 'strong_uptrend', vol: 'normal' },
  { symbol: 'IWM', price: 225.18, change: -0.22, trend: 'neutral', vol: 'elevated' },
  { symbol: 'DIA', price: 428.55, change: 0.45, trend: 'uptrend', vol: 'low' },
];

export function MarketOverview() {
  const getTrendIcon = (trend: string) => {
    if (trend.includes('uptrend')) return TrendingUp;
    if (trend.includes('downtrend')) return TrendingDown;
    return Minus;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Regime Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Trend</div>
            <div className={cn('text-lg font-semibold capitalize', getTrendClass(mockRegime.trend))}>
              {mockRegime.trend.replace('_', ' ')}
            </div>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Volatility</div>
            <div className={cn('text-lg font-semibold capitalize', getVolatilityClass(mockRegime.volatility))}>
              {mockRegime.volatility}
            </div>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Risk Regime</div>
            <div className={cn(
              'text-lg font-semibold capitalize',
              mockRegime.riskOnOff === 'risk_on' ? 'text-green-400' : 'text-red-400'
            )}>
              {mockRegime.riskOnOff.replace('_', ' ')}
            </div>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Breadth</div>
            <div className="text-lg font-semibold capitalize text-blue-400">
              {mockRegime.breadth.assessment}
            </div>
            <div className="text-xs text-muted-foreground">
              {mockRegime.breadth.percentAbove50MA}% above 50MA
            </div>
          </div>
        </div>

        {/* Symbol Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {symbols.map((item) => {
            const TrendIcon = getTrendIcon(item.trend);
            const isPositive = item.change >= 0;

            return (
              <div
                key={item.symbol}
                className="glass-panel p-4 rounded-lg card-hover cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{item.symbol}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      getTrendClass(item.trend)
                    )}
                  >
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {item.trend.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ${item.price.toFixed(2)}
                </div>
                <div className={cn(
                  'text-sm flex items-center gap-1',
                  isPositive ? 'text-green-400' : 'text-red-400'
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? '+' : ''}{item.change.toFixed(2)}%
                </div>
                <div className={cn(
                  'text-xs mt-1',
                  getVolatilityClass(item.vol)
                )}>
                  IV: {item.vol}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
