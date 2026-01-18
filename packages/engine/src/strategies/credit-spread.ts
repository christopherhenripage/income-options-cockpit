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
 * Put Credit Spread (Bull Put Spread) Strategy
 *
 * Sells a put at a higher strike and buys a put at a lower strike.
 * Profits when the stock stays above the short put strike.
 *
 * Best used in: Neutral to bullish markets with elevated IV
 * Risk: Defined - Max loss is (spread width - credit received) * 100
 */
export class PutCreditSpreadStrategy extends BaseStrategy {
  strategyType: StrategyType = 'put_credit_spread';
  name = 'Put Credit Spread';

  shouldConsider(context: StrategyContext): boolean {
    const { settings, signals, regime } = context;

    // Check if strategy is enabled
    if (!settings.putCreditSpread.enabled) return false;

    // Check liquidity minimum
    if (!signals.liquidity.meetsMinimum) return false;

    // Check earnings exclusion
    if (signals.earningsProximity.withinExclusionWindow) return false;

    // Prefer elevated volatility for spreads
    if (
      settings.preferredVolRegimes.length > 0 &&
      !settings.preferredVolRegimes.includes(signals.volatility)
    ) {
      return false;
    }

    // Avoid strong downtrends
    if (signals.trend === 'strong_downtrend') return false;

    return true;
  }

  findCandidates(context: StrategyContext): StrategyCandidate[] {
    const { quote, chain, settings, signals, regime } = context;
    const candidates: StrategyCandidate[] = [];
    const pcsSettings = settings.putCreditSpread;

    const dte = calculateDTE(chain.expiration);

    // Check DTE range
    if (dte < pcsSettings.minDTE || dte > pcsSettings.maxDTE) {
      return candidates;
    }

    // Find short put candidates
    const shortPutCandidates = chain.puts.filter((put) => {
      if (put.delta === null) return false;
      const absDelta = Math.abs(put.delta);
      return (
        absDelta >= pcsSettings.targetDeltaMin &&
        absDelta <= pcsSettings.targetDeltaMax &&
        !put.inTheMoney
      );
    });

    for (const shortPut of shortPutCandidates) {
      // Find corresponding long put
      const targetLongStrike = shortPut.strike - pcsSettings.spreadWidth;
      const longPut = chain.puts.find(
        (p) => Math.abs(p.strike - targetLongStrike) < 0.5 && !p.inTheMoney
      );

      if (!longPut) continue;

      // Check liquidity on both legs
      const shortSpread = calculateSpreadPct(shortPut.bid, shortPut.ask);
      const longSpread = calculateSpreadPct(longPut.bid, longPut.ask);
      if (
        shortSpread > settings.liquidityFilters.maxBidAskSpreadPct ||
        longSpread > settings.liquidityFilters.maxBidAskSpreadPct * 1.5
      ) {
        continue;
      }

      if (
        shortPut.openInterest < settings.liquidityFilters.minOptionOI ||
        longPut.openInterest < settings.liquidityFilters.minOptionOI / 2
      ) {
        continue;
      }

      const candidate = this.createCandidate(shortPut, longPut, context, dte);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    // Sort by score and return top candidates
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 3);
  }

