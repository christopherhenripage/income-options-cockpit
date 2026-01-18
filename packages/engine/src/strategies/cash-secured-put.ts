import {
  BaseStrategy,
  StrategyContext,
  StrategyCandidate,
} from './base-strategy';
import { StrategyType, OptionContract, OptionLeg } from '../types';
import {
  calculateMid,
  calculateSpreadPct,
  calculateDTE,
  calculateAnnualizedReturn,
  calculateROC,
  estimateProbabilityOfProfit,
} from '../utils';

/**
 * Cash-Secured Put Strategy
 *
 * Sells a put option on a stock you'd be willing to own, collecting premium
 * while potentially being assigned shares at the strike price.
 *
 * Best used in: Neutral to bullish markets, when willing to own the stock
 * Risk: Max loss = (Strike - Premium) * 100 if stock goes to $0
 */
export class CashSecuredPutStrategy extends BaseStrategy {
  strategyType: StrategyType = 'cash_secured_put';
  name = 'Cash-Secured Put';

  shouldConsider(context: StrategyContext): boolean {
    const { settings, signals, regime } = context;

    // Check if strategy is enabled
    if (!settings.cashSecuredPut.enabled) return false;

    // Check liquidity minimum
    if (!signals.liquidity.meetsMinimum) return false;

    // Check earnings exclusion
    if (signals.earningsProximity.withinExclusionWindow) return false;

    // Avoid in strong downtrends unless aggressive
    if (
      signals.trend === 'strong_downtrend' &&
      context.riskProfilePreset !== 'aggressive'
    ) {
      return false;
    }

    // Check trend alignment if specified
    if (
      settings.preferredTrendRegimes.length > 0 &&
      !settings.preferredTrendRegimes.includes(signals.trend)
    ) {
      return false;
    }

    return true;
  }

