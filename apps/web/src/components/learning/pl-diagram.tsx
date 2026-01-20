'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PLDiagramProps {
  strategyType: string;
  strike: number;
  strike2?: number; // For spreads
  underlyingPrice: number;
  credit: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
  className?: string;
}

export function PLDiagram({
  strategyType,
  strike,
  strike2,
  underlyingPrice,
  credit,
  maxProfit,
  maxLoss,
  breakeven,
  className,
}: PLDiagramProps) {
  // Calculate price range to show
  const priceRange = useMemo(() => {
    const buffer = underlyingPrice * 0.15; // Show 15% above and below
    const minPrice = Math.max(0, Math.min(strike, strike2 || strike, breakeven) - buffer);
    const maxPrice = Math.max(strike, strike2 || strike, underlyingPrice) + buffer;
    return { min: minPrice, max: maxPrice };
  }, [underlyingPrice, strike, strike2, breakeven]);

  // Generate P&L points for the chart
  const plPoints = useMemo(() => {
    const points: { price: number; pl: number }[] = [];
    const steps = 50;
    const step = (priceRange.max - priceRange.min) / steps;

    for (let i = 0; i <= steps; i++) {
      const price = priceRange.min + i * step;
      const pl = calculatePL(strategyType, price, strike, strike2, credit, maxProfit, maxLoss);
      points.push({ price, pl });
    }
    return points;
  }, [strategyType, strike, strike2, credit, maxProfit, maxLoss, priceRange]);

  // Find the max absolute P&L for scaling
  const maxAbsPL = Math.max(Math.abs(maxProfit), Math.abs(maxLoss));

  // Convert price to X position (percentage)
  const priceToX = (price: number) => {
    return ((price - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
  };

  // Convert P&L to Y position (percentage, inverted because SVG Y is top-down)
  const plToY = (pl: number) => {
    return 50 - (pl / maxAbsPL) * 40; // 50% is center, scale to use 40% above/below
  };

  // Generate SVG path
  const pathD = plPoints
    .map((p, i) => {
      const x = priceToX(p.price);
      const y = plToY(p.pl);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Key price points for markers
  const keyPoints = [
    { price: underlyingPrice, label: 'Current', color: 'text-blue-400' },
    { price: strike, label: 'Strike', color: 'text-yellow-400' },
    { price: breakeven, label: 'Breakeven', color: 'text-gray-400' },
  ];

  if (strike2) {
    keyPoints.push({ price: strike2, label: 'Strike 2', color: 'text-orange-400' });
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Profit/Loss at Expiration</h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500" />
              Profit
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500" />
              Loss
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-48 bg-muted/30 rounded-lg overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {/* Zero line */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="0.5"
            />

            {/* Profit zone fill */}
            <path
              d={`${pathD} L ${priceToX(plPoints[plPoints.length - 1].price)} 50 L ${priceToX(plPoints[0].price)} 50 Z`}
              fill="url(#profitGradient)"
              fillOpacity="0.3"
            />

            {/* P&L line */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Key price vertical lines */}
            {keyPoints.map((point, i) => (
              <line
                key={i}
                x1={priceToX(point.price)}
                y1="0"
                x2={priceToX(point.price)}
                y2="100"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />
            ))}

            {/* Current price marker */}
            <circle
              cx={priceToX(underlyingPrice)}
              cy={plToY(calculatePL(strategyType, underlyingPrice, strike, strike2, credit, maxProfit, maxLoss))}
              r="2"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="0.5"
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
                <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Price labels on X axis */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
            <span>${priceRange.min.toFixed(0)}</span>
            <span>${((priceRange.min + priceRange.max) / 2).toFixed(0)}</span>
            <span>${priceRange.max.toFixed(0)}</span>
          </div>

          {/* P&L labels on Y axis */}
          <div className="absolute top-0 bottom-0 left-1 flex flex-col justify-between py-2 text-xs">
            <span className="text-green-400">+${maxProfit.toFixed(0)}</span>
            <span className="text-muted-foreground">$0</span>
            <span className="text-red-400">-${Math.abs(maxLoss).toFixed(0)}</span>
          </div>
        </div>

        {/* Key points legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <TooltipProvider>
            {keyPoints.map((point, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className={cn("flex items-center gap-1 cursor-help", point.color)}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span>{point.label}: ${point.price.toFixed(2)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{getPointExplanation(point.label, point.price, underlyingPrice, credit)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Plain English Summary */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <PlainEnglishPL
            strategyType={strategyType}
            underlyingPrice={underlyingPrice}
            strike={strike}
            breakeven={breakeven}
            maxProfit={maxProfit}
            maxLoss={maxLoss}
          />
        </div>
      </div>
    </Card>
  );
}

// Calculate P&L at a given stock price
function calculatePL(
  strategyType: string,
  stockPrice: number,
  strike: number,
  strike2: number | undefined,
  credit: number,
  maxProfit: number,
  maxLoss: number,
): number {
  switch (strategyType) {
    case 'cash_secured_put':
      // Profit = credit if stock >= strike
      // Loss = (strike - stockPrice) - credit if stock < strike
      if (stockPrice >= strike) {
        return credit * 100;
      }
      return Math.max(-maxLoss, ((stockPrice - strike) + credit) * 100);

    case 'covered_call':
      // Simplified: assume bought at current underlying
      // This isn't perfect but shows the general shape
      if (stockPrice <= strike) {
        return credit * 100; // Keep premium, stock didn't move much
      }
      return maxProfit; // Capped at strike + premium

    case 'put_credit_spread':
      if (!strike2) return 0;
      // Short put at strike, long put at strike2 (lower)
      if (stockPrice >= strike) {
        return credit * 100; // Full credit
      } else if (stockPrice <= strike2) {
        return -maxLoss; // Full loss
      } else {
        // Between strikes: linear interpolation
        const pctThroughSpread = (strike - stockPrice) / (strike - strike2);
        return (credit * 100) - (pctThroughSpread * (Math.abs(maxLoss) + credit * 100));
      }

    case 'call_credit_spread':
      if (!strike2) return 0;
      // Short call at strike, long call at strike2 (higher)
      if (stockPrice <= strike) {
        return credit * 100; // Full credit
      } else if (stockPrice >= strike2) {
        return -maxLoss; // Full loss
      } else {
        const pctThroughSpread = (stockPrice - strike) / (strike2 - strike);
        return (credit * 100) - (pctThroughSpread * (Math.abs(maxLoss) + credit * 100));
      }

    default:
      return 0;
  }
}

function getPointExplanation(
  label: string,
  price: number,
  currentPrice: number,
  credit: number,
): string {
  switch (label) {
    case 'Current':
      return `${label === 'Current' ? 'This is' : ''} where the stock is trading right now ($${price.toFixed(2)})`;
    case 'Strike':
      return `Your target price. Above this, you keep full premium. Below this, you may need to buy the stock.`;
    case 'Breakeven':
      return `The stock can drop to $${price.toFixed(2)} and you still don't lose money (because you collected $${(credit * 100).toFixed(0)} in premium).`;
    case 'Strike 2':
      return `Your protection level. Limits your maximum loss if things go wrong.`;
    default:
      return '';
  }
}

function PlainEnglishPL({
  strategyType,
  underlyingPrice,
  strike,
  breakeven,
  maxProfit,
  maxLoss,
}: {
  strategyType: string;
  underlyingPrice: number;
  strike: number;
  breakeven: number;
  maxProfit: number;
  maxLoss: number;
}) {
  const dropToStrike = ((underlyingPrice - strike) / underlyingPrice * 100).toFixed(1);
  const dropToBreakeven = ((underlyingPrice - breakeven) / underlyingPrice * 100).toFixed(1);

  const explanations: Record<string, string> = {
    'cash_secured_put': `
      If the stock stays above $${strike.toFixed(2)} (current: $${underlyingPrice.toFixed(2)}), you keep the full $${maxProfit.toFixed(0)} profit.
      The stock would need to drop ${dropToStrike}% before you're assigned.
      Your breakeven is $${breakeven.toFixed(2)} - a ${dropToBreakeven}% drop - where you'd break even.
    `,
    'covered_call': `
      You make money if the stock stays flat or rises to $${strike.toFixed(2)}.
      Above $${strike.toFixed(2)}, your shares get called away (you still profit, just capped).
      Maximum profit is $${maxProfit.toFixed(0)} if stock closes at or above $${strike.toFixed(2)}.
    `,
    'put_credit_spread': `
      You profit $${maxProfit.toFixed(0)} if the stock stays above $${strike.toFixed(2)}.
      You lose money if it drops below $${strike.toFixed(2)}, maxing out at $${Math.abs(maxLoss).toFixed(0)} loss.
      Your risk is defined and limited - no matter how far it falls.
    `,
    'call_credit_spread': `
      You profit $${maxProfit.toFixed(0)} if the stock stays below $${strike.toFixed(2)}.
      You lose money if it rises above $${strike.toFixed(2)}, maxing out at $${Math.abs(maxLoss).toFixed(0)} loss.
      Your risk is defined and limited - no matter how far it rises.
    `,
  };

  return (
    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
      {explanations[strategyType] || `Max profit: $${maxProfit.toFixed(0)} | Max loss: $${Math.abs(maxLoss).toFixed(0)}`}
    </p>
  );
}
