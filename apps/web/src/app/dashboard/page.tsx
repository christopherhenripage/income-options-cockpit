'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { TopPick } from '@/components/dashboard/top-pick';
import { TradeGrid } from '@/components/dashboard/trade-grid';
import { PaperTradingWidget } from '@/components/dashboard/paper-trading-widget';
import { Loader2, AlertTriangle } from 'lucide-react';
import { usePaperTrading } from '@/contexts/paper-trading-context';

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

  const { addTrade, trackedIds } = usePaperTrading();

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

  const handlePaperTrade = (trade: TradeCandidate) => {
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
        title="Options Cockpit"
        regime={data?.regime}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Status bar - minimal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : data ? (
              <div className="live-indicator">
                <span className="text-muted-foreground">
                  {data.candidateCount} opportunities found
                </span>
              </div>
            ) : null}
          </div>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-loss/10 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-loss flex-shrink-0" />
              <div>
                <p className="font-medium text-loss">Unable to load data</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Clean layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-3 space-y-6">
            <TopPick
              candidate={data?.candidates?.[0]}
              regime={data?.regime}
              loading={loading}
              onPaperTrade={handlePaperTrade}
              isTracked={data?.candidates?.[0] ? trackedIds.has(data.candidates[0].id) : false}
            />

            <TradeGrid
              candidates={data?.candidates || []}
              loading={loading}
              trackedIds={trackedIds}
              onPaperTrade={handlePaperTrade}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <PaperTradingWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
