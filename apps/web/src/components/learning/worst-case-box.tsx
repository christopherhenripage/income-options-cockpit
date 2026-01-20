'use client';

import { AlertTriangle, Shield, TrendingDown, DollarSign, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WorstCaseBoxProps {
  strategyType: string;
  maxLoss: number;
  strike?: number;
  underlyingPrice?: number;
  credit?: number;
  dte?: number;
  symbol?: string;
  className?: string;
}

export function WorstCaseBox({
  strategyType,
  maxLoss,
  strike,
  underlyingPrice,
  credit,
  dte,
  symbol = 'the stock',
  className,
}: WorstCaseBoxProps) {
  const scenario = getWorstCaseScenario(strategyType, maxLoss, strike, underlyingPrice, credit, symbol);

  return (
    <Card className={cn(
      "p-4 border-amber-500/30 bg-amber-500/5",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              What&apos;s the Worst That Can Happen?
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Every trade has risk. This shows you the absolute worst-case scenario so you can decide if it&apos;s acceptable.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
          </div>

          {/* Maximum Loss */}
          <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
            <DollarSign className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">
                Maximum you could lose: ${Math.abs(maxLoss).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                This is the absolute worst case - it doesn&apos;t usually happen
              </p>
            </div>
          </div>

          {/* When This Happens */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              When this happens:
            </p>
            <p className="text-sm text-foreground/90 pl-5">
              {scenario.whenItHappens}
            </p>
          </div>

          {/* Plain English Scenario */}
          <div className="text-sm text-foreground/80 bg-muted/50 rounded-lg p-3">
            {scenario.plainEnglish}
          </div>

          {/* Likelihood */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-400" />
            <p className="text-sm text-green-400">
              {scenario.likelihood}
            </p>
          </div>

          {/* What You Can Do */}
          {scenario.mitigation && (
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                If things go wrong, you can:
              </p>
              <p className="text-sm text-foreground/80">{scenario.mitigation}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function getWorstCaseScenario(
  strategyType: string,
  maxLoss: number,
  strike?: number,
  underlyingPrice?: number,
  credit?: number,
  symbol?: string,
) {
  const scenarios: Record<string, {
    whenItHappens: string;
    plainEnglish: string;
    likelihood: string;
    mitigation: string;
  }> = {
    'cash_secured_put': {
      whenItHappens: strike
        ? `${symbol} drops to $0 and you're forced to buy at $${strike}`
        : `The stock drops to $0 and you're forced to buy at your strike price`,
      plainEnglish: strike && underlyingPrice
        ? `Imagine ${symbol} (currently $${underlyingPrice.toFixed(2)}) suddenly becomes worthless - like the company goes bankrupt. You'd have to buy 100 shares at $${strike} each, losing $${(strike * 100).toLocaleString()}${credit ? ` minus the $${(credit * 100).toFixed(0)} premium you kept` : ''}.`
        : `The stock becomes completely worthless, and you have to buy it anyway at your promised price. This almost never happens with quality companies.`,
      likelihood: 'Extremely unlikely for established companies. More realistic worst case: stock drops 20-30% and you buy at a loss.',
      mitigation: 'Roll the position to a later date and lower strike to collect more premium and give the stock time to recover. Or accept assignment and hold the shares.',
    },
    'covered_call': {
      whenItHappens: `${symbol} rockets up and you miss gains above your strike price`,
      plainEnglish: strike && underlyingPrice
        ? `If ${symbol} jumps from $${underlyingPrice.toFixed(2)} to say $${(strike * 1.5).toFixed(2)}, you'd have to sell your shares at $${strike} and miss out on $${((strike * 0.5) * 100).toFixed(0)} of gains per 100 shares.`
        : `The stock has a huge rally, but you've already agreed to sell at your strike price. You still profit, just less than if you hadn't sold the call.`,
      likelihood: 'This isn\'t really a "loss" - you still make money. You just miss extra upside. Happens maybe 20-30% of the time.',
      mitigation: 'Buy back the call (at a loss) to keep your shares, or let them be called away and use the proceeds to buy a different stock.',
    },
    'put_credit_spread': {
      whenItHappens: `${symbol} drops below both strike prices by expiration`,
      plainEnglish: `Both options end up "in the money" and you lose the full width of your spread minus the premium you collected. Your loss is capped at $${Math.abs(maxLoss).toLocaleString()} no matter how far the stock falls.`,
      likelihood: 'Happens when you\'re wrong about direction. With good strike selection (delta < 0.30), this occurs roughly 20-30% of the time.',
      mitigation: 'Close the spread early if the stock is moving against you to limit losses. Or roll to a later expiration for more time.',
    },
    'call_credit_spread': {
      whenItHappens: `${symbol} rallies above both strike prices by expiration`,
      plainEnglish: `Both options end up "in the money" and you lose the full width of your spread minus the premium you collected. Your loss is capped at $${Math.abs(maxLoss).toLocaleString()} no matter how high the stock goes.`,
      likelihood: 'Happens when the stock rallies more than expected. With good strike selection, occurs roughly 20-30% of the time.',
      mitigation: 'Close the spread early if the stock is rallying hard. Sometimes it\'s better to take a small loss than wait for max loss.',
    },
  };

  return scenarios[strategyType] || {
    whenItHappens: 'The trade moves completely against you',
    plainEnglish: `You could lose up to $${Math.abs(maxLoss).toLocaleString()} if everything goes wrong. This is the maximum possible loss.`,
    likelihood: 'Varies based on market conditions and strike selection.',
    mitigation: 'Close the position early if it\'s moving against you to limit losses.',
  };
}

// Compact version for trade cards
export function WorstCaseCompact({
  maxLoss,
  probability,
}: {
  maxLoss: number;
  probability?: number;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-amber-400 cursor-help">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-sm">Max risk: ${Math.abs(maxLoss).toLocaleString()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-1">Worst Case Scenario</p>
          <p className="text-sm text-muted-foreground">
            The most you could lose is ${Math.abs(maxLoss).toLocaleString()}.
            {probability && ` This happens roughly ${((1 - probability) * 100).toFixed(0)}% of the time.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
