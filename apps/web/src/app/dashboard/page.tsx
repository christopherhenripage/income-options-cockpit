'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { TopPick } from '@/components/dashboard/top-pick';
import { TopTrades } from '@/components/dashboard/top-trades';
import { LiquidityRadar } from '@/components/dashboard/liquidity-radar';
import { NarrativePreview } from '@/components/dashboard/narrative-preview';
import { RiskSummary } from '@/components/dashboard/risk-summary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle, X, Compass } from 'lucide-react';

interface RecomputeResult {
  success: boolean;
  runId: string;
  stats: {
    symbolsAnalyzed: number;
    candidatesGenerated: number;
  };
  regime: {
    trend: string;
    volatility: string;
    riskOnOff: string;
    breadth: string;
  };
  candidateCount: number;
  candidates: Array<{
    id: string;
    symbol: string;
    strategyType: string;
    score: number;
    netCredit: number;
    maxLoss: number;
    dte: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<RecomputeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recompute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Income Options Cockpit - Live Market Overview"
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading market data...</span>
              </div>
            ) : data ? (
              <div className="flex items-center gap-2 text-green-400">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span>Live data • {data.candidateCount} trade opportunities found</span>
              </div>
            ) : null}
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Welcome Card - First Visit */}
        {showWelcome && (
          <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <CardContent className="pt-6 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowWelcome(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Compass className="h-6 w-6 text-purple-400" />
                </div>
                <div className="pr-8">
                  <h3 className="font-semibold text-lg mb-2">Welcome to Options Cockpit</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong className="text-foreground">Market Overview</strong> shows current conditions —
                      trend direction, volatility level, and whether it's a risk-on or risk-off environment.
                    </p>
                    <p>
                      <strong className="text-foreground">Top Trade Candidates</strong> are scored opportunities
                      based on today's regime. Higher scores mean better alignment with current conditions.
                      Each card shows the premium you'd collect and your maximum risk.
                    </p>
                    <p>
                      <strong className="text-foreground">Everything is paper trading</strong> — real market data,
                      simulated positions. Explore freely.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => setShowWelcome(false)}
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-500">Unable to load live data</h3>
                  <p className="text-sm text-muted-foreground">
                    {error}. Showing cached data instead.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Top Pick - Featured Recommendation */}
        <TopPick
          candidate={data?.candidates?.[0]}
          regime={data?.regime}
          loading={loading}
        />

        {/* Top Row - Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MarketOverview regime={data?.regime} loading={loading} />
          </div>
          <div>
            <RiskSummary />
          </div>
        </div>

        {/* Middle Row - Narrative and Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NarrativePreview regime={data?.regime} />
          <LiquidityRadar />
        </div>

        {/* Bottom Row - Top Trades */}
        <TopTrades candidates={data?.candidates} loading={loading} />
      </div>
    </div>
  );
}
