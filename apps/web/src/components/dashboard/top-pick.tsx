'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  TrendingUp,
  Shield,
  DollarSign,
  Clock,
  Lightbulb,
  CheckCircle,
  Activity,
  Copy,
  Check,
  FileText,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Play,
  Eye,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
  getScoreColor,
} from '@/lib/utils';
import { TermTooltip, ExplainedNumber } from '@/components/learning/term-tooltip';
import { WorstCaseBox } from '@/components/learning/worst-case-box';
import { PLDiagram } from '@/components/learning/pl-diagram';
import { strategyExplanations } from '@/lib/glossary';
import { useLearning } from '@/contexts/learning-context';

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
  orderTicketInstructions?: string;
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
  onPaperTrade?: (candidate: TradeCandidate) => void;
  isTracked?: boolean;
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

// Format expiration date for display
function formatExpiration(expiration: string): string {
  const date = new Date(expiration + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  });
}

// Generate Ameritrade-style order instructions
function formatAmeritradeOrder(candidate: TradeCandidate): {
  instructions: string[];
  copyText: string;
} {
  if (!candidate.legs || candidate.legs.length === 0) {
    return {
      instructions: ['Trade details not available'],
      copyText: '',
    };
  }

  const instructions: string[] = [];
  const copyLines: string[] = [];

  candidate.legs.forEach((leg, index) => {
    const action = leg.action === 'sell' ? 'Sell to Open' : 'Buy to Open';
    const optionType = leg.type === 'put' ? 'Put' : 'Call';
    const expDate = formatExpiration(leg.expiration);
    const price = candidate.netCredit / 100; // Convert cents to dollars per contract

    const instruction = `${action} ${leg.quantity} ${candidate.symbol} ${expDate} $${leg.strike} ${optionType}`;
    instructions.push(instruction);
    copyLines.push(instruction);
  });

  // Add credit info
  const creditPerContract = (candidate.netCredit / 100).toFixed(2);
  copyLines.push(`\nLimit Price: $${creditPerContract} credit`);
  copyLines.push(`Max Risk: ${formatCurrency(candidate.maxLoss)}`);

  return {
    instructions,
    copyText: copyLines.join('\n'),
  };
}

