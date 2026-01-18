'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Radio, Droplets } from 'lucide-react';
import { cn, formatCompact } from '@/lib/utils';

// Mock liquidity data
const liquidityData = [
  { symbol: 'SPY', score: 95, volume: 45000000, optionVolume: 2500000, spreadScore: 98 },
  { symbol: 'QQQ', score: 92, volume: 32000000, optionVolume: 1800000, spreadScore: 95 },
  { symbol: 'AAPL', score: 88, volume: 48000000, optionVolume: 1200000, spreadScore: 90 },
  { symbol: 'NVDA', score: 85, volume: 280000000, optionVolume: 900000, spreadScore: 82 },
  { symbol: 'MSFT', score: 82, volume: 18000000, optionVolume: 600000, spreadScore: 85 },
  { symbol: 'TSLA', score: 80, volume: 85000000, optionVolume: 1500000, spreadScore: 75 },
  { symbol: 'META', score: 78, volume: 12000000, optionVolume: 450000, spreadScore: 80 },
  { symbol: 'AMZN', score: 75, volume: 35000000, optionVolume: 500000, spreadScore: 78 },
];

function getLiquidityBadge(score: number) {
  if (score >= 90) return { label: 'Excellent', variant: 'success' as const };
  if (score >= 75) return { label: 'Good', variant: 'info' as const };
  if (score >= 60) return { label: 'Fair', variant: 'warning' as const };
  return { label: 'Poor', variant: 'danger' as const };
}

export function LiquidityRadar() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Liquidity Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {liquidityData.map((item) => {
            const badge = getLiquidityBadge(item.score);
            return (
              <div
                key={item.symbol}
                className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="w-16 font-semibold">{item.symbol}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Vol: {formatCompact(item.volume)}
                      </span>
                    </div>
                    <span className="font-medium">{item.score}</span>
                  </div>
                  <Progress
                    value={item.score}
                    className={cn(
                      'h-2',
                      item.score >= 90 ? '[&>div]:bg-green-500' :
                      item.score >= 75 ? '[&>div]:bg-blue-500' :
                      item.score >= 60 ? '[&>div]:bg-yellow-500' :
                      '[&>div]:bg-red-500'
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>Liquidity score combines underlying volume, option OI, and bid-ask spread</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
