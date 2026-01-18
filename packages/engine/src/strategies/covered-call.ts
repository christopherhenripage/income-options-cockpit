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
 * Covered Call Strategy
 *
 * Sells a call option against owned shares, generating income while
 * capping upside potential at the strike price.
 *
 * Best used in: Neutral to slightly bullish markets, when willing to sell shares
 * Risk: Limited to stock ownership risk (stock can go to $0)
 */
export class CoveredCallStrategy extends BaseStrategy {
  strategyType: StrategyType = 'covered_call';
  name = 'Covered Call';

  shouldConsider(context: StrategyContext): boolean {
    const { settings, signals, regime } = context;

    // Check if strategy is enabled
    if (!settings.coveredCall.enabled) return false;

    // Check liquidity minimum
    if (!signals.liquidity.meetsMinimum) return false;

    // Check earnings exclusion
    if (signals.earningsProximity.withinExclusionWindow) return false;

    // Avoid in strong uptrends (risk of being called away)
    // But still allow for income generation
    if (
      signals.trend === 'strong_uptrend' &&
      context.riskProfilePreset === 'conservative'
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
    const ccSettings = settings.coveredCall;

    const dte = calculateDTE(chain.expiration);

    // Check DTE range
    if (dte < ccSettings.minDTE || dte > ccSettings.maxDTE) {
      return candidates;
    }

    // Filter calls by delta target
    const eligibleCalls = chain.calls.filter((call) => {
      if (call.delta === null) return false;

      const delta = call.delta;

      // Must be within target delta range (typically 0.15 to 0.30)
      if (
        delta < ccSettings.targetDeltaMin ||
        delta > ccSettings.targetDeltaMax
      ) {
        return false;
      }

      // Must be OTM
      if (call.inTheMoney) return false;

      // Check liquidity
      const spreadPct = calculateSpreadPct(call.bid, call.ask);
      if (spreadPct > settings.liquidityFilters.maxBidAskSpreadPct) return false;
      if (call.openInterest < settings.liquidityFilters.minOptionOI) return false;
      if (call.volume < settings.liquidityFilters.minOptionVolume) return false;

      // Minimum premium check
      const mid = calculateMid(call.bid, call.ask);
      if (mid < 0.10) return false;

      return true;
    });

    // Sort by premium (highest first)
    eligibleCalls.sort((a, b) => {
      const midA = calculateMid(a.bid, a.ask);
      const midB = calculateMid(b.bid, b.ask);
      return midB - midA;
    });

    // Create candidates from top eligible calls
    for (const call of eligibleCalls.slice(0, 3)) {
      const candidate = this.createCandidate(call, context, dte);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  private createCandidate(
    call: OptionContract,
    context: StrategyContext,
    dte: number
  ): StrategyCandidate | null {
    const { quote, settings, signals, regime } = context;
    const ccSettings = settings.coveredCall;

    const mid = calculateMid(call.bid, call.ask);
    const credit = mid * 100; // Per contract
    const strike = call.strike;

    // Calculate risk metrics
    // For covered call, max profit is limited by strike
    const maxProfit = (strike - quote.price) * 100 + credit;
    const maxLoss = quote.price * 100 - credit; // If stock goes to 0
    const breakeven = quote.price - mid;
    const buyingPower = quote.price * 100; // Cost to own 100 shares

    const annualizedReturn = calculateAnnualizedReturn(credit, buyingPower, dte);
    const roc = calculateROC(credit, buyingPower);
    const pop = call.delta ? estimateProbabilityOfProfit(call.delta) : 70;

    // Build reasons
    const reasons = [
      this.createReason(
        'Liquidity',
        'Option OI',
        call.openInterest >= settings.liquidityFilters.minOptionOI,
        call.openInterest,
        `>= ${settings.liquidityFilters.minOptionOI}`,
        1
      ),
      this.createReason(
        'Liquidity',
        'Bid-Ask Spread',
        calculateSpreadPct(call.bid, call.ask) <= settings.liquidityFilters.maxBidAskSpreadPct,
        `${calculateSpreadPct(call.bid, call.ask).toFixed(1)}%`,
        `<= ${settings.liquidityFilters.maxBidAskSpreadPct}%`,
        1.5
      ),
      this.createReason(
        'Delta',
        'Delta Target',
        (call.delta || 0) >= ccSettings.targetDeltaMin &&
          (call.delta || 0) <= ccSettings.targetDeltaMax,
        call.delta?.toFixed(2) || 'N/A',
        `${ccSettings.targetDeltaMin} to ${ccSettings.targetDeltaMax}`,
        1.5
      ),
      this.createReason(
        'Premium',
        'Annualized Return',
        annualizedReturn >= 10,
        `${annualizedReturn.toFixed(1)}%`,
        '>= 10%',
        2
      ),
      this.createReason(
        'Trend',
        'Trend Alignment',
        signals.trend !== 'strong_uptrend',
        signals.trend,
        'Not strong uptrend (assignment risk)',
        1
      ),
      this.createReason(
        'Volatility',
        'IV Rank',
        (signals.ivRank || 50) >= 25,
        signals.ivRank !== null ? `${signals.ivRank}%` : 'N/A',
        '>= 25%',
        1
      ),
      this.createReason(
        'Upside',
        'Room to Strike',
        ((strike - quote.price) / quote.price) * 100 >= 2,
        `${(((strike - quote.price) / quote.price) * 100).toFixed(1)}%`,
        '>= 2%',
        1
      ),
    ];

    // Build score components
    const scoreComponents = [
      this.createScoreComponent('Premium Yield', annualizedReturn, 0.25, 30),
      this.createScoreComponent('Liquidity', signals.liquidity.overallScore, 0.2, 100),
      this.createScoreComponent('IV Rank', signals.ivRank || 50, 0.15, 100),
      this.createScoreComponent(
        'Assignment Safety',
        signals.trend === 'strong_uptrend' ? 30 : signals.trend === 'uptrend' ? 60 : 90,
        0.2,
        100
      ),
      this.createScoreComponent(
        'Upside to Strike',
        Math.min(100, ((strike - quote.price) / quote.price) * 500),
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
        option: call,
        orderPrice: mid,
      },
    ];

    // Calculate conviction
    const conviction = this.calculateConviction(reasons, signals, regime);

    // Build exit rules
    const exitRules = {
      profitTargetPct: ccSettings.profitTargetPct,
      maxLossPct: ccSettings.maxLossPct,
      dteExit: 7,
      rollGuidance:
        'If ITM near expiration and you want to keep shares, buy back the call and sell a further-dated, higher strike call. If willing to sell, let assignment happen.',
    };

    // Build invalidation conditions
    const invalidationConditions = [
      {
        type: 'price_breach' as const,
        description: 'Price moves significantly above strike, increasing assignment probability',
        threshold: `Price > $${(strike * 1.05).toFixed(2)}`,
      },
      {
        type: 'vol_spike' as const,
        description: 'IV spikes making it expensive to roll or close',
        threshold: 'IV Rank > 80%',
      },
      {
        type: 'trend_break' as const,
        description: 'Stock enters strong uptrend (high assignment risk)',
        threshold: 'Strong uptrend confirmed',
      },
    ];

    // Build explanations
    const plainEnglishSummary = `Sell a ${call.expiration} $${strike} call on ${quote.symbol} for $${mid.toFixed(2)} credit ($${credit.toFixed(0)} per contract). This trade profits as long as ${quote.symbol} stays below $${strike} by expiration. If the stock rises above $${strike}, shares may be called away (sold at $${strike}). Maximum profit is $${maxProfit.toFixed(0)} if assigned. The position requires owning 100 shares of ${quote.symbol}.`;

    const learningNotes = [
      {
        topic: 'Why Covered Call?',
        explanation: `A covered call generates income on shares you already own. You're paid for giving someone else the right to buy your shares at the strike price. Best when you're neutral or slightly bullish but willing to sell at the strike.`,
      },
      {
        topic: 'Assignment Risk',
        explanation: `With delta of ${(call.delta || 0).toFixed(2)}, there's approximately a ${((call.delta || 0) * 100).toFixed(0)}% chance of assignment. If ${quote.symbol} closes above $${strike} at expiration, expect to sell your shares.`,
      },
      {
        topic: 'Time Decay (Theta)',
        explanation: `Theta of $${call.theta?.toFixed(2) || 'N/A'} means you earn roughly that amount daily as option time value decays. This benefits you as the seller.`,
      },
      {
        topic: 'Managing the Position',
        explanation: `If ${quote.symbol} rises sharply, you can buy back the call at a loss and sell a higher strike (rolling up). If flat or down, let the call expire worthless for full profit.`,
      },
    ];

    // Build order ticket instructions
    const orderTicketInstructions = `
## thinkorswim Order Ticket

1. Open Trade Tab → Options Chain
2. Select ${quote.symbol} → ${call.expiration} expiration
3. Find $${strike} CALL strike
4. Right-click → Sell → Single
5. Verify:
   - Action: SELL TO OPEN
   - Qty: 1
   - Symbol: ${call.symbol}
   - Price: LIMIT @ $${mid.toFixed(2)}
   - Duration: DAY
6. Review order and confirm

Note: Requires owning 100 shares of ${quote.symbol}

## Assignment Preparation
- Confirm you're willing to sell at $${strike}
- Total proceeds if assigned: $${(strike * 100 + credit).toFixed(0)}
- Capital gain/loss depends on your cost basis
`.trim();

    return {
      legs,
      netCredit: credit,
      dte,
      riskBox: {
        maxProfit,
        maxLoss,
        breakeven,
        breakevenLower: null,
        breakevenUpper: null,
        buyingPowerRequired: buyingPower,
        collateralRequired: 0, // Shares serve as collateral
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
