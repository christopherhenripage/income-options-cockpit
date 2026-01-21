'use client';

import { useState } from 'react';
import { GraduationCap, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLearning } from '@/contexts/learning-context';

interface RegimeData {
  trend: string;
  volatility: string;
  riskOnOff: string;
  breadth: string;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  regime?: RegimeData;
}

function getTrendIcon(trend: string) {
  if (trend.includes('uptrend')) return <TrendingUp className="h-3.5 w-3.5" />;
  if (trend.includes('downtrend')) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

function getTrendClass(trend: string) {
  if (trend.includes('uptrend')) return 'text-profit';
  if (trend.includes('downtrend')) return 'text-loss';
  return 'text-muted-foreground';
}

export function Header({ title, regime }: HeaderProps) {
  const { explainMode, setExplainMode } = useLearning();
  const [isRecomputing, setIsRecomputing] = useState(false);

  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      await fetch('/api/recompute', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Recompute failed:', error);
    } finally {
      setIsRecomputing(false);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        {/* Logo / Title with subtle personality */}
        <h1 className="logo-text text-lg font-semibold tracking-tight">
          {title || 'Options Cockpit'}
        </h1>

        {/* Market Regime - Clean badges */}
        {regime && (
          <div className="hidden md:flex items-center gap-2">
            <div className={cn(
              'regime-badge',
              getTrendClass(regime.trend)
            )}>
              {getTrendIcon(regime.trend)}
              <span className="capitalize">{regime.trend.replace('_', ' ')}</span>
            </div>
            <div className="regime-badge">
              {regime.volatility} vol
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Explain Mode Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setExplainMode(!explainMode)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                  explainMode
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Learn</span>
                <Switch
                  checked={explainMode}
                  onCheckedChange={setExplainMode}
                  className="scale-75"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{explainMode ? 'Hide' : 'Show'} educational content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-5 w-px bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRecompute}
                  disabled={isRecomputing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn(
                    'h-4 w-4',
                    isRecomputing && 'animate-spin'
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Refresh market data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
