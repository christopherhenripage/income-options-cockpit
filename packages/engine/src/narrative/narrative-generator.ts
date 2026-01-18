import {
  MarketNarrative,
  MarketRegime,
  StrategyType,
  TrendRegime,
  VolatilityRegime,
} from '../types';
import { generateId, getCurrentTimestamp, getCurrentDateString } from '../utils';

/**
 * Generates market narrative from regime data
 */
export class NarrativeGenerator {
  /**
   * Generate a complete market narrative
   */
  generateNarrative(
    regime: MarketRegime,
    workspaceId: string
  ): MarketNarrative {
    const title = this.generateTitle(regime);
    const summary = this.generateSummary(regime);
    const trendAnalysis = this.analyzeTrend(regime);
    const volatilityAnalysis = this.analyzeVolatility(regime);
    const breadthAnalysis = this.analyzeBreadth(regime);
    const leadershipAnalysis = this.analyzeLeadership(regime);
    const strategyImplications = this.analyzeStrategyImplications(regime);
    const preferredStrategies = this.getPreferredStrategies(regime);
    const cautionFlags = this.getCautionFlags(regime);

    return {
      id: generateId(),
      workspaceId,
      date: getCurrentDateString(),
      createdAt: getCurrentTimestamp(),
      title,
      regime,
      summary,
      trendAnalysis,
      volatilityAnalysis,
      breadthAnalysis,
      leadershipAnalysis,
      strategyImplications,
      preferredStrategies,
      cautionFlags,
      dataQuality: regime.dataQuality,
    };
  }

  private generateTitle(regime: MarketRegime): string {
    const trendLabel = this.getTrendLabel(regime.trend);
    const volLabel = this.getVolLabel(regime.volatility);
    return `${trendLabel} with ${volLabel} - ${this.getRiskLabel(regime.riskOnOff)}`;
  }

  private getTrendLabel(trend: TrendRegime): string {
    switch (trend) {
      case 'strong_uptrend':
        return 'Strong Uptrend';
      case 'uptrend':
        return 'Uptrend';
      case 'neutral':
        return 'Range-Bound Market';
      case 'downtrend':
        return 'Downtrend';
      case 'strong_downtrend':
        return 'Strong Downtrend';
    }
  }

  private getVolLabel(vol: VolatilityRegime): string {
    switch (vol) {
      case 'low':
        return 'Low Volatility';
      case 'normal':
        return 'Normal Volatility';
      case 'elevated':
        return 'Elevated Volatility';
      case 'high':
        return 'High Volatility';
      case 'panic':
        return 'Panic Volatility';
    }
  }

  private getRiskLabel(risk: 'risk_on' | 'neutral' | 'risk_off'): string {
    switch (risk) {
      case 'risk_on':
        return 'Risk-On Environment';
      case 'neutral':
        return 'Neutral Environment';
      case 'risk_off':
        return 'Risk-Off Environment';
    }
  }

  private generateSummary(regime: MarketRegime): string {
    const parts: string[] = [];

    // Trend summary
    if (regime.trend === 'strong_uptrend' || regime.trend === 'uptrend') {
      parts.push(
        'Markets are trending higher with SPY trading above key moving averages.'
      );
    } else if (regime.trend === 'neutral') {
      parts.push(
        'Markets are consolidating in a range-bound pattern.'
      );
    } else {
      parts.push(
        'Markets are facing selling pressure with prices below key moving averages.'
      );
    }

    // Volatility summary
    if (regime.volatility === 'low' || regime.volatility === 'normal') {
      parts.push('Volatility remains contained, suggesting orderly market conditions.');
    } else if (regime.volatility === 'elevated') {
      parts.push('Volatility is elevated, which increases option premiums but also risk.');
    } else {
      parts.push(
        'Volatility is significantly elevated, indicating heightened uncertainty and risk.'
      );
    }

    // Breadth summary
    if (regime.breadth.assessment === 'strong' || regime.breadth.assessment === 'healthy') {
      parts.push('Market breadth is healthy with broad participation across the universe.');
    } else if (regime.breadth.assessment === 'mixed') {
      parts.push('Market breadth is mixed, suggesting selective opportunities.');
    } else {
      parts.push('Market breadth is weak, indicating limited participation.');
    }

    return parts.join(' ');
  }

