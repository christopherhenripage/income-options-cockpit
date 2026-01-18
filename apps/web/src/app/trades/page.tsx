import { Header } from '@/components/layout/header';
import { TradesList } from '@/components/trades/trades-list';

export default function TradesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Trade Candidates"
        subtitle="AI-generated income options trades ranked by quality"
      />

      <div className="flex-1 p-6 overflow-auto">
        <TradesList />
      </div>
    </div>
  );
}
