'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  BookOpen,
  Eye,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if this is a first-time visitor
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('hasVisited', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Options Cockpit</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Your co-pilot for income-focused options trading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Smart Trade Recommendations</p>
              <p className="text-sm text-muted-foreground">
                We analyze market conditions and surface the best income opportunities.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Paper Trading Built-In</p>
              <p className="text-sm text-muted-foreground">
                Track recommendations without risking real money. Build confidence first.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Learn Mode Enabled</p>
              <p className="text-sm text-muted-foreground">
                Educational content is on by default. Toggle it off in the header when you're ready.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              handleGetStarted();
              window.location.href = '/strategies';
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Learn First
          </Button>
          <Button
            className="flex-1 btn-primary"
            onClick={handleGetStarted}
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
