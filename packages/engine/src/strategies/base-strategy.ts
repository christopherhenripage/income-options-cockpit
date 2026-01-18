import {
  TradePacket,
  OptionChain,
  SymbolSignals,
  MarketRegime,
  TradingSettings,
  StrategyType,
  Quote,
  Reason,
  ScoreComponent,
  ConvictionMeter,
  OptionLeg,
  RiskBox,
  ExitRules,
  InvalidationCondition,
} from '../types';
import {
  generateId,
  getCurrentTimestamp,
  calculateMid,
  calculateSpreadPct,
  calculateAnnualizedReturn,
  calculateROC,
  estimateProbabilityOfProfit,
  calculateDTE,
} from '../utils';

export interface StrategyCandidate {
  legs: OptionLeg[];
  netCredit: number;
  dte: number;
  riskBox: RiskBox;
  exitRules: ExitRules;
  invalidationConditions: InvalidationCondition[];
  reasons: Reason[];
  scoreComponents: ScoreComponent[];
  score: number;
  conviction: ConvictionMeter;
  plainEnglishSummary: string;
  learningNotes: { topic: string; explanation: string }[];
  orderTicketInstructions: string;
}

export interface StrategyContext {
  quote: Quote;
  chain: OptionChain;
  signals: SymbolSignals;
  regime: MarketRegime;
  settings: TradingSettings;
  settingsVersionId: string;
  riskProfilePreset: string;
  workspaceId: string;
  recomputeRunId: string;
}

/**
 * Base class for option strategies
 */
export abstract class BaseStrategy {
  abstract strategyType: StrategyType;
  abstract name: string;

  /**
   * Check if this strategy should be considered given current conditions
   */
  abstract shouldConsider(context: StrategyContext): boolean;

  /**
   * Find candidate trades for this strategy
   */
  abstract findCandidates(context: StrategyContext): StrategyCandidate[];

  /**
   * Convert a candidate to a full TradePacket
   */
  candidateToPacket(
    candidate: StrategyCandidate,
    context: StrategyContext
  ): TradePacket {
    return {
      id: generateId(),
      workspaceId: context.workspaceId,
      createdAt: getCurrentTimestamp(),
      symbol: context.quote.symbol,
      strategyType: this.strategyType,
      status: 'candidate',
      underlyingPrice: context.quote.price,
      marketRegime: context.regime,
      symbolSignals: context.signals,
      legs: candidate.legs,
      netCredit: candidate.netCredit,
      netDebit: null,
      dte: candidate.dte,
      riskBox: candidate.riskBox,
      exitRules: candidate.exitRules,
      invalidationConditions: candidate.invalidationConditions,
      score: candidate.score,
      scoreComponents: candidate.scoreComponents,
      reasons: candidate.reasons,
      conviction: candidate.conviction,
      settingsVersionId: context.settingsVersionId,
      riskProfilePreset: context.riskProfilePreset,
      recomputeRunId: context.recomputeRunId,
      orderTicketInstructions: candidate.orderTicketInstructions,
      plainEnglishSummary: candidate.plainEnglishSummary,
      learningNotes: candidate.learningNotes,
    };
  }

  /**
   * Helper to create a reason entry
   */
  protected createReason(
    category: string,
    check: string,
    passed: boolean,
    value: string | number,
    threshold: string | number,
    weight: number = 1
  ): Reason {
    return {
      category,
      check,
      passed,
      value: String(value),
      threshold: String(threshold),
      weight,
      contribution: passed ? weight : 0,
    };
  }

  /**
   * Helper to create a score component
   */
  protected createScoreComponent(
    name: string,
    rawValue: number,
    weight: number,
    maxValue: number = 100
  ): ScoreComponent {
    const normalizedScore = Math.min(100, Math.max(0, (rawValue / maxValue) * 100));
    return {
      name,
      rawValue,
      normalizedScore: Math.round(normalizedScore),
      weight,
      weightedScore: Math.round(normalizedScore * weight),
    };
  }

  /**
   * Calculate conviction meter
   */
  protected calculateConviction(
    reasons: Reason[],
    signals: SymbolSignals,
    regime: MarketRegime
  ): ConvictionMeter {
    const factors: ConvictionMeter['factors'] = [];

    // Liquidity factor
    if (signals.liquidity.overallScore >= 70) {
      factors.push({
        factor: 'High liquidity',
        impact: 'positive',
        description: 'Strong option volume and tight spreads',
      });
    } else if (signals.liquidity.overallScore < 40) {
      factors.push({
        factor: 'Low liquidity',
        impact: 'negative',
        description: 'Limited option activity, wider spreads',
      });
    }

    // Regime alignment
    if (
      regime.riskOnOff === 'risk_on' &&
      (signals.trend === 'uptrend' || signals.trend === 'strong_uptrend')
    ) {
      factors.push({
        factor: 'Favorable regime',
        impact: 'positive',
        description: 'Uptrend with risk-on market environment',
      });
    } else if (regime.riskOnOff === 'risk_off') {
      factors.push({
        factor: 'Defensive regime',
        impact: 'negative',
        description: 'Risk-off environment warrants caution',
      });
    }

    // Volatility
    if (signals.ivRank !== null) {
      if (signals.ivRank >= 50) {
        factors.push({
          factor: 'Elevated IV',
          impact: 'positive',
          description: 'Higher premiums available for selling',
        });
      } else if (signals.ivRank < 20) {
        factors.push({
          factor: 'Low IV',
          impact: 'negative',
          description: 'Lower premiums may reduce returns',
        });
      }
    }

    // Earnings proximity
    if (signals.earningsProximity.withinExclusionWindow) {
      factors.push({
        factor: 'Earnings approaching',
        impact: 'negative',
        description: 'Event risk from upcoming earnings',
      });
    }

    // Calculate confidence and uncertainty scores
    const passedReasons = reasons.filter((r) => r.passed).length;
    const totalReasons = reasons.length;
    const passRate = totalReasons > 0 ? passedReasons / totalReasons : 0;

    const confidence = Math.round(
      (passRate * 50 + signals.liquidity.overallScore * 0.3 + (signals.ivRank || 50) * 0.2)
    );

    const uncertaintyFactors =
      (signals.earningsProximity.withinExclusionWindow ? 20 : 0) +
      (regime.volatility === 'high' || regime.volatility === 'panic' ? 20 : 0) +
      (signals.liquidity.overallScore < 50 ? 15 : 0) +
      (regime.breadth.assessment === 'weak' || regime.breadth.assessment === 'very_weak' ? 15 : 0);

    return {
      confidence: Math.min(100, Math.max(0, confidence)),
      uncertainty: Math.min(100, uncertaintyFactors),
      factors,
    };
  }
}
