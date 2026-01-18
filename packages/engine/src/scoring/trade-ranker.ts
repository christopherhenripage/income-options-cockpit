import { TradePacket, TradingSettings } from '../types';

/**
 * Ranks and filters trade packets based on various criteria
 */
export class TradeRanker {
  /**
   * Rank trades by score (descending)
   */
  rankByScore(packets: TradePacket[]): TradePacket[] {
    return [...packets].sort((a, b) => b.score - a.score);
  }

  /**
   * Filter trades that pass minimum score threshold
   */
  filterByMinScore(packets: TradePacket[], minScore: number): TradePacket[] {
    return packets.filter((p) => p.score >= minScore);
  }

  /**
   * Get top N trades per strategy type
   */
  getTopPerStrategy(
    packets: TradePacket[],
    topN: number = 3
  ): TradePacket[] {
    const byStrategy = new Map<string, TradePacket[]>();

    for (const packet of packets) {
      const existing = byStrategy.get(packet.strategyType) || [];
      existing.push(packet);
      byStrategy.set(packet.strategyType, existing);
    }

    const result: TradePacket[] = [];
    for (const [, strategyPackets] of byStrategy) {
      const sorted = this.rankByScore(strategyPackets);
      result.push(...sorted.slice(0, topN));
    }

    return this.rankByScore(result);
  }

  /**
   * Diversify trades by symbol (limit per symbol)
   */
  diversifyBySymbol(
    packets: TradePacket[],
    maxPerSymbol: number = 2
  ): TradePacket[] {
    const bySymbol = new Map<string, number>();
    const result: TradePacket[] = [];

    for (const packet of this.rankByScore(packets)) {
      const count = bySymbol.get(packet.symbol) || 0;
      if (count < maxPerSymbol) {
        result.push(packet);
        bySymbol.set(packet.symbol, count + 1);
      }
    }

    return result;
  }

  /**
   * Filter out trades that exceed total risk budget
   */
  filterByRiskBudget(
    packets: TradePacket[],
    settings: TradingSettings
  ): TradePacket[] {
    const accountSize = settings.riskLimits.accountSize || 100000;
    const maxTotalRisk = (accountSize * settings.riskLimits.maxTotalRiskPct) / 100;

    const result: TradePacket[] = [];
    let totalRisk = 0;

    for (const packet of this.rankByScore(packets)) {
      const packetRisk = packet.riskBox.maxLoss;
      if (totalRisk + packetRisk <= maxTotalRisk) {
        result.push(packet);
        totalRisk += packetRisk;
      }
    }

    return result;
  }

  /**
   * Apply all filters and return final ranked list
   */
  applyAllFilters(
    packets: TradePacket[],
    settings: TradingSettings,
    options: {
      minScore?: number;
      topPerStrategy?: number;
      maxPerSymbol?: number;
      applyRiskBudget?: boolean;
    } = {}
  ): TradePacket[] {
    const {
      minScore = 40,
      topPerStrategy = 3,
      maxPerSymbol = 2,
      applyRiskBudget = true,
    } = options;

    let result = packets;

    // Filter by minimum score
    result = this.filterByMinScore(result, minScore);

    // Get top per strategy
    result = this.getTopPerStrategy(result, topPerStrategy);

    // Diversify by symbol
    result = this.diversifyBySymbol(result, maxPerSymbol);

    // Apply risk budget
    if (applyRiskBudget) {
      result = this.filterByRiskBudget(result, settings);
    }

    return result;
  }

  /**
   * Calculate aggregate statistics for a set of trade packets
   */
  calculateStats(packets: TradePacket[]): {
    count: number;
    avgScore: number;
    totalMaxProfit: number;
    totalMaxLoss: number;
    avgConviction: number;
    avgUncertainty: number;
    byStrategy: Record<string, number>;
    bySymbol: Record<string, number>;
  } {
    if (packets.length === 0) {
      return {
        count: 0,
        avgScore: 0,
        totalMaxProfit: 0,
        totalMaxLoss: 0,
        avgConviction: 0,
        avgUncertainty: 0,
        byStrategy: {},
        bySymbol: {},
      };
    }

    const byStrategy: Record<string, number> = {};
    const bySymbol: Record<string, number> = {};

    let totalScore = 0;
    let totalMaxProfit = 0;
    let totalMaxLoss = 0;
    let totalConviction = 0;
    let totalUncertainty = 0;

    for (const packet of packets) {
      totalScore += packet.score;
      totalMaxProfit += packet.riskBox.maxProfit;
      totalMaxLoss += packet.riskBox.maxLoss;
      totalConviction += packet.conviction.confidence;
      totalUncertainty += packet.conviction.uncertainty;

      byStrategy[packet.strategyType] = (byStrategy[packet.strategyType] || 0) + 1;
      bySymbol[packet.symbol] = (bySymbol[packet.symbol] || 0) + 1;
    }

    return {
      count: packets.length,
      avgScore: Math.round(totalScore / packets.length),
      totalMaxProfit,
      totalMaxLoss,
      avgConviction: Math.round(totalConviction / packets.length),
      avgUncertainty: Math.round(totalUncertainty / packets.length),
      byStrategy,
      bySymbol,
    };
  }
}
