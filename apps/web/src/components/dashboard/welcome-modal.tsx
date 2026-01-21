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
  Target,
  BookOpen,
  Bell,
  Shield,
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
              <Target className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Position Co-Pilot</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Your personal assistant for managing options positions with discipline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Personal Exit Rules</p>
              <p className="text-sm text-muted-foreground">
                Set your profit targets and stop losses. We'll alert you when it's time to act.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Smart Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when your rules trigger or market conditions change against your positions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Trade Reviews</p>
              <p className="text-sm text-muted-foreground">
                Learn from every trade with AI-powered reviews that help you improve.
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
