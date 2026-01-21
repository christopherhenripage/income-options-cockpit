'use client';

import { useState } from 'react';
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
  Copy,
  Check,
  FileText,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Play,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
} from '@/lib/utils';
import { TermTooltip } from '@/components/learning/term-tooltip';
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

// Simple score color - just three states
function getScoreColor(score: number): string {
  if (score >= 70) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
}

function getScoreBadgeClass(score: number): string {
  if (score >= 70) return 'score-badge-high';
  if (score >= 50) return 'score-badge-medium';
  return 'score-badge-low';
}

export function TopPick({ candidate, regime, loading, onPaperTrade, isTracked = false }: TopPickProps) {
  const [copied, setCopied] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
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
      <div className="card-featured p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Today's Top Pick</h3>
            <p className="text-sm text-muted-foreground">Finding the best opportunity...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted/30 rounded-lg w-1/4"></div>
          <div className="h-6 bg-muted/30 rounded w-2/3"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-16 bg-muted/30 rounded-lg"></div>
            <div className="h-16 bg-muted/30 rounded-lg"></div>
            <div className="h-16 bg-muted/30 rounded-lg"></div>
            <div className="h-16 bg-muted/30 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const rationale = generateRationale(candidate, regime);
  const returnPct = (candidate.netCredit / candidate.maxLoss) * 100;
  const annualized = (returnPct / candidate.dte) * 365;
  const strike = candidate.legs?.[0]?.strike;
  const buffer = candidate.underlyingPrice && strike
    ? ((candidate.underlyingPrice - strike) / candidate.underlyingPrice) * 100
    : null;

  return (
    <div className="card-featured p-6">
      {/* Header - Clean and confident */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold">Today's Top Pick</h3>
              {isTracked && (
                <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                  <Eye className="h-3 w-3 mr-1" /> Tracking
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{rationale.headline}</p>
          </div>
        </div>
        <div className={cn('score-badge', getScoreBadgeClass(candidate.score))}>
          {candidate.score}
        </div>
      </div>

      {/* Main Content - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Trade Identity + Key Metrics */}
        <div className="space-y-5">
          {/* Symbol + Strategy */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold tracking-tight">{candidate.symbol}</span>
            <Badge
              variant="outline"
              className={cn('text-sm', getStrategyClass(candidate.strategyType))}
            >
              {getStrategyLabel(candidate.strategyType)}
            </Badge>
          </div>

          {/* Price Context */}
          {candidate.underlyingPrice && strike && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Stock: </span>
                <span className="font-medium">${candidate.underlyingPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Strike: </span>
                <span className="font-medium">${strike}</span>
              </div>
              {buffer !== null && (
                <div>
                  <span className="text-muted-foreground">Buffer: </span>
                  <span className={cn(
                    'font-medium',
                    buffer >= 5 ? 'text-profit' : buffer >= 3 ? 'score-medium' : 'text-loss'
                  )}>
                    {buffer.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Key Metrics - Clean grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="metric">
              <span className="metric-label">Premium</span>
              <span className="metric-value text-profit">{formatCurrency(candidate.netCredit)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Max Risk</span>
              <span className="metric-value text-loss">{formatCurrency(candidate.maxLoss)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Ann. Return</span>
              <span className="metric-value text-primary">{formatPercent(annualized)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Expires</span>
              <span className="metric-value">{candidate.dte}d</span>
            </div>
          </div>

          {/* Why This Trade - Compact */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Why this trade?</span>
            </div>
            <ul className="space-y-2">
              {rationale.reasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-profit flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Order Ticket + Action */}
        <div className="bg-muted/30 rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-profit" />
            <span className="font-semibold">Order Instructions</span>
          </div>

          {candidate.legs && candidate.legs.length > 0 ? (
            <>
              <div className="space-y-2 mb-4">
                {formatAmeritradeOrder(candidate).instructions.map((instruction, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-lg p-3 font-mono text-sm"
                  >
                    {instruction}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">Limit Price:</span>
                <span className="text-profit font-semibold">
                  ${(candidate.netCredit / 100).toFixed(2)} credit
                </span>
              </div>

              <div className="flex gap-3">
                {!isTracked && (
                  <Button
                    className="flex-1 btn-primary"
                    onClick={() => onPaperTrade?.(candidate)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Paper Trade
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={cn(
                    'border-border hover:bg-muted',
                    isTracked ? 'flex-1' : ''
                  )}
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
                      Copy Order
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-3 text-center">
                Paste into thinkorswim or Schwab
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {candidate.orderTicketInstructions || 'Loading order details...'}
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
            className="w-full flex items-center justify-between text-left hover:text-primary transition-colors group"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-medium">Learn about this strategy</span>
            </div>
            <ChevronDown className={cn(
              'h-5 w-5 text-muted-foreground transition-transform',
              showLearning && 'rotate-180'
            )} />
          </button>

          {showLearning && (
            <div className="mt-5 space-y-5 animate-fade-in">
              {/* Strategy Explanation */}
              {strategyExplanations[candidate.strategyType] && (
                <div className="bg-muted/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">
                      What is a {getStrategyLabel(candidate.strategyType)}?
                    </h4>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {strategyExplanations[candidate.strategyType].oneLiner}
                  </p>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Think of it like this: </span>
                      {strategyExplanations[candidate.strategyType].analogy}
                    </p>
                  </div>
                </div>
              )}

              {/* Worst Case + P&L Diagram */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
              </div>

              {/* Quick Glossary */}
              <div className="flex flex-wrap gap-2 pt-3">
                <span className="text-xs text-muted-foreground mr-2">Terms:</span>
                <TermTooltip term="delta" className="text-xs bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors cursor-help">Delta</TermTooltip>
                <TermTooltip term="theta" className="text-xs bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors cursor-help">Theta</TermTooltip>
                <TermTooltip term="iv" className="text-xs bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors cursor-help">IV</TermTooltip>
                <TermTooltip term="strike" className="text-xs bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors cursor-help">Strike</TermTooltip>
                <TermTooltip term="premium" className="text-xs bg-muted/50 px-2 py-1 rounded hover:bg-muted transition-colors cursor-help">Premium</TermTooltip>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
