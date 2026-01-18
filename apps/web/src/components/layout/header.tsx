'use client';

import { useState } from 'react';
import { Bell, GraduationCap, Gauge, RefreshCw } from 'lucide-react';
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

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [learningMode, setLearningMode] = useState(true);
  const [experiencedMode, setExperiencedMode] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);

  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      await fetch('/api/recompute', { method: 'POST' });
    } catch (error) {
      console.error('Recompute failed:', error);
    } finally {
      setIsRecomputing(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-card/50 backdrop-blur-sm">
      <div>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Mode Toggles */}
        <TooltipProvider>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <GraduationCap className={cn(
                    'h-4 w-4',
                    learningMode ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <Switch
                    id="learning-mode"
                    checked={learningMode}
                    onCheckedChange={setLearningMode}
                  />
                  <Label htmlFor="learning-mode" className="text-sm cursor-pointer">
                    Learning
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show educational tooltips and explanations</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Gauge className={cn(
                    'h-4 w-4',
                    experiencedMode ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <Switch
                    id="experienced-mode"
                    checked={experiencedMode}
                    onCheckedChange={setExperiencedMode}
                  />
                  <Label htmlFor="experienced-mode" className="text-sm cursor-pointer">
                    Advanced
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show detailed Greeks and raw metrics</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            Paper Mode
          </Badge>
        </div>

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
                    'h-4 w-4 mr-2',
                    isRecomputing && 'animate-spin'
                  )} />
                  Recompute
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate trade candidates with latest data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
