'use client';

import { useState } from 'react';
import { Bell, GraduationCap, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
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
  if (trend.includes('uptrend')) return <TrendingUp className="h-3 w-3 text-green-400" />;
  if (trend.includes('downtrend')) return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Activity className="h-3 w-3 text-yellow-400" />;
}

function getTrendColor(trend: string) {
  if (trend.includes('uptrend')) return 'text-green-400';
  if (trend.includes('downtrend')) return 'text-red-400';
  return 'text-yellow-400';
}

function getVolColor(vol: string) {
  if (['elevated', 'high', 'panic'].includes(vol)) return 'text-orange-400';
  if (['low', 'compressed'].includes(vol)) return 'text-blue-400';
  return 'text-muted-foreground';
}

export function Header({ title, subtitle, regime }: HeaderProps) {
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
    <header className="flex h-14 items-center justify-between border-b border-border px-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        {title && <h1 className="text-lg font-semibold">{title}</h1>}

        {/* Compact Market Regime Bar */}
        {regime && (
          <div className="hidden md:flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              {getTrendIcon(regime.trend)}
              <span className={cn("font-medium", getTrendColor(regime.trend))}>
                {regime.trend.replace('_', ' ')}
              </span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className={cn("font-medium", getVolColor(regime.volatility))}>
              {regime.volatility} vol
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {regime.riskOnOff.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Explain Mode Toggle - Connected to Context */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <GraduationCap className={cn(
                  'h-4 w-4 transition-colors',
                  explainMode ? 'text-primary' : 'text-muted-foreground'
                )} />
                <Switch
                  id="explain-mode"
                  checked={explainMode}
                  onCheckedChange={setExplainMode}
                />
                <Label htmlFor="explain-mode" className="text-sm cursor-pointer hidden sm:inline">
                  Explain
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{explainMode ? 'Hide' : 'Show'} educational explanations and tooltips</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Status Badge */}
        <Badge variant="outline" className="border-green-500/50 text-green-400 hidden sm:flex">
          Paper Mode
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecompute}
                  disabled={isRecomputing}
                >
                  <RefreshCw className={cn(
                    'h-4 w-4',
                    isRecomputing && 'animate-spin'
                  )} />
                  <span className="hidden sm:inline ml-2">Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate trade candidates with latest data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
