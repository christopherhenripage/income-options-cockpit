'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface NarrativePreviewProps {
  regime?: {
    trend: string;
    volatility: string;
    riskOnOff: string;
    breadth: string;
  };
}

// Generate narrative from regime data
function generateNarrative(regime: NarrativePreviewProps['regime']) {
  if (!regime) {
    return {
      title: 'Loading market conditions...',
      summary: 'Market data is being analyzed. Please wait for the analysis to complete.',
      preferredStrategies: [],
      cautionFlags: [],
    };
  }

  const trendText = regime.trend.replace('_', ' ');
  const isUptrend = regime.trend.includes('uptrend');
  const isDowntrend = regime.trend.includes('downtrend');
  const isHighVol = ['elevated', 'high', 'panic'].includes(regime.volatility);
  const isRiskOn = regime.riskOnOff === 'risk_on';

  let title = '';
  let summary = '';
  let preferredStrategies: string[] = [];
  const cautionFlags: string[] = [];

  // Generate title
  if (isUptrend) {
    title = `${trendText.charAt(0).toUpperCase() + trendText.slice(1)} with ${regime.volatility.charAt(0).toUpperCase() + regime.volatility.slice(1)} Volatility`;
  } else if (isDowntrend) {
    title = `${trendText.charAt(0).toUpperCase() + trendText.slice(1)} - Defensive Posture Recommended`;
  } else {
    title = `Neutral/Ranging Market with ${regime.volatility.charAt(0).toUpperCase() + regime.volatility.slice(1)} Volatility`;
  }

  // Generate summary
  if (isUptrend && !isHighVol) {
    summary = 'Markets are trending higher with controlled volatility. This is an ideal environment for selling puts and collecting premium. Focus on quality names with strong support levels.';
    preferredStrategies = ['cash_secured_put', 'put_credit_spread'];
  } else if (isUptrend && isHighVol) {
    summary = 'Markets are rising but volatility is elevated. Premium is rich, but use smaller position sizes. Consider wider spreads to account for larger price swings.';
    preferredStrategies = ['put_credit_spread', 'cash_secured_put'];
    cautionFlags.push('Elevated volatility - reduce position sizes');
  } else if (isDowntrend) {
    summary = 'Markets are declining. This is typically not an ideal time for new bullish positions. Consider waiting for stabilization or focus on bearish strategies if experienced.';
    preferredStrategies = ['call_credit_spread'];
    cautionFlags.push('Downtrending market - use extreme caution');
    cautionFlags.push('Consider staying in cash until trend reverses');
  } else {
    summary = 'Markets are in a neutral phase without clear direction. Premium tends to be lower in ranging markets. Wait for a clearer trend or use conservative position sizes.';
    preferredStrategies = ['put_credit_spread', 'call_credit_spread'];
    cautionFlags.push('No clear trend - be patient with entries');
  }

  // Add breadth comment if relevant
  if (regime.breadth === 'narrow' || regime.breadth === 'unhealthy') {
    cautionFlags.push('Market breadth is narrow - fewer stocks participating');
  }

  return { title, summary, preferredStrategies, cautionFlags };
}

export function NarrativePreview({ regime }: NarrativePreviewProps) {
  const narrative = generateNarrative(regime);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Market Brief
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {formatDate(new Date().toISOString())}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-3 neon-text">
          {narrative.title}
        </h3>

        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {narrative.summary}
        </p>

        <div className="space-y-4">
          {/* Preferred Strategies */}
          {narrative.preferredStrategies.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Preferred Strategies Today
              </div>
              <div className="flex flex-wrap gap-2">
                {narrative.preferredStrategies.map((strategy) => (
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
          )}

          {/* Caution Flags */}
          {narrative.cautionFlags.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Caution</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {narrative.cautionFlags.map((flag, i) => (
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