  private createCandidate(
    shortPut: OptionContract,
    longPut: OptionContract,
    context: StrategyContext,
    dte: number
  ): StrategyCandidate | null {
    const { quote, settings, signals, regime } = context;
    const pcsSettings = settings.putCreditSpread;

    const shortMid = calculateMid(shortPut.bid, shortPut.ask);
    const longMid = calculateMid(longPut.bid, longPut.ask);
    const netCredit = (shortMid - longMid) * 100;

    // Minimum credit check
    if (netCredit < pcsSettings.minCredit * 100) return null;

    const spreadWidth = shortPut.strike - longPut.strike;
    const maxLoss = (spreadWidth * 100) - netCredit;
    const breakeven = shortPut.strike - (netCredit / 100);
    const buyingPower = maxLoss; // For defined risk, BP = max loss

    const annualizedReturn = calculateAnnualizedReturn(netCredit, maxLoss, dte);
    const roc = calculateROC(netCredit, buyingPower);
    const pop = shortPut.delta ? estimateProbabilityOfProfit(shortPut.delta) : 65;

    // Check risk limits
    const accountSize = settings.riskLimits.accountSize || 100000;
    const riskPct = (maxLoss / accountSize) * 100;
    if (riskPct > settings.riskLimits.maxRiskPerTradePct) {
      return null;
    }

    // Build reasons
    const reasons = [
      this.createReason(
        'Spread',
        'Net Credit',
        netCredit >= pcsSettings.minCredit * 100,
        `$${netCredit.toFixed(0)}`,
        `>= $${(pcsSettings.minCredit * 100).toFixed(0)}`,
        2
      ),
      this.createReason(
        'Liquidity',
        'Short Leg OI',
        shortPut.openInterest >= settings.liquidityFilters.minOptionOI,
        shortPut.openInterest,
        `>= ${settings.liquidityFilters.minOptionOI}`,
        1
      ),
      this.createReason(
        'Delta',
        'Short Delta',
        Math.abs(shortPut.delta || 0) >= pcsSettings.targetDeltaMin &&
          Math.abs(shortPut.delta || 0) <= pcsSettings.targetDeltaMax,
        shortPut.delta?.toFixed(2) || 'N/A',
        `-${pcsSettings.targetDeltaMin} to -${pcsSettings.targetDeltaMax}`,
        1.5
      ),
      this.createReason(
        'Premium',
        'Annualized Return',
        annualizedReturn >= 20,
        `${annualizedReturn.toFixed(1)}%`,
        '>= 20%',
        2
      ),
      this.createReason(
        'Volatility',
        'IV Elevated',
        (signals.ivRank || 50) >= 40,
        signals.ivRank !== null ? `${signals.ivRank}%` : 'N/A',
        '>= 40% (spreads benefit from elevated IV)',
        1.5
      ),
      this.createReason(
        'Risk',
        'Defined Risk',
        true,
        `$${maxLoss.toFixed(0)}`,
        'Max loss capped by long put',
        2
      ),
      this.createReason(
        'Buffer',
        'Buffer to Short Strike',
        ((quote.price - shortPut.strike) / quote.price) * 100 >= 3,
        `${(((quote.price - shortPut.strike) / quote.price) * 100).toFixed(1)}%`,
        '>= 3%',
        1
      ),
    ];

    // Build score components
    const scoreComponents = [
      this.createScoreComponent('Premium Yield', annualizedReturn, 0.25, 50),
      this.createScoreComponent('Liquidity', signals.liquidity.overallScore, 0.2, 100),
      this.createScoreComponent('IV Rank', signals.ivRank || 50, 0.15, 100),
      this.createScoreComponent(
        'Trend Alignment',
        signals.trend === 'strong_uptrend' ? 100 : signals.trend === 'uptrend' ? 80 : signals.trend === 'neutral' ? 60 : 30,
        0.2,
        100
      ),
      this.createScoreComponent(
        'Buffer Score',
        Math.min(100, ((quote.price - shortPut.strike) / quote.price) * 1000),
        0.1,
        100
      ),
      this.createScoreComponent(
        'Risk/Reward',
        (netCredit / maxLoss) * 100,
        0.1,
        50
      ),
    ];

    const score = Math.round(
      scoreComponents.reduce((sum, c) => sum + c.weightedScore, 0)
    );

    // Build option legs
    const legs: OptionLeg[] = [
      {
        action: 'sell',
        quantity: 1,
        option: shortPut,
        orderPrice: shortMid,
      },
      {
        action: 'buy',
        quantity: 1,
        option: longPut,
        orderPrice: longMid,
      },
    ];

    // Calculate conviction
    const conviction = this.calculateConviction(reasons, signals, regime);

    // Build exit rules
    const exitRules = {
      profitTargetPct: pcsSettings.profitTargetPct,
      maxLossPct: pcsSettings.maxLossPct,
      dteExit: 14,
      rollGuidance:
        'If tested (price approaching short strike), consider closing for a loss or rolling down and out for additional credit.',
    };

    // Build invalidation conditions
    const invalidationConditions = [
      {
        type: 'price_breach' as const,
        description: 'Price breaks below short put strike',
        threshold: `Price < $${shortPut.strike.toFixed(2)}`,
      },
      {
        type: 'trend_break' as const,
        description: 'Trend turns bearish',
        threshold: 'Downtrend confirmed',
      },
      {
        type: 'vol_spike' as const,
        description: 'Volatility spikes significantly',
        threshold: 'IV Rank > 85%',
      },
    ];

    const plainEnglishSummary = `Open a put credit spread on ${quote.symbol}: Sell the ${shortPut.expiration} $${shortPut.strike} put for $${shortMid.toFixed(2)} and buy the $${longPut.strike} put for $${longMid.toFixed(2)}. Net credit: $${(netCredit / 100).toFixed(2)} per share ($${netCredit.toFixed(0)} per contract). Maximum loss is $${maxLoss.toFixed(0)} if ${quote.symbol} falls below $${longPut.strike}. Breakeven at $${breakeven.toFixed(2)}.`;

    const learningNotes = [
      {
        topic: 'Why Put Credit Spread?',
        explanation: `A put credit spread is a defined-risk bullish strategy. Unlike a cash-secured put, your max loss is capped by the long put. This requires less capital and clearly defines your risk.`,
      },
      {
        topic: 'Spread Width of $${spreadWidth}',
        explanation: `The $${spreadWidth} width between strikes determines your max loss ($${maxLoss.toFixed(0)}). Wider spreads offer more premium but more risk. Narrower spreads are more conservative.`,
      },
      {
        topic: 'IV Benefits',
        explanation: `This spread was found when IV rank is ${signals.ivRank || 50}%. Higher IV means more premium for selling options. When IV drops, both legs benefit.`,
      },
      {
        topic: 'Managing the Trade',
        explanation: `Exit at ${pcsSettings.profitTargetPct}% profit (buy back for $${(netCredit * (1 - pcsSettings.profitTargetPct / 100) / 100).toFixed(2)}). If ${quote.symbol} drops toward $${shortPut.strike}, consider closing before max loss.`,
      },
    ];

    const orderTicketInstructions = `
## thinkorswim Order Ticket

1. Open Trade Tab → Options Chain → ${quote.symbol}
2. Select ${shortPut.expiration} expiration
3. Create vertical spread:
   - Right-click ${shortPut.strike} PUT → Sell → Vertical
   - Or manually: Sell ${shortPut.strike} PUT, Buy ${longPut.strike} PUT
4. Verify spread order:
   - SELL TO OPEN: ${shortPut.symbol}
   - BUY TO OPEN: ${longPut.symbol}
   - Net Credit: $${(netCredit / 100).toFixed(2)}
   - Price: LIMIT @ $${(netCredit / 100).toFixed(2)} credit
   - Duration: DAY
5. Review and confirm

Buying Power Reduction: $${maxLoss.toFixed(0)} (max loss)
`.trim();

    return {
      legs,
      netCredit,
      dte,
      riskBox: {
        maxProfit: netCredit,
        maxLoss,
        breakeven,
        breakevenLower: longPut.strike,
        breakevenUpper: null,
        buyingPowerRequired: maxLoss,
        collateralRequired: maxLoss,
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

/**
 * Call Credit Spread (Bear Call Spread) Strategy
 *
 * Sells a call at a lower strike and buys a call at a higher strike.
 * Profits when the stock stays below the short call strike.
 *
 * Best used in: Neutral to bearish markets with elevated IV
 * Risk: Defined - Max loss is (spread width - credit received) * 100
 */
export class CallCreditSpreadStrategy extends BaseStrategy {
  strategyType: StrategyType = 'call_credit_spread';
  name = 'Call Credit Spread';

  shouldConsider(context: StrategyContext): boolean {
    const { settings, signals, regime } = context;

    // Check if strategy is enabled
    if (!settings.callCreditSpread.enabled) return false;

    // Check liquidity minimum
    if (!signals.liquidity.meetsMinimum) return false;

    // Check earnings exclusion
    if (signals.earningsProximity.withinExclusionWindow) return false;

    // Prefer elevated volatility for spreads
    if (
      settings.preferredVolRegimes.length > 0 &&
      !settings.preferredVolRegimes.includes(signals.volatility)
    ) {
      return false;
    }

    // Avoid strong uptrends
    if (signals.trend === 'strong_uptrend') return false;

    return true;
  }

  findCandidates(context: StrategyContext): StrategyCandidate[] {
    const { quote, chain, settings, signals, regime } = context;
    const candidates: StrategyCandidate[] = [];
    const ccsSettings = settings.callCreditSpread;

    const dte = calculateDTE(chain.expiration);

    // Check DTE range
    if (dte < ccsSettings.minDTE || dte > ccsSettings.maxDTE) {
      return candidates;
    }

    // Find short call candidates
    const shortCallCandidates = chain.calls.filter((call) => {
      if (call.delta === null) return false;
      const delta = call.delta;
      return (
        delta >= ccsSettings.targetDeltaMin &&
        delta <= ccsSettings.targetDeltaMax &&
        !call.inTheMoney
      );
    });

    for (const shortCall of shortCallCandidates) {
      // Find corresponding long call
      const targetLongStrike = shortCall.strike + ccsSettings.spreadWidth;
      const longCall = chain.calls.find(
        (c) => Math.abs(c.strike - targetLongStrike) < 0.5 && !c.inTheMoney
      );

      if (!longCall) continue;

      // Check liquidity on both legs
      const shortSpread = calculateSpreadPct(shortCall.bid, shortCall.ask);
      const longSpread = calculateSpreadPct(longCall.bid, longCall.ask);
      if (
        shortSpread > settings.liquidityFilters.maxBidAskSpreadPct ||
        longSpread > settings.liquidityFilters.maxBidAskSpreadPct * 1.5
      ) {
        continue;
      }

      if (
        shortCall.openInterest < settings.liquidityFilters.minOptionOI ||
        longCall.openInterest < settings.liquidityFilters.minOptionOI / 2
      ) {
        continue;
      }

      const candidate = this.createCandidate(shortCall, longCall, context, dte);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    // Sort by score and return top candidates
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 3);
  }

  private createCandidate(
    shortCall: OptionContract,
    longCall: OptionContract,
    context: StrategyContext,
    dte: number
  ): StrategyCandidate | null {
    const { quote, settings, signals, regime } = context;
    const ccsSettings = settings.callCreditSpread;

    const shortMid = calculateMid(shortCall.bid, shortCall.ask);
    const longMid = calculateMid(longCall.bid, longCall.ask);
    const netCredit = (shortMid - longMid) * 100;

    // Minimum credit check
    if (netCredit < ccsSettings.minCredit * 100) return null;

    const spreadWidth = longCall.strike - shortCall.strike;
    const maxLoss = (spreadWidth * 100) - netCredit;
    const breakeven = shortCall.strike + (netCredit / 100);
    const buyingPower = maxLoss;

    const annualizedReturn = calculateAnnualizedReturn(netCredit, maxLoss, dte);
    const roc = calculateROC(netCredit, buyingPower);
    const pop = shortCall.delta ? 100 - (shortCall.delta * 100) : 65;

    // Check risk limits
    const accountSize = settings.riskLimits.accountSize || 100000;
    const riskPct = (maxLoss / accountSize) * 100;
    if (riskPct > settings.riskLimits.maxRiskPerTradePct) {
      return null;
    }

    // Build reasons
    const reasons = [
      this.createReason(
        'Spread',
        'Net Credit',
        netCredit >= ccsSettings.minCredit * 100,
        `$${netCredit.toFixed(0)}`,
        `>= $${(ccsSettings.minCredit * 100).toFixed(0)}`,
        2
      ),
      this.createReason(
        'Liquidity',
        'Short Leg OI',
        shortCall.openInterest >= settings.liquidityFilters.minOptionOI,
        shortCall.openInterest,
        `>= ${settings.liquidityFilters.minOptionOI}`,
        1
      ),
      this.createReason(
        'Delta',
        'Short Delta',
        (shortCall.delta || 0) >= ccsSettings.targetDeltaMin &&
          (shortCall.delta || 0) <= ccsSettings.targetDeltaMax,
        shortCall.delta?.toFixed(2) || 'N/A',
        `${ccsSettings.targetDeltaMin} to ${ccsSettings.targetDeltaMax}`,
        1.5
      ),
      this.createReason(
        'Premium',
        'Annualized Return',
        annualizedReturn >= 20,
        `${annualizedReturn.toFixed(1)}%`,
        '>= 20%',
        2
      ),
      this.createReason(
        'Volatility',
        'IV Elevated',
        (signals.ivRank || 50) >= 40,
        signals.ivRank !== null ? `${signals.ivRank}%` : 'N/A',
        '>= 40%',
        1.5
      ),
      this.createReason(
        'Risk',
        'Defined Risk',
        true,
        `$${maxLoss.toFixed(0)}`,
        'Max loss capped by long call',
        2
      ),
      this.createReason(
        'Buffer',
        'Buffer to Short Strike',
        ((shortCall.strike - quote.price) / quote.price) * 100 >= 3,
        `${(((shortCall.strike - quote.price) / quote.price) * 100).toFixed(1)}%`,
        '>= 3%',
        1
      ),
    ];

    // Build score components
    const scoreComponents = [
      this.createScoreComponent('Premium Yield', annualizedReturn, 0.25, 50),
      this.createScoreComponent('Liquidity', signals.liquidity.overallScore, 0.2, 100),
      this.createScoreComponent('IV Rank', signals.ivRank || 50, 0.15, 100),
      this.createScoreComponent(
        'Trend Alignment',
        signals.trend === 'strong_downtrend' ? 100 : signals.trend === 'downtrend' ? 80 : signals.trend === 'neutral' ? 70 : 40,
        0.2,
        100
      ),
      this.createScoreComponent(
        'Buffer Score',
        Math.min(100, ((shortCall.strike - quote.price) / quote.price) * 1000),
        0.1,
        100
      ),
      this.createScoreComponent(
        'Risk/Reward',
        (netCredit / maxLoss) * 100,
        0.1,
        50
      ),
    ];

    const score = Math.round(
      scoreComponents.reduce((sum, c) => sum + c.weightedScore, 0)
    );

    // Build option legs
    const legs: OptionLeg[] = [
      {
        action: 'sell',
        quantity: 1,
        option: shortCall,
        orderPrice: shortMid,
      },
      {
        action: 'buy',
        quantity: 1,
        option: longCall,
        orderPrice: longMid,
      },
    ];

    // Calculate conviction
    const conviction = this.calculateConviction(reasons, signals, regime);

    // Build exit rules
    const exitRules = {
      profitTargetPct: ccsSettings.profitTargetPct,
      maxLossPct: ccsSettings.maxLossPct,
      dteExit: 14,
      rollGuidance:
        'If tested (price approaching short strike), consider closing for a loss or rolling up and out for additional credit.',
    };

    // Build invalidation conditions
    const invalidationConditions = [
      {
        type: 'price_breach' as const,
        description: 'Price breaks above short call strike',
        threshold: `Price > $${shortCall.strike.toFixed(2)}`,
      },
      {
        type: 'trend_break' as const,
        description: 'Trend turns strongly bullish',
        threshold: 'Strong uptrend confirmed',
      },
      {
        type: 'vol_spike' as const,
        description: 'Volatility spikes significantly',
        threshold: 'IV Rank > 85%',
      },
    ];

    const plainEnglishSummary = `Open a call credit spread on ${quote.symbol}: Sell the ${shortCall.expiration} $${shortCall.strike} call for $${shortMid.toFixed(2)} and buy the $${longCall.strike} call for $${longMid.toFixed(2)}. Net credit: $${(netCredit / 100).toFixed(2)} per share ($${netCredit.toFixed(0)} per contract). Maximum loss is $${maxLoss.toFixed(0)} if ${quote.symbol} rises above $${longCall.strike}. Breakeven at $${breakeven.toFixed(2)}.`;

    const learningNotes = [
      {
        topic: 'Why Call Credit Spread?',
        explanation: `A call credit spread is a defined-risk bearish/neutral strategy. You profit when the stock stays below your short call strike. Risk is capped by the long call.`,
      },
      {
        topic: 'Spread Width of $${spreadWidth}',
        explanation: `The $${spreadWidth} width between strikes determines your max loss ($${maxLoss.toFixed(0)}). Wider spreads offer more premium but more risk.`,
      },
      {
        topic: 'IV Benefits',
        explanation: `This spread was found when IV rank is ${signals.ivRank || 50}%. Higher IV means more premium for selling options.`,
      },
      {
        topic: 'Managing the Trade',
        explanation: `Exit at ${ccsSettings.profitTargetPct}% profit. If ${quote.symbol} rises toward $${shortCall.strike}, consider closing before max loss hits.`,
      },
    ];

    const orderTicketInstructions = `
## thinkorswim Order Ticket

1. Open Trade Tab → Options Chain → ${quote.symbol}
2. Select ${shortCall.expiration} expiration
3. Create vertical spread:
   - Right-click ${shortCall.strike} CALL → Sell → Vertical
   - Or manually: Sell ${shortCall.strike} CALL, Buy ${longCall.strike} CALL
4. Verify spread order:
   - SELL TO OPEN: ${shortCall.symbol}
   - BUY TO OPEN: ${longCall.symbol}
   - Net Credit: $${(netCredit / 100).toFixed(2)}
   - Price: LIMIT @ $${(netCredit / 100).toFixed(2)} credit
   - Duration: DAY
5. Review and confirm

Buying Power Reduction: $${maxLoss.toFixed(0)} (max loss)
`.trim();

    return {
      legs,
      netCredit,
      dte,
      riskBox: {
        maxProfit: netCredit,
        maxLoss,
        breakeven,
        breakevenLower: null,
        breakevenUpper: longCall.strike,
        buyingPowerRequired: maxLoss,
        collateralRequired: maxLoss,
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
