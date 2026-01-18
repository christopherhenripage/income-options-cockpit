'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Mock narrative data
const mockNarrative = {
  date: new Date().toISOString(),
  title: 'Uptrend with Normal Volatility - Risk-On Environment',
  summary: 'Markets are trending higher with SPY trading above key moving averages. Volatility remains contained, suggesting orderly market conditions. Market breadth is healthy with broad participation across the universe.',
  preferredStrategies: ['cash_secured_put', 'put_credit_spread'],
  cautionFlags: [
    'Watch for earnings announcements in tech sector',
  ],
};

export function NarrativePreview() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Market Brief
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {formatDate(mockNarrative.date)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-3 neon-text">
          {mockNarrative.title}
        </h3>

        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {mockNarrative.summary}
        </p>

        <div className="space-y-4">
          {/* Preferred Strategies */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Preferred Strategies Today
            </div>
            <div className="flex flex-wrap gap-2">
              {mockNarrative.preferredStrategies.map((strategy) => (
                <Badge
                  key={strategy}
                  variant="outline"
                  className="border-primary/50 text-primary"
                >
                  {strategy === 'cash_secured_put' ? 'Cash-Secured Put' :
                   strategy === 'put_credit_spread' ? 'Put Credit Spread' :
                   strategy === 'call_credit_spread' ? 'Call Credit Spread' :
                   strategy === 'covered_call' ? 'Covered Call' : strategy}
                </Badge>
              ))}
            </div>
          </div>

          {/* Caution Flags */}
          {mockNarrative.cautionFlags.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Caution</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {mockNarrative.cautionFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Link href="/narrative">
            <Button variant="ghost" size="sm" className="w-full">
              Read Full Analysis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
