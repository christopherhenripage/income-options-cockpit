'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { TopPick } from '@/components/dashboard/top-pick';
import { TradeGrid } from '@/components/dashboard/trade-grid';
import { PaperTradingWidget } from '@/components/dashboard/paper-trading-widget';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Compass, X } from 'lucide-react';
import { usePaperTrading } from '@/contexts/paper-trading-context';
import { useExplainMode } from '@/contexts/learning-context';

interface OptionLeg {
  action: 'buy' | 'sell';
  quantity: number;
  strike: number;
  type: 'call' | 'put';
  expiration: string;
  symbol: string;
}

interface TradeCandidate {
  id: string;
  symbol: string;
  strategyType: string;
  score: number;
  netCredit: number;
  maxLoss: number;
  dte: number;
  underlyingPrice?: number;
  legs?: OptionLeg[];
}

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
  candidates: TradeCandidate[];
}

export default function DashboardPage() {
  const [data, setData] = useState<RecomputeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const { addTrade, trackedIds } = usePaperTrading();
  const explainMode = useExplainMode();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Check localStorage for welcome dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeDismissed');
    if (dismissed) setShowWelcome(false);
  }, []);

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('welcomeDismissed', 'true');
  };

  const handlePaperTrade = (trade: TradeCandidate) => {
    // Calculate expiration date from DTE
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + trade.dte);

    addTrade({
      tradeId: trade.id,
      symbol: trade.symbol,
      strategyType: trade.strategyType,
      entryCredit: trade.netCredit,
      maxLoss: trade.maxLoss,
      strike: trade.legs?.[0]?.strike,
      dte: trade.dte,
      expirationDate: expirationDate.toISOString(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        regime={data?.regime}
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
                <span>Live data • {data.candidateCount} opportunities</span>
              </div>
            ) : null}
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Welcome Card - First Visit (only when explain mode is on) */}
        {showWelcome && explainMode && (
          <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <CardContent className="pt-6 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleDismissWelcome}
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
                      <strong className="text-foreground">Top Pick</strong> is the highest-scored
                      opportunity based on current market conditions.
                    </p>
                    <p>
                      <strong className="text-foreground">Click any trade card</strong> to see
                      full details, order instructions, and educational content.
                    </p>
                    <p>
                      <strong className="text-foreground">Paper trade</strong> to track how
                      recommendations perform without risking real money.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={handleDismissWelcome}
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
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Column - Hero + Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Today's Top Pick - Hero */}
            <TopPick
              candidate={data?.candidates?.[0]}
              regime={data?.regime}
              loading={loading}
            />

            {/* Trade Grid - 5 more opportunities */}
            <TradeGrid
              candidates={data?.candidates || []}
              loading={loading}
              trackedIds={trackedIds}
              onPaperTrade={handlePaperTrade}
            />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-4">
            <PaperTradingWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
