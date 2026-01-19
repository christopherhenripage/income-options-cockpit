'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { TopTrades } from '@/components/dashboard/top-trades';
import { LiquidityRadar } from '@/components/dashboard/liquidity-radar';
import { NarrativePreview } from '@/components/dashboard/narrative-preview';
import { RiskSummary } from '@/components/dashboard/risk-summary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

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
