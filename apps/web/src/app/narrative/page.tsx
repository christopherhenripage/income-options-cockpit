import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { cn, formatDate, getTrendClass, getVolatilityClass } from '@/lib/utils';

// Mock narrative data
const mockNarrative = {
  date: '2024-01-15',
  title: 'Uptrend with Normal Volatility - Risk-On Environment',
  regime: {
    trend: 'uptrend',
    volatility: 'normal',
    riskOnOff: 'risk_on',
    breadth: { assessment: 'healthy', percentAbove50MA: 62 },
  },
  summary: 'Markets are trending higher with SPY trading above key moving averages. Volatility remains contained, suggesting orderly market conditions. Market breadth is healthy with broad participation across the universe.',
  trendAnalysis: 'SPY is in a confirmed uptrend, with price above the 50-day moving average. The trend structure remains constructive, though momentum may be moderating from recent highs. This is a supportive environment for income strategies, particularly cash-secured puts on pullbacks to support levels.',
  volatilityAnalysis: 'Volatility is in a normal range, providing balanced risk/reward for option sellers. This is often the ideal environment for consistent income generation. Standard position sizing and DTE ranges are appropriate.',
  breadthAnalysis: 'Market breadth is healthy, indicating solid but not exceptional participation. 62% of symbols are above their 50-day MA. Continue with normal income strategies but remain selective on individual positions.',
  leadershipAnalysis: 'Sector Analysis: Leading sectors include Technology, Consumer Discretionary, and Communication Services. Lagging sectors include Energy and Utilities. The leadership pattern suggests a constructive market environment. Focus income strategies on leading sectors for higher probability setups.',
  strategyImplications: 'The uptrend favors CASH-SECURED PUTS on quality names, collecting premium while potentially acquiring shares at a discount. Standard position sizing and DTE ranges are appropriate.',
  preferredStrategies: ['cash_secured_put', 'put_credit_spread'],
  cautionFlags: ['Watch for earnings announcements in tech sector this week'],
};

const previousNarratives = [
  { date: '2024-01-12', title: 'Consolidation with Rising Volatility', trend: 'neutral', vol: 'elevated' },
  { date: '2024-01-11', title: 'Uptrend Continues with Low Vol', trend: 'uptrend', vol: 'low' },
  { date: '2024-01-10', title: 'Strong Rally - Risk On', trend: 'strong_uptrend', vol: 'normal' },
];

const mockComments = [
  { author: 'You', text: 'Good setup for CSPs this week', date: '2024-01-15 09:30' },
  { author: 'Father-in-law', text: 'Agree, watching AAPL for entry', date: '2024-01-15 10:15' },
];

export default function NarrativePage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Market Brief"
        subtitle="Daily regime analysis and strategy implications"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Narrative */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-primary" />
                      {mockNarrative.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(mockNarrative.date)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={cn('capitalize', getTrendClass(mockNarrative.regime.trend))}
                    >
                      {mockNarrative.regime.trend.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('capitalize', getVolatilityClass(mockNarrative.regime.volatility))}
                    >
                      {mockNarrative.regime.volatility} vol
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">
                    {mockNarrative.summary}
                  </p>
                </div>

                {/* Regime Boxes */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="glass-panel p-3 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Trend</div>
                    <div className={cn(
                      'text-sm font-semibold capitalize',
                      getTrendClass(mockNarrative.regime.trend)
                    )}>
                      {mockNarrative.regime.trend.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="glass-panel p-3 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Volatility</div>
                    <div className={cn(
                      'text-sm font-semibold capitalize',
                      getVolatilityClass(mockNarrative.regime.volatility)
                    )}>
                      {mockNarrative.regime.volatility}
                    </div>
                  </div>
                  <div className="glass-panel p-3 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Risk</div>
                    <div className={cn(
                      'text-sm font-semibold capitalize',
                      mockNarrative.regime.riskOnOff === 'risk_on' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {mockNarrative.regime.riskOnOff.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="glass-panel p-3 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Breadth</div>
                    <div className="text-sm font-semibold capitalize text-blue-400">
                      {mockNarrative.regime.breadth.assessment}
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Trend Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mockNarrative.trendAnalysis}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Volatility Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mockNarrative.volatilityAnalysis}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Breadth & Leadership
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mockNarrative.breadthAnalysis}
                    </p>
                    {mockNarrative.leadershipAnalysis && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        {mockNarrative.leadershipAnalysis}
                      </p>
                    )}
                  </div>
                </div>

                {/* Strategy Implications */}
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">
                    Strategy Implications
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {mockNarrative.strategyImplications}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockNarrative.preferredStrategies.map((strategy) => (
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

                {/* Caution Flags */}
                {mockNarrative.cautionFlags.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-400 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Caution
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {mockNarrative.cautionFlags.map((flag, i) => (
                        <li key={i}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockComments.map((comment, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                        {comment.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-border">
                    <Button variant="outline" className="w-full">
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Previous Briefs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Previous Briefs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousNarratives.map((narrative) => (
                    <div
                      key={narrative.date}
                      className="glass-panel p-3 rounded-lg cursor-pointer card-hover"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{narrative.date}</span>
                        <div className="flex gap-1">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getTrendClass(narrative.trend))}
                          >
                            {narrative.trend.charAt(0).toUpperCase()}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getVolatilityClass(narrative.vol))}
                          >
                            {narrative.vol.charAt(0).toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {narrative.title}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">% Above 50MA</span>
                  <span className="font-medium">
                    {mockNarrative.regime.breadth.percentAbove50MA}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">VIX Level</span>
                  <span className="font-medium">16.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">SPY Trend Score</span>
                  <span className="font-medium text-green-400">+45</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
