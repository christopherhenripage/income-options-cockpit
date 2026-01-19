'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Trading term explanations in plain English
const termDefinitions: Record<string, string> = {
  // Core option terms
  dte: 'Days to Expiration - How many days until the option contract expires. Shorter DTE = faster time decay.',
  delta: 'Delta - How much the option price changes when the stock moves $1. A delta of -0.25 means you have about a 25% chance of being assigned.',
  iv: 'Implied Volatility - How much the market expects the stock to move. Higher IV = more expensive options = more premium to collect.',
  'iv rank': 'IV Rank - Where current volatility is compared to the past year. 0% = lowest, 100% = highest. Higher is better for selling options.',
  credit: 'Credit - The money you receive upfront when you sell an option. This is your maximum profit.',
  'max loss': 'Maximum Loss - The most money you can lose on this trade. This is your worst-case scenario.',
  breakeven: 'Breakeven - The stock price where you neither make nor lose money at expiration.',
  strike: 'Strike Price - The price at which you can buy (call) or sell (put) the stock if assigned.',
  premium: 'Premium - The price of an option. When selling, this is the credit you receive.',
  theta: 'Theta - How much value the option loses each day. Positive theta means time decay works in your favor.',

  // Strategies
  csp: 'Cash-Secured Put - You sell a put and keep cash ready to buy the stock if assigned. You collect premium while waiting to potentially buy at a lower price.',
  'cash-secured put': 'Cash-Secured Put - You sell a put and keep cash ready to buy the stock if assigned. You collect premium while waiting to potentially buy at a lower price.',
  pcs: 'Put Credit Spread - A bullish strategy where you sell a put and buy a lower-strike put. This limits your max loss but also your max profit.',
  'put credit spread': 'Put Credit Spread - A bullish strategy where you sell a put and buy a lower-strike put. This limits your max loss but also your max profit.',
  ccs: 'Call Credit Spread - A bearish strategy where you sell a call and buy a higher-strike call. Profits when the stock stays flat or goes down.',
  'call credit spread': 'Call Credit Spread - A bearish strategy where you sell a call and buy a higher-strike call. Profits when the stock stays flat or goes down.',
  cc: 'Covered Call - You sell a call on stock you already own. Collect premium income while potentially selling at a higher price.',
  'covered call': 'Covered Call - You sell a call on stock you already own. Collect premium income while potentially selling at a higher price.',

  // Market terms
  trend: 'Trend - The overall direction of the market or stock. Uptrend = prices rising, Downtrend = prices falling.',
  volatility: 'Volatility - How much prices are moving. High volatility = bigger swings, more uncertainty.',
  'risk on': 'Risk On - Market conditions where investors are buying riskier assets. Good for bullish strategies.',
  'risk off': 'Risk Off - Market conditions where investors are seeking safety. Be more cautious with new trades.',
  breadth: 'Market Breadth - How many stocks are participating in a move. Healthy breadth means the rally/decline is broad-based.',

  // Risk terms
  'annualized return': 'Annualized Return - What this trade would earn if repeated for a year. Helps compare trades with different expirations.',
  'return on risk': 'Return on Risk - Your potential profit divided by your potential loss. Higher is better.',
  confidence: 'Confidence - How well this trade matches current market conditions. Higher scores mean better alignment.',
  liquidity: 'Liquidity - How easily you can get in and out of a trade. Higher liquidity = tighter spreads, better fills.',
  'open interest': 'Open Interest - The number of contracts currently held. Higher OI = more liquidity.',
  score: 'Quality Score - A rating from 0-100 based on multiple factors. Higher scores indicate better trade opportunities.',
};

interface JargonTooltipProps {
  term: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function JargonTooltip({
  term,
  children,
  showIcon = true,
  className,
}: JargonTooltipProps) {
  const definition = termDefinitions[term.toLowerCase()];

  if (!definition) {
    return <>{children || term}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50', className)}>
            {children || term}
            {showIcon && <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simple inline tooltip for use in text
export function InfoTooltip({ term, className }: { term: string; className?: string }) {
  const definition = termDefinitions[term.toLowerCase()];

  if (!definition) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <HelpCircle className={cn('inline h-4 w-4 text-muted-foreground cursor-help ml-1', className)} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
