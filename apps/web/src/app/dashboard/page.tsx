import { Header } from '@/components/layout/header';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { TopTrades } from '@/components/dashboard/top-trades';
import { LiquidityRadar } from '@/components/dashboard/liquidity-radar';
import { NarrativePreview } from '@/components/dashboard/narrative-preview';
import { RiskSummary } from '@/components/dashboard/risk-summary';

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Income Options Cockpit - Market Overview"
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Top Row - Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MarketOverview />
          </div>
          <div>
            <RiskSummary />
          </div>
        </div>

        {/* Middle Row - Narrative and Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NarrativePreview />
          <LiquidityRadar />
        </div>

        {/* Bottom Row - Top Trades */}
        <TopTrades />
      </div>
    </div>
  );
}
