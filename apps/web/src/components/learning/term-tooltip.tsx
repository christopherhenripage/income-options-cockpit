'use client';

import { ReactNode, useState } from 'react';
import { HelpCircle, BookOpen, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getTerm, GlossaryTerm } from '@/lib/glossary';
import { cn } from '@/lib/utils';

interface TermTooltipProps {
  term: string; // The glossary key
  children?: ReactNode; // Optional custom display text
  showIcon?: boolean; // Show help icon
  className?: string;
}

export function TermTooltip({ term, children, showIcon = false, className }: TermTooltipProps) {
  const [showExtended, setShowExtended] = useState(false);
  const glossaryEntry = getTerm(term);

  if (!glossaryEntry) {
    return <span className={className}>{children || term}</span>;
  }

  const displayText = children || glossaryEntry.term;

  return (
    <Popover open={showExtended} onOpenChange={setShowExtended}>
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <span
                className={cn(
                  "cursor-help border-b border-dashed border-primary/40 hover:border-primary transition-colors",
                  className
                )}
              >
                {displayText}
                {showIcon && (
                  <HelpCircle className="inline-block ml-1 h-3 w-3 text-muted-foreground" />
                )}
              </span>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-sm bg-card border-border"
            onClick={() => setShowExtended(true)}
          >
            <p className="text-sm">{glossaryEntry.short}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Click for more <ChevronRight className="h-3 w-3 ml-1" />
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-96 bg-card border-border" side="top">
        <TermExplainer term={glossaryEntry} />
      </PopoverContent>
    </Popover>
  );
}

// Full term explanation component
function TermExplainer({ term }: { term: GlossaryTerm }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-foreground">{term.term}</h4>
          <p className="text-sm text-muted-foreground">{term.short}</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <p className="text-foreground/90">{term.extended}</p>
      </div>

      {term.example && (
        <div className="border-l-2 border-primary/50 pl-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Example</p>
          <p className="text-sm text-foreground/80">{term.example}</p>
        </div>
      )}

      {term.relatedTerms && term.relatedTerms.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Related:</p>
          <div className="flex flex-wrap gap-1">
            {term.relatedTerms.map((related) => (
              <span
                key={related}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
              >
                {getTerm(related)?.term || related}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simpler inline tooltip without popover
export function QuickTip({ term, children, className }: TermTooltipProps) {
  const glossaryEntry = getTerm(term);

  if (!glossaryEntry) {
    return <span className={className}>{children || term}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "cursor-help border-b border-dotted border-muted-foreground/50 hover:border-primary transition-colors",
              className
            )}
          >
            {children || glossaryEntry.term}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{glossaryEntry.short}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Format numbers with plain English context
export function ExplainedNumber({
  value,
  type,
  className
}: {
  value: number | null;
  type: 'delta' | 'theta' | 'gamma' | 'vega' | 'iv' | 'dte' | 'credit' | 'maxLoss' | 'pop';
  className?: string;
}) {
  if (value === null || value === undefined) {
    return <span className={className}>--</span>;
  }

  const explanations: Record<string, (v: number) => string> = {
    delta: (v) => {
      const absV = Math.abs(v);
      const pct = Math.round(absV * 100);
      if (absV < 0.15) return `Very safe - about ${100 - pct}% chance of keeping full premium`;
      if (absV < 0.25) return `Conservative - about ${100 - pct}% chance of keeping full premium`;
      if (absV < 0.35) return `Moderate - about ${100 - pct}% chance of keeping full premium`;
      return `Aggressive - only ${100 - pct}% chance of keeping full premium`;
    },
    theta: (v) => {
      const daily = Math.abs(v) * 100;
      return `You earn about $${daily.toFixed(0)} per day from time decay`;
    },
    iv: (v) => {
      const pct = Math.round(v * 100);
      if (pct < 20) return `Low volatility (${pct}%) - smaller premiums but less risk`;
      if (pct < 35) return `Normal volatility (${pct}%) - typical option prices`;
      if (pct < 50) return `Elevated volatility (${pct}%) - bigger premiums, more risk`;
      return `High volatility (${pct}%) - large premiums but stock is moving a lot`;
    },
    dte: (v) => {
      if (v <= 7) return `Expires this week - fast time decay but risky`;
      if (v <= 21) return `${v} days - accelerating time decay`;
      if (v <= 45) return `${v} days - sweet spot for premium sellers`;
      return `${v} days - lots of time, slower decay`;
    },
    credit: (v) => {
      return `You receive $${v.toFixed(2)} upfront - this is yours to keep if the trade works`;
    },
    maxLoss: (v) => {
      return `Worst case: you could lose $${Math.abs(v).toFixed(2)} if everything goes wrong`;
    },
    pop: (v) => {
      const pct = Math.round(v * 100);
      if (pct >= 80) return `High probability (${pct}%) - wins most of the time`;
      if (pct >= 65) return `Good probability (${pct}%) - solid odds in your favor`;
      return `Moderate probability (${pct}%) - less reliable`;
    },
    gamma: (v) => `Option price sensitivity accelerates at ${v.toFixed(4)} per $1 move`,
    vega: (v) => `Option price changes $${Math.abs(v).toFixed(2)} for every 1% change in volatility`,
  };

  const explanation = explanations[type]?.(value);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className={cn("cursor-help", className)}>
            {formatValue(value, type)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatValue(value: number, type: string): string {
  switch (type) {
    case 'delta':
    case 'gamma':
      return value.toFixed(2);
    case 'theta':
    case 'vega':
      return value.toFixed(2);
    case 'iv':
      return `${(value * 100).toFixed(1)}%`;
    case 'dte':
      return `${value}d`;
    case 'credit':
    case 'maxLoss':
      return `$${Math.abs(value).toFixed(2)}`;
    case 'pop':
      return `${(value * 100).toFixed(0)}%`;
    default:
      return value.toString();
  }
}
