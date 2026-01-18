'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Play,
  FileText,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyFullName,
  getScoreColor,
  getTrendClass,
  getVolatilityClass,
} from '@/lib/utils';

// Mock trade data
const mockTrade = {
  id: '1',
  symbol: 'AAPL',
  strategyType: 'cash_secured_put',
  status: 'candidate',
  score: 78,
  underlyingPrice: 242.85,
  netCredit: 215,
  maxLoss: 2285,
  breakeven: 232.85,
  dte: 32,
  strike: 235,
  expiration: '2024-02-16',
  returnOnRisk: 28.5,
  returnOnCapital: 0.91,
  probabilityOfProfit: 72,
  conviction: { confidence: 72, uncertainty: 18 },
  marketRegime: {
    trend: 'uptrend',
    volatility: 'normal',
    riskOnOff: 'risk_on',
  },
  symbolSignals: {
    trend: 'uptrend',
    trendScore: 45,
    ivRank: 42,
    liquidity: { overallScore: 88 },
  },
  legs: [
    {
      action: 'sell',
      quantity: 1,
      type: 'put',
      strike: 235,
      expiration: '2024-02-16',
      bid: 2.10,
      ask: 2.20,
      delta: -0.22,
      theta: -0.05,
      iv: 24.5,
    },
  ],
  reasons: [
    { category: 'Liquidity', check: 'Option OI', passed: true, value: '5,234', threshold: '>= 500' },
    { category: 'Liquidity', check: 'Bid-Ask Spread', passed: true, value: '4.5%', threshold: '<= 8%' },
    { category: 'Delta', check: 'Delta Target', passed: true, value: '-0.22', threshold: '-0.20 to -0.30' },
    { category: 'Premium', check: 'Annualized Return', passed: true, value: '28.5%', threshold: '>= 15%' },
    { category: 'Trend', check: 'Trend Alignment', passed: true, value: 'Uptrend', threshold: 'Not in downtrend' },
    { category: 'Volatility', check: 'IV Rank', passed: true, value: '42%', threshold: '>= 30%' },
    { category: 'Risk', check: 'Risk Per Trade', passed: true, value: '1.8%', threshold: '<= 3%' },
    { category: 'Buffer', check: 'Buffer to Strike', passed: false, value: '3.2%', threshold: '>= 5%' },
  ],
  scoreComponents: [
    { name: 'Premium Yield', normalizedScore: 85, weight: 0.25, weightedScore: 21 },
    { name: 'Liquidity', normalizedScore: 88, weight: 0.20, weightedScore: 18 },
    { name: 'IV Rank', normalizedScore: 42, weight: 0.15, weightedScore: 6 },
    { name: 'Trend Alignment', normalizedScore: 80, weight: 0.20, weightedScore: 16 },
    { name: 'Buffer Score', normalizedScore: 65, weight: 0.10, weightedScore: 7 },
    { name: 'Probability', normalizedScore: 72, weight: 0.10, weightedScore: 7 },
  ],
  plainEnglishSummary: 'Sell a February 16 $235 put on AAPL for $2.15 credit ($215 per contract). This trade profits if AAPL stays above $232.85 by expiration. Maximum risk is $23,285 if AAPL goes to $0. The position benefits from time decay and requires $23,500 in cash as collateral.',
  learningNotes: [
    { topic: 'Why Cash-Secured Put?', explanation: 'A CSP is ideal when you\'re neutral to bullish on a stock you\'d be willing to own. You collect premium upfront, and if assigned, you effectively buy the stock at a discount.' },
    { topic: 'Delta of -0.22', explanation: 'A delta of -0.22 means there\'s approximately a 22% chance this option expires ITM. Lower delta = more conservative.' },
    { topic: 'Time Decay', explanation: 'This position earns roughly $5 daily as the option loses time value. Theta accelerates as expiration approaches.' },
  ],
  orderTicketInstructions: `## thinkorswim Order Ticket

1. Open Trade Tab → Options Chain
2. Select AAPL → Feb 16 2024 expiration
3. Find $235 PUT strike
4. Right-click → Sell → Single
5. Verify:
   - Action: SELL TO OPEN
   - Qty: 1
   - Price: LIMIT @ $2.15
   - Duration: DAY
6. Review order and confirm

Note: Requires $23,500 cash secured margin`,
  settingsVersion: 'Balanced v1',
  riskProfilePreset: 'balanced',
};

