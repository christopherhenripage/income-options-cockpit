import { Header } from '@/components/layout/header';
import { TradeDetail } from '@/components/trades/trade-detail';

interface TradeDetailPageProps {
  params: { id: string };
}

export default function TradeDetailPage({ params }: TradeDetailPageProps) {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Trade Detail"
        subtitle="Review trade analysis and execute"
      />

      <div className="flex-1 p-6 overflow-auto">
        <TradeDetail tradeId={params.id} />
      </div>
    </div>
  );
}