  findCandidates(context: StrategyContext): StrategyCandidate[] {
    const { quote, chain, settings, signals, regime } = context;
    const candidates: StrategyCandidate[] = [];
    const cspSettings = settings.cashSecuredPut;

    const dte = calculateDTE(chain.expiration);

    // Check DTE range
    if (dte < cspSettings.minDTE || dte > cspSettings.maxDTE) {
      return candidates;
    }

    // Filter puts by delta target
    const eligiblePuts = chain.puts.filter((put) => {
      if (put.delta === null) return false;

      const absDelta = Math.abs(put.delta);

      // Must be within target delta range (typically -0.20 to -0.30)
      if (
        absDelta < cspSettings.targetDeltaMin ||
        absDelta > cspSettings.targetDeltaMax
      ) {
        return false;
      }

      // Must be OTM
      if (put.inTheMoney) return false;

      // Check liquidity
      const spreadPct = calculateSpreadPct(put.bid, put.ask);
      if (spreadPct > settings.liquidityFilters.maxBidAskSpreadPct) return false;
      if (put.openInterest < settings.liquidityFilters.minOptionOI) return false;
      if (put.volume < settings.liquidityFilters.minOptionVolume) return false;

      // Minimum premium check
      const mid = calculateMid(put.bid, put.ask);
      if (mid < 0.10) return false;

      return true;
    });

    // Sort by premium (highest first) and take top candidates
    eligiblePuts.sort((a, b) => {
      const midA = calculateMid(a.bid, a.ask);
      const midB = calculateMid(b.bid, b.ask);
      return midB - midA;
    });

    // Create candidates from top eligible puts
    for (const put of eligiblePuts.slice(0, 3)) {
      const candidate = this.createCandidate(put, context, dte);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  private createCandidate(
    put: OptionContract,
    context: StrategyContext,
    dte: number
  ): StrategyCandidate | null {
    const { quote, settings, signals, regime } = context;
    const cspSettings = settings.cashSecuredPut;

    const mid = calculateMid(put.bid, put.ask);
    const credit = mid * 100; // Per contract
    const strike = put.strike;

    // Calculate risk metrics
    const maxLoss = (strike - mid) * 100;
    const buyingPower = strike * 100;
    const breakeven = strike - mid;

    const annualizedReturn = calculateAnnualizedReturn(credit, maxLoss, dte);
    const roc = calculateROC(credit, buyingPower);
    const pop = put.delta ? estimateProbabilityOfProfit(put.delta) : 70;

    // Check risk limits
    const accountSize = settings.riskLimits.accountSize || 100000;
    const riskPct = (maxLoss / accountSize) * 100;
    if (riskPct > settings.riskLimits.maxRiskPerTradePct) {
      return null;
    }

    // Build reasons
    const reasons = [
      this.createReason(
        'Liquidity',
        'Option OI',
        put.openInterest >= settings.liquidityFilters.minOptionOI,
        put.openInterest,
        `>= ${settings.liquidityFilters.minOptionOI}`,
        1
      ),
      this.createReason(
        'Liquidity',
        'Bid-Ask Spread',
        calculateSpreadPct(put.bid, put.ask) <= settings.liquidityFilters.maxBidAskSpreadPct,
        `${calculateSpreadPct(put.bid, put.ask).toFixed(1)}%`,
        `<= ${settings.liquidityFilters.maxBidAskSpreadPct}%`,
        1.5
      ),
      this.createReason(
        'Delta',
        'Delta Target',
        Math.abs(put.delta || 0) >= cspSettings.targetDeltaMin &&
          Math.abs(put.delta || 0) <= cspSettings.targetDeltaMax,
        put.delta?.toFixed(2) || 'N/A',
        `-${cspSettings.targetDeltaMin} to -${cspSettings.targetDeltaMax}`,
        1.5
      ),
      this.createReason(
        'Premium',
        'Annualized Return',
        annualizedReturn >= 15,
        `${annualizedReturn.toFixed(1)}%`,
        '>= 15%',
        2
      ),
      this.createReason(
        'Trend',
        'Trend Alignment',
        signals.trend !== 'strong_downtrend' && signals.trend !== 'downtrend',
        signals.trend,
        'Not in downtrend',
        1.5
      ),
      this.createReason(
        'Volatility',
        'IV Rank',
        (signals.ivRank || 50) >= 30,
        signals.ivRank !== null ? `${signals.ivRank}%` : 'N/A',
        '>= 30%',
        1
      ),
      this.createReason(
        'Risk',
        'Risk Per Trade',
        riskPct <= settings.riskLimits.maxRiskPerTradePct,
        `${riskPct.toFixed(1)}%`,
        `<= ${settings.riskLimits.maxRiskPerTradePct}%`,
        2
      ),
      this.createReason(
        'Buffer',
        'Buffer to Strike',
        ((quote.price - strike) / quote.price) * 100 >= 3,
        `${(((quote.price - strike) / quote.price) * 100).toFixed(1)}%`,
        '>= 3%',
        1
      ),
    ];

    // Build score components
    const scoreComponents = [
      this.createScoreComponent('Premium Yield', annualizedReturn, 0.25, 40),
      this.createScoreComponent('Liquidity', signals.liquidity.overallScore, 0.2, 100),
      this.createScoreComponent('IV Rank', signals.ivRank || 50, 0.15, 100),
      this.createScoreComponent(
        'Trend Alignment',
        signals.trend === 'strong_uptrend' ? 100 : signals.trend === 'uptrend' ? 80 : signals.trend === 'neutral' ? 60 : 20,
        0.2,
        100
      ),
      this.createScoreComponent(
        'Buffer Score',
        Math.min(100, ((quote.price - strike) / quote.price) * 1000),
        0.1,
        100
      ),
      this.createScoreComponent(
        'Probability of Profit',
        pop,
        0.1,
        100
      ),
    ];

    const score = Math.round(
      scoreComponents.reduce((sum, c) => sum + c.weightedScore, 0)
    );

    // Build option leg
    const legs: OptionLeg[] = [
      {
        action: 'sell',
        quantity: 1,
        option: put,
        orderPrice: mid,
      },
    ];

    // Calculate conviction
    const conviction = this.calculateConviction(reasons, signals, regime);

    // Build exit rules
    const exitRules = {
      profitTargetPct: cspSettings.profitTargetPct,
      maxLossPct: cspSettings.maxLossPct,
      dteExit: 7,
      rollGuidance:
        'If ITM near expiration, consider rolling down and out to avoid assignment while collecting additional premium.',
    };

    // Build invalidation conditions
    const invalidationConditions = [
      {
        type: 'trend_break' as const,
        description: 'Price breaks below 50-day MA with increasing volume',
        threshold: `Price < $${signals.ma50.toFixed(2)}`,
      },
      {
        type: 'vol_spike' as const,
        description: 'IV spikes significantly indicating increased uncertainty',
        threshold: 'IV Rank > 80%',
      },
      {
        type: 'liquidity_deterioration' as const,
        description: 'Bid-ask spread widens significantly',
        threshold: `Spread > ${settings.liquidityFilters.maxBidAskSpreadPct * 2}%`,
      },
    ];

    // Build explanations
    const plainEnglishSummary = `Sell a ${put.expiration} $${strike} put on ${quote.symbol} for $${mid.toFixed(2)} credit ($${credit.toFixed(0)} per contract). This trade profits if ${quote.symbol} stays above $${breakeven.toFixed(2)} by expiration. Maximum risk is $${maxLoss.toFixed(0)} if ${quote.symbol} goes to $0. The position benefits from time decay and requires $${buyingPower.toFixed(0)} in cash as collateral.`;

    const learningNotes = [
      {
        topic: 'Why Cash-Secured Put?',
        explanation: `A CSP is ideal when you're neutral to bullish on a stock you'd be willing to own. You collect premium upfront, and if assigned, you effectively buy the stock at a discount (strike minus premium).`,
      },
      {
        topic: 'Delta of ${(put.delta || 0).toFixed(2)}',
        explanation: `A delta of ${(put.delta || 0).toFixed(2)} means there's approximately a ${Math.abs((put.delta || 0) * 100).toFixed(0)}% chance this option expires ITM. Lower delta = more conservative.`,
      },
      {
        topic: 'Time Decay (Theta)',
        explanation: `This position has theta of $${put.theta?.toFixed(2) || 'N/A'}, meaning you collect roughly that amount daily as the option loses time value. Theta accelerates as expiration approaches.`,
      },
      {
        topic: 'When to Exit',
        explanation: `Consider closing at ${cspSettings.profitTargetPct}% profit ($${(credit * cspSettings.profitTargetPct / 100).toFixed(0)} to buy back) or if the underlying drops significantly below your strike.`,
      },
    ];

    // Build order ticket instructions
    const orderTicketInstructions = `
## thinkorswim Order Ticket

1. Open Trade Tab → Options Chain
2. Select ${quote.symbol} → ${put.expiration} expiration
3. Find $${strike} PUT strike
4. Right-click → Sell → Single
5. Verify:
   - Action: SELL TO OPEN
   - Qty: 1
   - Symbol: ${put.symbol}
   - Price: LIMIT @ $${mid.toFixed(2)} (or bid if aggressive)
   - Duration: DAY
6. Review order and confirm
7. Set alert at $${breakeven.toFixed(2)} (breakeven) for management

Note: Requires $${buyingPower.toFixed(0)} cash secured margin
`.trim();

    return {
      legs,
      netCredit: credit,
      dte,
      riskBox: {
        maxProfit: credit,
        maxLoss,
        breakeven,
        breakevenLower: null,
        breakevenUpper: null,
        buyingPowerRequired: buyingPower,
        collateralRequired: buyingPower,
        returnOnRisk: annualizedReturn,
        returnOnCapital: roc,
        probabilityOfProfit: pop,
      },
      exitRules,
      invalidationConditions,
      reasons,
      scoreComponents,
      score,
      conviction,
      plainEnglishSummary,
      learningNotes,
      orderTicketInstructions,
    };
  }
}