interface TradeDetailProps {
  tradeId: string;
}

export function TradeDetail({ tradeId }: TradeDetailProps) {
  const [priceChange, setPriceChange] = useState([0]);
  const [ivChange, setIvChange] = useState([0]);
  const [daysElapsed, setDaysElapsed] = useState([0]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  // Calculate what-if P/L (simplified model)
  const calculateWhatIfPL = () => {
    const pricePct = priceChange[0] / 100;
    const newPrice = mockTrade.underlyingPrice * (1 + pricePct);
    const daysLeft = Math.max(0, mockTrade.dte - daysElapsed[0]);

    // Simplified P/L calculation
    let pl = 0;
    if (newPrice >= mockTrade.strike) {
      // OTM - option expires worthless
      pl = mockTrade.netCredit;
    } else {
      // ITM - we're assigned
      const intrinsic = (mockTrade.strike - newPrice) * 100;
      pl = mockTrade.netCredit - intrinsic;
    }

    // Add theta decay approximation
    const thetaDecay = (daysElapsed[0] / mockTrade.dte) * mockTrade.netCredit * 0.5;
    if (newPrice >= mockTrade.strike) {
      pl = Math.min(mockTrade.netCredit, mockTrade.netCredit * 0.5 + thetaDecay);
    }

    return pl;
  };

  const whatIfPL = calculateWhatIfPL();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{mockTrade.symbol}</h1>
            <Badge
              variant="outline"
              className={cn('text-sm', getStrategyClass(mockTrade.strategyType))}
            >
              {getStrategyFullName(mockTrade.strategyType)}
            </Badge>
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
              Candidate
            </Badge>
          </div>
          <p className="text-muted-foreground">
            ${mockTrade.strike} Put • Exp: {mockTrade.expiration} • {mockTrade.dte} DTE
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated under {mockTrade.settingsVersion}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            'text-5xl font-bold',
            getScoreColor(mockTrade.score)
          )}>
            {mockTrade.score}
          </div>
          <div className="text-sm text-muted-foreground">
            Quality<br />Score
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Risk Box & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Box */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Max Profit</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(mockTrade.netCredit)}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Max Loss</div>
                  <div className="text-2xl font-bold text-red-400">
                    {formatCurrency(mockTrade.maxLoss)}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Breakeven</div>
                  <div className="text-2xl font-bold">
                    ${mockTrade.breakeven.toFixed(2)}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Ann. Return</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPercent(mockTrade.returnOnRisk)}
                  </div>
                </div>
              </div>

              {/* Conviction Meter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{mockTrade.conviction.confidence}%</span>
                  </div>
                  <Progress value={mockTrade.conviction.confidence} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Uncertainty</span>
                    <span className="font-medium">{mockTrade.conviction.uncertainty}%</span>
                  </div>
                  <Progress
                    value={mockTrade.conviction.uncertainty}
                    className="h-2 [&>div]:bg-yellow-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Details */}
          <Tabs defaultValue="evidence" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="simulator">What-If</TabsTrigger>
              <TabsTrigger value="order">Order Ticket</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>

            {/* Evidence Panel */}
            <TabsContent value="evidence">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pass/Fail Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockTrade.reasons.map((reason, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg',
                          reason.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {reason.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <div className="font-medium">{reason.check}</div>
                            <div className="text-xs text-muted-foreground">
                              {reason.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{reason.value}</div>
                          <div className="text-xs text-muted-foreground">
                            {reason.threshold}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score Breakdown */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="font-medium mb-4">Score Components</h4>
                    <div className="space-y-3">
                      {mockTrade.scoreComponents.map((component, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {component.name} ({Math.round(component.weight * 100)}%)
                            </span>
                            <span className="font-medium">+{component.weightedScore}</span>
                          </div>
                          <Progress
                            value={component.normalizedScore}
                            className="h-1.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* What-If Simulator */}
            <TabsContent value="simulator">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sliders className="h-5 w-5" />
                    What-If Simulator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-400">Approximation Only</p>
                        <p className="text-muted-foreground">
                          This is a simplified model. Actual P/L depends on many factors including
                          exact IV levels, time decay acceleration, and fill prices.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Price Change Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Price Change</label>
                        <span className="text-sm text-muted-foreground">
                          {priceChange[0] > 0 ? '+' : ''}{priceChange[0]}%
                          (${(mockTrade.underlyingPrice * (1 + priceChange[0] / 100)).toFixed(2)})
                        </span>
                      </div>
                      <Slider
                        value={priceChange}
                        onValueChange={setPriceChange}
                        min={-20}
                        max={20}
                        step={1}
                      />
                    </div>

                    {/* Days Elapsed Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Days Elapsed</label>
                        <span className="text-sm text-muted-foreground">
                          {daysElapsed[0]} days ({mockTrade.dte - daysElapsed[0]} remaining)
                        </span>
                      </div>
                      <Slider
                        value={daysElapsed}
                        onValueChange={setDaysElapsed}
                        min={0}
                        max={mockTrade.dte}
                        step={1}
                      />
                    </div>

                    {/* Result */}
                    <div className="glass-panel p-6 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        Estimated P/L
                      </div>
                      <div className={cn(
                        'text-4xl font-bold',
                        whatIfPL >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {whatIfPL >= 0 ? '+' : ''}{formatCurrency(whatIfPL)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {formatPercent((whatIfPL / mockTrade.maxLoss) * 100)} of max risk
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order Ticket */}
            <TabsContent value="order">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Order Ticket Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                    {mockTrade.orderTicketInstructions}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Learning Notes */}
            <TabsContent value="learning">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5" />
                    Learning Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTrade.learningNotes.map((note, i) => (
                      <div
                        key={i}
                        className="glass-panel p-4 rounded-lg learning-highlight"
                      >
                        <h4 className="font-medium text-primary mb-2">
                          {note.topic}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {note.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mockTrade.plainEnglishSummary}
              </p>
            </CardContent>
          </Card>

          {/* Market Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Market Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trend</span>
                <Badge
                  variant="outline"
                  className={cn('capitalize', getTrendClass(mockTrade.marketRegime.trend))}
                >
                  {mockTrade.marketRegime.trend.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Volatility</span>
                <Badge
                  variant="outline"
                  className={cn('capitalize', getVolatilityClass(mockTrade.marketRegime.volatility))}
                >
                  {mockTrade.marketRegime.volatility}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Regime</span>
                <Badge
                  variant="outline"
                  className={mockTrade.marketRegime.riskOnOff === 'risk_on'
                    ? 'text-green-400'
                    : 'text-red-400'}
                >
                  {mockTrade.marketRegime.riskOnOff.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">IV Rank</span>
                <span className="font-medium">{mockTrade.symbolSignals.ivRank}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Liquidity</span>
                <span className="font-medium">{mockTrade.symbolSignals.liquidity.overallScore}/100</span>
              </div>
            </CardContent>
          </Card>

          {/* Option Legs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Option Legs</CardTitle>
            </CardHeader>
            <CardContent>
              {mockTrade.legs.map((leg, i) => (
                <div key={i} className="glass-panel p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={leg.action === 'sell' ? 'destructive' : 'default'}>
                      {leg.action.toUpperCase()}
                    </Badge>
                    <span className="font-medium">
                      {leg.quantity}x ${leg.strike} {leg.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Bid/Ask:</span>{' '}
                      ${leg.bid}/${leg.ask}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delta:</span>{' '}
                      {leg.delta}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Theta:</span>{' '}
                      ${leg.theta}
                    </div>
                    <div>
                      <span className="text-muted-foreground">IV:</span>{' '}
                      {leg.iv}%
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="neon">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Trade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Trade</DialogTitle>
                      <DialogDescription>
                        Review the trade details before approval.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="glass-panel p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{mockTrade.symbol}</span>
                          <Badge className={getStrategyClass(mockTrade.strategyType)}>
                            {getStrategyFullName(mockTrade.strategyType)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Credit: <span className="text-green-400">{formatCurrency(mockTrade.netCredit)}</span></div>
                          <div>Max Loss: <span className="text-red-400">{formatCurrency(mockTrade.maxLoss)}</span></div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-400">Paper Mode Active</p>
                            <p className="text-muted-foreground">
                              This will create a simulated position. No real orders will be placed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setShowApproveDialog(false)}>
                        Confirm Approval
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
