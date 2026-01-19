'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  Clock,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  Activity,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
  getScoreColor,
} from '@/lib/utils';

interface TradeCandidate {
  id: string;
  symbol: string;
  strategyType: string;
  score: number;
  netCredit: number;
  maxLoss: number;
  dte: number;
}

interface Regime {
  trend: string;
  volatility: string;
  riskOnOff: string;
  breadth: string;
}

interface TopPickProps {
  candidate?: TradeCandidate;
  regime?: Regime;
  loading?: boolean;
}

// Generate rationale based on the trade and market regime
function generateRationale(candidate: TradeCandidate, regime: Regime): {
  headline: string;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  const reasons: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  const isUptrend = regime.trend.includes('uptrend');
  const isDowntrend = regime.trend.includes('downtrend');
  const isHighVol = ['elevated', 'high', 'panic'].includes(regime.volatility);
  const isLowVol = ['low', 'compressed'].includes(regime.volatility);
  const isRiskOn = regime.riskOnOff === 'risk_on';
  const isBullishStrategy = ['cash_secured_put', 'put_credit_spread'].includes(candidate.strategyType);
  const isBearishStrategy = ['call_credit_spread', 'covered_call'].includes(candidate.strategyType);

  // Calculate return metrics
  const returnPct = (candidate.netCredit / candidate.maxLoss) * 100;
  const annualized = (returnPct / candidate.dte) * 365;

  // Headline based on score
  let headline = '';
  if (candidate.score >= 75) {
    headline = 'Strong alignment with current market conditions';
    confidence = 'high';
  } else if (candidate.score >= 60) {
    headline = 'Good opportunity in the current environment';
    confidence = 'medium';
  } else {
    headline = 'Modest opportunity worth monitoring';
    confidence = 'low';
  }

  // Regime alignment reasons
  if (isUptrend && isBullishStrategy) {
    reasons.push(`Market is in an ${regime.trend.replace('_', ' ')} — bullish strategies like ${getStrategyLabel(candidate.strategyType)} have the wind at their back`);
  } else if (isDowntrend && isBearishStrategy) {
    reasons.push(`Defensive posture in a ${regime.trend.replace('_', ' ')} — ${getStrategyLabel(candidate.strategyType)} aligns with current direction`);
  } else if (!isDowntrend && isBullishStrategy) {
    reasons.push(`Neutral-to-bullish conditions support premium selling on the put side`);
  }

  // Volatility reasons
  if (isHighVol) {
    reasons.push(`Elevated volatility (${regime.volatility}) means richer premiums — you're being paid more to take this risk`);
  } else if (isLowVol) {
    reasons.push(`Low volatility environment — premiums are modest but probability of profit is typically higher`);
  } else {
    reasons.push(`Normal volatility levels provide balanced risk/reward for premium collection`);
  }

  // Return profile reasons
  if (annualized >= 30) {
    reasons.push(`Strong annualized return potential of ${formatPercent(annualized)} if held to expiration`);
  } else if (annualized >= 15) {
    reasons.push(`Solid ${formatPercent(annualized)} annualized return potential with defined risk`);
  }

  // Risk/reward reason
  if (returnPct >= 10) {
    reasons.push(`Collecting ${formatPercent(returnPct)} of max risk as premium — favorable risk/reward ratio`);
  }

  // DTE reason
  if (candidate.dte >= 30 && candidate.dte <= 45) {
    reasons.push(`${candidate.dte} days to expiration hits the sweet spot for theta decay acceleration`);
  } else if (candidate.dte < 30) {
    reasons.push(`Shorter duration (${candidate.dte} DTE) means faster theta decay but less time for adjustments`);
  }

  // Breadth consideration
  if (regime.breadth === 'healthy' || regime.breadth === 'broad') {
    reasons.push(`Healthy market breadth suggests broad participation — not just a few names carrying the market`);
  }

  return { headline, reasons: reasons.slice(0, 4), confidence };
}

export function TopPick({ candidate, regime, loading }: TopPickProps) {
  if (loading || !candidate || !regime) {
    return (
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Today's Top Pick</h3>
              <p className="text-sm text-muted-foreground">Analyzing market opportunities...</p>
            </div>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted/50 rounded w-1/3"></div>
            <div className="h-4 bg-muted/50 rounded w-2/3"></div>
            <div className="h-4 bg-muted/50 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rationale = generateRationale(candidate, regime);
  const returnPct = (candidate.netCredit / candidate.maxLoss) * 100;
  const annualized = (returnPct / candidate.dte) * 365;

  const confidenceColors = {
    high: 'text-green-400 border-green-400/50 bg-green-400/10',
    medium: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
    low: 'text-orange-400 border-orange-400/50 bg-orange-400/10',
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />

      <CardContent className="pt-6 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border border-primary/20">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Today's Top Pick</h3>
              <p className="text-sm text-muted-foreground">Highest-scored opportunity right now</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('text-sm', confidenceColors[rationale.confidence])}>
            {rationale.confidence === 'high' ? 'High' : rationale.confidence === 'medium' ? 'Good' : 'Fair'} Alignment
          </Badge>
        </div>

        {/* Main Trade Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Trade Details */}
          <div className="glass-panel p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{candidate.symbol}</span>
                <Badge
                  variant="outline"
                  className={cn('text-sm', getStrategyClass(candidate.strategyType))}
                >
                  {getStrategyLabel(candidate.strategyType)}
                </Badge>
              </div>
              <div className={cn('text-4xl font-bold', getScoreColor(candidate.score))}>
                {candidate.score}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Premium
                  </span>
                  <span className="text-green-400 font-semibold text-base">
                    {formatCurrency(candidate.netCredit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Max Risk
                  </span>
                  <span className="text-red-400 font-semibold text-base">
                    {formatCurrency(candidate.maxLoss)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Ann. Return
                  </span>
                  <span className="text-primary font-semibold text-base">
                    {formatPercent(annualized)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Expiration
                  </span>
                  <span className="font-semibold text-base">{candidate.dte} days</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Link href={`/trades/${candidate.id}`}>
                <Button className="w-full btn-premium">
                  View Full Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Rationale */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Lightbulb className="h-5 w-5" />
              <span className="font-semibold">Why This Trade?</span>
            </div>

            <p className="text-foreground font-medium">
              {rationale.headline}
            </p>

            <ul className="space-y-3">
              {rationale.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>

            {/* Current Regime Context */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span>Current Market Regime</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {regime.trend.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {regime.volatility} vol
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {regime.riskOnOff.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