  private analyzeTrend(regime: MarketRegime): string {
    const { trend } = regime;

    if (trend === 'strong_uptrend') {
      return `SPY is in a strong uptrend, trading well above both the 50-day and 200-day moving averages. The 50-day MA is above the 200-day MA, confirming the bullish structure. This environment favors cash-secured puts and bullish credit spreads, as the probability of prices continuing higher is elevated. However, be cautious of selling calls too aggressively as strong uptrends can accelerate.`;
    } else if (trend === 'uptrend') {
      return `SPY is in a confirmed uptrend, with price above the 50-day moving average. The trend structure remains constructive, though momentum may be moderating from recent highs. This is a supportive environment for income strategies, particularly cash-secured puts on pullbacks to support levels.`;
    } else if (trend === 'neutral') {
      return `SPY is range-bound, trading between the 50-day and 200-day moving averages. This consolidation phase can persist, making it suitable for both put credit spreads below support and call credit spreads above resistance. Focus on mean-reversion strategies and defined-risk positions.`;
    } else if (trend === 'downtrend') {
      return `SPY is in a downtrend, trading below the 50-day moving average. Caution is warranted for bullish positions. Consider call credit spreads for bearish exposure, or wait for stabilization before selling puts. Quality and selectivity become paramount.`;
    } else {
      return `SPY is in a strong downtrend, trading well below both major moving averages. This is a challenging environment for income strategies. Consider reduced position sizes, wider buffers, or staying on the sidelines until the trend stabilizes. Capital preservation should be the priority.`;
    }
  }

  private analyzeVolatility(regime: MarketRegime): string {
    const { volatility } = regime;

    if (volatility === 'low') {
      return `Volatility is compressed (low IV rank), meaning option premiums are relatively cheap. While this reduces income potential, it also means lower risk of large moves. Consider using strategies with longer DTE to capture more time value, or wait for a volatility uptick before deploying new positions.`;
    } else if (volatility === 'normal') {
      return `Volatility is in a normal range, providing balanced risk/reward for option sellers. This is often the ideal environment for consistent income generation. Standard position sizing and DTE ranges are appropriate.`;
    } else if (volatility === 'elevated') {
      return `Volatility is elevated, which increases option premiums and income potential. This benefits option sellers, but also signals increased market uncertainty. Consider tighter risk management, smaller position sizes, and wider buffers to your short strikes.`;
    } else if (volatility === 'high') {
      return `Volatility is high, with IV rank above the 60th percentile. Premiums are attractive for sellers, but large price swings are more likely. Use defined-risk strategies (credit spreads) over naked positions, and maintain strict adherence to position limits.`;
    } else {
      return `Volatility is at panic levels. While premiums are very rich, this environment carries extreme risk. Consider staying on the sidelines or using very small position sizes with maximum buffer. Only the most conservative defined-risk strategies should be considered.`;
    }
  }

  private analyzeBreadth(regime: MarketRegime): string {
    const { breadth } = regime;
    const { assessment, percentAbove50MA, advDecRatio } = breadth;

    let analysis = '';

    if (assessment === 'strong') {
      analysis = `Market breadth is strong, with widespread participation across the universe. `;
      if (percentAbove50MA !== null) {
        analysis += `${percentAbove50MA.toFixed(0)}% of tracked symbols are above their 50-day moving average. `;
      }
      analysis += `This broad strength supports bullish income strategies and suggests lower risk of sudden reversals.`;
    } else if (assessment === 'healthy') {
      analysis = `Market breadth is healthy, indicating solid but not exceptional participation. `;
      if (percentAbove50MA !== null) {
        analysis += `${percentAbove50MA.toFixed(0)}% of symbols are above their 50-day MA. `;
      }
      analysis += `Continue with normal income strategies but remain selective on individual positions.`;
    } else if (assessment === 'mixed') {
      analysis = `Market breadth is mixed, suggesting a market of stocks rather than a stock market. `;
      if (advDecRatio !== null) {
        analysis += `The advance/decline ratio is ${advDecRatio.toFixed(2)}. `;
      }
      analysis += `Focus on the strongest individual setups and be more selective with position entry.`;
    } else if (assessment === 'weak') {
      analysis = `Market breadth is weak, with limited participation. `;
      if (percentAbove50MA !== null) {
        analysis += `Only ${percentAbove50MA.toFixed(0)}% of symbols are above their 50-day MA. `;
      }
      analysis += `Exercise caution with new positions. The narrow leadership increases risk of sudden market-wide selling.`;
    } else {
      analysis = `Market breadth is very weak, a warning sign for equity positions. `;
      analysis += `Consider reducing exposure and focusing only on the highest-conviction, most liquid opportunities.`;
    }

    return analysis;
  }

