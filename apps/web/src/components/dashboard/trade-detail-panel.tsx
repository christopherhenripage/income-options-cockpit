'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  Copy,
  Check,
  FileText,
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
import { useExplainMode } from '@/contexts/learning-context';
import { TermTooltip } from '@/components/learning/term-tooltip';
import { WorstCaseBox } from '@/components/learning/worst-case-box';
import { PLDiagram } from '@/components/learning/pl-diagram';
import { strategyExplanations } from '@/lib/glossary';

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

interface TradeDetailPanelProps {
  trade: TradeCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaperTrade?: (trade: TradeCandidate) => void;
  isTracked?: boolean;
}

function formatExpiration(expiration: string): string {
  const date = new Date(expiration + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

function formatAmeritradeOrder(trade: TradeCandidate): {
  instructions: string[];
  copyText: string;
} {
  if (!trade.legs || trade.legs.length === 0) {
    return { instructions: ['Trade details not available'], copyText: '' };
  }

  const instructions: string[] = [];
  const copyLines: string[] = [];

  trade.legs.forEach((leg) => {
    const action = leg.action === 'sell' ? 'Sell to Open' : 'Buy to Open';
    const optionType = leg.type === 'put' ? 'Put' : 'Call';
    const expDate = formatExpiration(leg.expiration);
    const instruction = `${action} ${leg.quantity} ${trade.symbol} ${expDate} $${leg.strike} ${optionType}`;
    instructions.push(instruction);
    copyLines.push(instruction);
  });

  const creditPerContract = (trade.netCredit / 100).toFixed(2);
  copyLines.push(`\nLimit Price: $${creditPerContract} credit`);
  copyLines.push(`Max Risk: ${formatCurrency(trade.maxLoss)}`);

  return { instructions, copyText: copyLines.join('\n') };
}

export function TradeDetailPanel({
  trade,
  open,
  onOpenChange,
  onPaperTrade,
  isTracked = false,
}: TradeDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const explainMode = useExplainMode();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!trade) return null;

  const returnPct = (trade.netCredit / trade.maxLoss) * 100;
  const annualized = (returnPct / trade.dte) * 365;
  const orderInfo = formatAmeritradeOrder(trade);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{trade.symbol}</span>
              <Badge
                variant="outline"
                className={cn('text-sm', getStrategyClass(trade.strategyType))}
              >
                {getStrategyLabel(trade.strategyType)}
              </Badge>
            </div>
            <div className={cn('text-4xl font-bold', getScoreColor(trade.score))}>
              {trade.score}
            </div>
          </div>
          <SheetDescription>
            {trade.dte} days to expiration • Score {trade.score}/100
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span>Premium</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(trade.netCredit)}
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Shield className="h-4 w-4" />
                <span>Max Risk</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(trade.maxLoss)}
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Ann. Return</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatPercent(annualized)}
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span>Expiration</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{trade.dte}d</p>
            </div>
          </div>

          {/* Ameritrade Order */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Order Instructions</span>
            </div>
            <div className="space-y-2 mb-4">
              {orderInfo.instructions.map((instruction, i) => (
                <div
                  key={i}
                  className="bg-background border border-border rounded-lg p-3 font-mono text-sm"
                >
                  {instruction}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-muted-foreground">Limit Price:</span>
              <span className="text-green-400 font-semibold">
                ${(trade.netCredit / 100).toFixed(2)} credit
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
              onClick={() => handleCopy(orderInfo.copyText)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy for Ameritrade
                </>
              )}
            </Button>
          </div>

          {/* Paper Trade Button */}
          <div className="pt-2">
            {isTracked ? (
              <div className="flex items-center justify-center gap-2 text-primary py-3 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5" />
                <span className="font-medium">Tracking this trade</span>
              </div>
            ) : (
              <Button
                className="w-full btn-premium"
                onClick={() => {
                  onPaperTrade?.(trade);
                  onOpenChange(false);
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Paper Trade This
              </Button>
            )}
          </div>

          {/* Learning Section - Only shown when Explain Mode is on */}
          {explainMode && (
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold">Learn About This Trade</span>
              </div>

              {/* Strategy Explanation */}
              {strategyExplanations[trade.strategyType] && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="font-medium">
                    {strategyExplanations[trade.strategyType].oneLiner}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Think of it like:</span>{' '}
                    {strategyExplanations[trade.strategyType].analogy}
                  </p>
                </div>
              )}

              {/* Worst Case */}
              {trade.legs && trade.legs.length > 0 && (
                <WorstCaseBox
                  strategyType={trade.strategyType}
                  maxLoss={trade.maxLoss}
                  strike={trade.legs[0].strike}
                  underlyingPrice={trade.underlyingPrice}
                  credit={trade.netCredit / 100}
                  dte={trade.dte}
                  symbol={trade.symbol}
                />
              )}

              {/* P&L Diagram */}
              {trade.legs && trade.legs.length > 0 && trade.underlyingPrice && (
                <PLDiagram
                  strategyType={trade.strategyType}
                  strike={trade.legs[0].strike}
                  strike2={trade.legs.length > 1 ? trade.legs[1].strike : undefined}
                  underlyingPrice={trade.underlyingPrice}
                  credit={trade.netCredit / 100}
                  maxProfit={trade.netCredit}
                  maxLoss={trade.maxLoss}
                  breakeven={trade.legs[0].strike - trade.netCredit / 100}
                />
              )}

              {/* Quick glossary */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Key terms:</p>
                <div className="flex flex-wrap gap-2">
                  <TermTooltip term="premium" className="text-xs bg-muted px-2 py-1 rounded">
                    Premium
                  </TermTooltip>
                  <TermTooltip term="strike" className="text-xs bg-muted px-2 py-1 rounded">
                    Strike
                  </TermTooltip>
                  <TermTooltip term="dte" className="text-xs bg-muted px-2 py-1 rounded">
                    DTE
                  </TermTooltip>
                  <TermTooltip term="theta" className="text-xs bg-muted px-2 py-1 rounded">
                    Theta
                  </TermTooltip>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