export function TopPick({ candidate, regime, loading, onPaperTrade, isTracked = false }: TopPickProps) {
  const [copied, setCopied] = useState(false);
  const [showLearning, setShowLearning] = useState(false); // Collapsed by default
  const { explainMode } = useLearning();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Trade Details */}
          <div className="glass-panel p-5 rounded-xl lg:col-span-1">
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
              {isTracked ? (
                <div className="flex items-center justify-center gap-2 text-primary py-2.5 bg-primary/10 rounded-lg">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">Tracking This Trade</span>
                </div>
              ) : (
                <Button
                  className="w-full btn-premium"
                  onClick={() => onPaperTrade?.(candidate)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Paper Trade This
                </Button>
              )}
            </div>
          </div>

          {/* Middle: Rationale */}
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

          {/* Right: Ameritrade Trade Ticket */}
          <div className="glass-panel p-5 rounded-xl border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-2 text-green-400 mb-4">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Ameritrade Order</span>
            </div>

            {candidate.legs && candidate.legs.length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {formatAmeritradeOrder(candidate).instructions.map((instruction, i) => (
                    <div
                      key={i}
                      className="bg-background/50 border border-border rounded-lg p-3 font-mono text-sm"
                    >
                      {instruction}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm mb-4 px-1">
                  <span className="text-muted-foreground">Limit Price:</span>
                  <span className="text-green-400 font-semibold">
                    ${(candidate.netCredit / 100).toFixed(2)} credit
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={() => handleCopy(formatAmeritradeOrder(candidate).copyText)}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Paste directly into thinkorswim or Ameritrade web
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {candidate.orderTicketInstructions || 'Order details loading...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Mode Section - Only shown when Explain Mode is on */}
        {explainMode && (
        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setShowLearning(!showLearning)}
            className="w-full flex items-center justify-between text-left hover:text-primary transition-colors"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Learn About This Trade</span>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                New to options?
              </Badge>
            </div>
            {showLearning ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showLearning && (
            <div className="mt-6 space-y-6">
              {/* Plain English Strategy Explanation */}
              <div className="glass-panel p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">
                    What is a <TermTooltip term={candidate.strategyType.replace('_', '-')}>{getStrategyLabel(candidate.strategyType)}</TermTooltip>?
                  </h4>
                </div>

                {strategyExplanations[candidate.strategyType] && (
                  <div className="space-y-4">
                    <p className="text-lg font-medium text-foreground">
                      {strategyExplanations[candidate.strategyType].oneLiner}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <p className="text-green-400 font-medium mb-1">Why do this?</p>
                        <p className="text-muted-foreground">
                          {strategyExplanations[candidate.strategyType].whyDoThis}
                        </p>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-400 font-medium mb-1">Best when...</p>
                        <p className="text-muted-foreground">
                          {strategyExplanations[candidate.strategyType].bestWhen}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground font-medium">Think of it like this:</span>{' '}
                        {strategyExplanations[candidate.strategyType].analogy}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Numbers Explained */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      <TermTooltip term="credit">Premium</TermTooltip> You Receive
                    </span>
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(candidate.netCredit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This money is yours to keep immediately, no matter what happens next.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      <TermTooltip term="max-loss">Maximum Risk</TermTooltip>
                    </span>
                    <Shield className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(candidate.maxLoss)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The absolute worst case. This rarely happens with careful strike selection.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      <TermTooltip term="dte">Time Until Expiration</TermTooltip>
                    </span>
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {candidate.dte} days
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {candidate.dte <= 30
                      ? 'Shorter timeframe - faster results but watch closely.'
                      : candidate.dte <= 45
                        ? 'Sweet spot - good theta decay, time to adjust if needed.'
                        : 'Longer timeframe - more premium but ties up capital longer.'
                    }
                  </p>
                </div>
              </div>

              {/* Worst Case Scenario */}
              {candidate.legs && candidate.legs.length > 0 && (
                <WorstCaseBox
                  strategyType={candidate.strategyType}
                  maxLoss={candidate.maxLoss}
                  strike={candidate.legs[0].strike}
                  underlyingPrice={candidate.underlyingPrice}
                  credit={candidate.netCredit / 100}
                  dte={candidate.dte}
                  symbol={candidate.symbol}
                />
              )}

              {/* P&L Diagram */}
              {candidate.legs && candidate.legs.length > 0 && candidate.underlyingPrice && (
                <PLDiagram
                  strategyType={candidate.strategyType}
                  strike={candidate.legs[0].strike}
                  strike2={candidate.legs.length > 1 ? candidate.legs[1].strike : undefined}
                  underlyingPrice={candidate.underlyingPrice}
                  credit={candidate.netCredit / 100}
                  maxProfit={candidate.netCredit}
                  maxLoss={candidate.maxLoss}
                  breakeven={candidate.legs[0].strike - (candidate.netCredit / 100)}
                />
              )}

              {/* Quick Glossary */}
              <div className="glass-panel p-4 rounded-xl">
                <p className="text-sm font-medium mb-3">Quick Reference - Hover for definitions:</p>
                <div className="flex flex-wrap gap-2">
                  <TermTooltip term="delta" className="text-sm bg-muted/50 px-2 py-1 rounded">Delta</TermTooltip>
                  <TermTooltip term="theta" className="text-sm bg-muted/50 px-2 py-1 rounded">Theta</TermTooltip>
                  <TermTooltip term="iv" className="text-sm bg-muted/50 px-2 py-1 rounded">IV</TermTooltip>
                  <TermTooltip term="strike" className="text-sm bg-muted/50 px-2 py-1 rounded">Strike</TermTooltip>
                  <TermTooltip term="premium" className="text-sm bg-muted/50 px-2 py-1 rounded">Premium</TermTooltip>
                  <TermTooltip term="assignment" className="text-sm bg-muted/50 px-2 py-1 rounded">Assignment</TermTooltip>
                  <TermTooltip term="itm" className="text-sm bg-muted/50 px-2 py-1 rounded">ITM</TermTooltip>
                  <TermTooltip term="otm" className="text-sm bg-muted/50 px-2 py-1 rounded">OTM</TermTooltip>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