  private analyzeLeadership(regime: MarketRegime): string | null {
    if (!regime.leadership || regime.leadership.sectors.length === 0) {
      return null;
    }

    const { sectors } = regime.leadership;
    const leaders = sectors.filter((s) => s.trendScore > 20);
    const laggards = sectors.filter((s) => s.trendScore < -20);

    let analysis = 'Sector Analysis: ';

    if (leaders.length > 0) {
      const leaderNames = leaders.slice(0, 3).map((s) => s.name).join(', ');
      analysis += `Leading sectors include ${leaderNames}. `;
    }

    if (laggards.length > 0) {
      const laggardNames = laggards.slice(0, 3).map((s) => s.name).join(', ');
      analysis += `Lagging sectors include ${laggardNames}. `;
    }

    // Investment implications
    if (leaders.length > laggards.length) {
      analysis += `The leadership pattern suggests a constructive market environment. Focus income strategies on leading sectors for higher probability setups.`;
    } else if (laggards.length > leaders.length) {
      analysis += `The weak sector rotation suggests defensive positioning. Consider sector ETFs in leading groups for income strategies.`;
    } else {
      analysis += `Mixed sector performance suggests selective positioning based on individual symbol analysis.`;
    }

    return analysis;
  }

  private analyzeStrategyImplications(regime: MarketRegime): string {
    const parts: string[] = [];

    // Based on trend
    if (regime.trend === 'strong_uptrend' || regime.trend === 'uptrend') {
      parts.push(
        'The uptrend favors CASH-SECURED PUTS on quality names, collecting premium while potentially acquiring shares at a discount.'
      );
      if (regime.volatility === 'elevated' || regime.volatility === 'high') {
        parts.push(
          'Elevated volatility in an uptrend creates attractive PUT CREDIT SPREAD opportunities with rich premiums.'
        );
      }
    } else if (regime.trend === 'neutral') {
      parts.push(
        'Range-bound conditions favor both PUT CREDIT SPREADS below support and CALL CREDIT SPREADS above resistance.'
      );
      parts.push(
        'COVERED CALLS work well in sideways markets for existing positions.'
      );
    } else {
      parts.push(
        'The downtrend suggests caution with bullish strategies. CALL CREDIT SPREADS become more attractive.'
      );
      parts.push(
        'If selling puts, use wider buffers and smaller sizes. Defined-risk spreads preferred over naked positions.'
      );
    }

    // Based on volatility
    if (regime.volatility === 'low') {
      parts.push(
        'Low volatility compresses premiums; consider longer DTE positions (45+ days) to capture more time value.'
      );
    } else if (regime.volatility === 'high' || regime.volatility === 'panic') {
      parts.push(
        'High volatility inflates premiums but increases risk. Stick to defined-risk strategies and maintain strict position limits.'
      );
    }

    // Risk environment
    if (regime.riskOnOff === 'risk_off') {
      parts.push(
        'The risk-off environment warrants defensive positioning. Prioritize capital preservation over income generation.'
      );
    }

    return parts.join(' ');
  }

  private getPreferredStrategies(regime: MarketRegime): StrategyType[] {
    const strategies: StrategyType[] = [];

    // Based on trend
    if (regime.trend === 'strong_uptrend' || regime.trend === 'uptrend') {
      strategies.push('cash_secured_put');
      if (regime.volatility === 'elevated' || regime.volatility === 'high') {
        strategies.push('put_credit_spread');
      }
    } else if (regime.trend === 'neutral') {
      strategies.push('put_credit_spread');
      strategies.push('call_credit_spread');
      strategies.push('covered_call');
    } else {
      strategies.push('call_credit_spread');
      // Still allow CSP but with caution
      if (regime.volatility === 'high' || regime.volatility === 'panic') {
        strategies.push('put_credit_spread'); // Rich premiums
      }
    }

    // Always allow covered calls if you own shares
    if (!strategies.includes('covered_call')) {
      strategies.push('covered_call');
    }

    return strategies;
  }

  private getCautionFlags(regime: MarketRegime): string[] {
    const flags: string[] = [];

    if (regime.trend === 'strong_downtrend') {
      flags.push('Strong downtrend - exercise extreme caution with bullish positions');
    }

    if (regime.volatility === 'panic') {
      flags.push('Panic volatility - large moves likely, consider staying on sidelines');
    } else if (regime.volatility === 'high') {
      flags.push('High volatility - use reduced position sizes and wider buffers');
    }

    if (regime.riskOnOff === 'risk_off') {
      flags.push('Risk-off environment - prioritize capital preservation');
    }

    if (regime.breadth.assessment === 'very_weak') {
      flags.push('Very weak breadth - narrow market increases reversal risk');
    }

    if (regime.dataQuality && !regime.dataQuality.hasFullData) {
      flags.push(
        `Incomplete data - missing: ${regime.dataQuality.missingFields.join(', ')}`
      );
    }

    return flags;
  }
}
