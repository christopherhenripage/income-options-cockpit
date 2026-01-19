'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running with placeholder Supabase config
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isDemo = !url || url.includes('placeholder') || url === 'http://localhost:54321';
    setIsVisible(isDemo && !isDismissed);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Demo Mode - Using mock data. Connect Supabase for full functionality.
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-yellow-500 hover:text-yellow-400 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
