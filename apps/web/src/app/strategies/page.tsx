import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Shield,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const strategies = [
  {
    id: 'cash_secured_put',
    name: 'Cash-Secured Put',
    shortName: 'CSP',
    description: 'Sell a put option while holding enough cash to purchase the stock if assigned.',
    direction: 'bullish',
    riskLevel: 'moderate',
    whenToUse: [
      'Bullish or neutral on a stock you want to own',
      'When IV is elevated for better premiums',
      'In uptrending or range-bound markets',
    ],
    pros: [
      'Collect premium income',
      'Buy stock at a discount if assigned',
      'Benefits from time decay',
      'Lower cost basis if assigned',
    ],
    cons: [
      'Requires significant capital (cash secured)',
      'Losses if stock drops significantly',
      'Opportunity cost if stock rises sharply',
      'Assignment risk if ITM at expiration',
    ],
    maxProfit: 'Premium received',
    maxLoss: '(Strike - Premium) × 100 if stock goes to $0',
    idealIV: 'Medium to High',
    idealDTE: '21-45 days',
    candidateCount: 8,
    className: 'strategy-csp',
  },
  {
    id: 'covered_call',
    name: 'Covered Call',
    shortName: 'CC',
    description: 'Sell a call option against shares you already own to generate income.',
    direction: 'neutral',
    riskLevel: 'low',
    whenToUse: [
      'Own shares and want to generate income',
      'Willing to sell shares at strike price',
      'In sideways or slightly bullish markets',
    ],
    pros: [
      'Generate income on existing holdings',
      'Reduce cost basis over time',
      'Profits even if stock is flat',
      'Known maximum profit and risk',
    ],
    cons: [
      'Caps upside potential',
      'Still exposed to stock decline',
      'May be called away at inopportune time',
      'Requires owning 100 shares',
    ],
    maxProfit: '(Strike - Stock Price + Premium) × 100',
    maxLoss: 'Stock goes to $0 minus premium received',
    idealIV: 'Medium',
    idealDTE: '14-45 days',
    candidateCount: 5,
    className: 'strategy-cc',
  },
  {
    id: 'put_credit_spread',
    name: 'Put Credit Spread',
    shortName: 'PCS',
    description: 'Sell a put and buy a lower strike put for defined risk bullish exposure.',
    direction: 'bullish',
    riskLevel: 'defined',
    whenToUse: [
      'Bullish but want defined risk',
      'When IV is elevated',
      'Limited capital available',
    ],
    pros: [
      'Defined maximum loss',
      'Lower capital requirement than CSP',
      'Benefits from time decay',
      'Can profit in sideways markets',
    ],
    cons: [
      'Limited profit potential',
      'Both legs need management',
      'Wider bid-ask on two legs',
      'Full loss if stock collapses',
    ],
    maxProfit: 'Net premium received',
    maxLoss: '(Spread Width - Premium) × 100',
    idealIV: 'Elevated to High',
    idealDTE: '21-45 days',
    candidateCount: 6,
    className: 'strategy-pcs',
  },
  {
    id: 'call_credit_spread',
    name: 'Call Credit Spread',
    shortName: 'CCS',
    description: 'Sell a call and buy a higher strike call for defined risk bearish exposure.',
    direction: 'bearish',
    riskLevel: 'defined',
    whenToUse: [
      'Bearish or neutral outlook',
      'Expecting resistance at a level',
      'When IV is elevated',
    ],
    pros: [
      'Defined maximum loss',
      'Profit in down and sideways markets',
      'Lower margin than naked calls',
      'Benefits from IV crush',
    ],
    cons: [
      'Limited profit potential',
      'Losses if stock rallies hard',
      'Both legs need management',
      'Assignment risk on short call',
    ],
    maxProfit: 'Net premium received',
    maxLoss: '(Spread Width - Premium) × 100',
    idealIV: 'Elevated to High',
    idealDTE: '21-45 days',
    candidateCount: 4,
    className: 'strategy-ccs',
  },
];

export default function StrategiesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Strategy Explorer"
        subtitle="Learn about income-focused options strategies"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {strategy.name}
                      <Badge variant="outline" className={strategy.className}>
                        {strategy.shortName}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {strategy.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      strategy.direction === 'bullish' ? 'success' :
                      strategy.direction === 'bearish' ? 'danger' :
                      'secondary'
                    }>
                      {strategy.direction === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {strategy.direction === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {strategy.direction}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass-panel p-2 rounded text-center">
                    <div className="text-xs text-muted-foreground">Risk</div>
                    <div className="text-sm font-medium capitalize">{strategy.riskLevel}</div>
                  </div>
                  <div className="glass-panel p-2 rounded text-center">
                    <div className="text-xs text-muted-foreground">Ideal IV</div>
                    <div className="text-sm font-medium">{strategy.idealIV}</div>
                  </div>
                  <div className="glass-panel p-2 rounded text-center">
                    <div className="text-xs text-muted-foreground">DTE</div>
                    <div className="text-sm font-medium">{strategy.idealDTE}</div>
                  </div>
                </div>

                {/* When to Use */}
                <div>
                  <div className="text-sm font-medium mb-2">When to Use</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {strategy.whenToUse.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-green-400 mb-2">Pros</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {strategy.pros.slice(0, 3).map((pro, i) => (
                        <li key={i}>+ {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-400 mb-2">Cons</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {strategy.cons.slice(0, 3).map((con, i) => (
                        <li key={i}>- {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Risk/Reward */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Max Profit: </span>
                      <span className="text-green-400">{strategy.maxProfit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Loss: </span>
                      <span className="text-red-400">{strategy.maxLoss}</span>
                    </div>
                  </div>
                </div>

                {/* View Candidates */}
                <Link
                  href={`/trades?strategy=${strategy.id}`}
                  className="flex items-center justify-between p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {strategy.candidateCount} candidates today
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
