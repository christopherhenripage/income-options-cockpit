import {
  MarketDataProvider,
  SymbolSignals,
  TradingSettings,
} from '../types';
import {
  calculateMovingAverages,
  determineTrendRegime,
  determineVolatilityRegime,
  calculateHistoricalVolatility,
  scoreLiquidity,
  calculateSpreadPct,
  getCurrentTimestamp,
  isWithinTradingDays,
} from '../utils';

/**
 * Analyzes individual symbols for trading signals
 */
export class SymbolAnalyzer {
  constructor(private provider: MarketDataProvider) {}

  /**
   * Compute signals for a single symbol
   */
  async analyzeSymbol(
    symbol: string,
    settings: TradingSettings,
    earningsDate: string | null = null
  ): Promise<SymbolSignals> {
    // Fetch all required data in parallel
    const [quote, history, volData, expirations] = await Promise.all([
      this.provider.getQuote(symbol),
      this.provider.getHistoricalPrices(symbol, '1Y'),
      this.provider.getVolatilityData(symbol),
      this.provider.getOptionExpirations(symbol),
    ]);

    // Calculate trend
    const mas = calculateMovingAverages(history);
    const trend = determineTrendRegime(quote.price, mas.ma50, mas.ma200);

    // Calculate volatility regime
    const hv20 = calculateHistoricalVolatility(history, 20);
    const volRegime = determineVolatilityRegime(
      volData.ivRank,
      volData.currentIV,
      hv20
    );

    // Calculate liquidity scores
    // Get a sample option chain to assess liquidity
    let liquidityResult = {
      volumeScore: 0,
      optionOIScore: 0,
      spreadScore: 0,
      overallScore: 0,
      meetsMinimum: false,
    };

    if (expirations.length > 0) {
      try {
        // Find an expiration around 30 DTE for liquidity check
        const targetExp = expirations.find((exp) => {
          const dte = Math.ceil(
            (new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return dte >= 21 && dte <= 45;
        }) || expirations[0];

        const chain = await this.provider.getOptionChain(symbol, targetExp);

        // Find ATM options (more lenient matching for real data)
        const atmStrike = quote.price;
        // Find closest put to ATM
        const atmPut = chain.puts.length > 0
          ? chain.puts.reduce((prev, curr) =>
              Math.abs(curr.strike - atmStrike) < Math.abs(prev.strike - atmStrike) ? curr : prev
            )
          : null;
        // Find closest call to ATM
        const atmCall = chain.calls.length > 0
          ? chain.calls.reduce((prev, curr) =>
              Math.abs(curr.strike - atmStrike) < Math.abs(prev.strike - atmStrike) ? curr : prev
            )
          : null;

        if (atmPut || atmCall) {
          // Handle cases where only put or call is available
          const putVolume = atmPut?.volume || 0;
          const callVolume = atmCall?.volume || 0;
          const putOI = atmPut?.openInterest || 0;
          const callOI = atmCall?.openInterest || 0;
          const putSpread = atmPut ? calculateSpreadPct(atmPut.bid, atmPut.ask) : 10;
          const callSpread = atmCall ? calculateSpreadPct(atmCall.bid, atmCall.ask) : 10;

          const count = (atmPut ? 1 : 0) + (atmCall ? 1 : 0);
          const avgVolume = Math.round((putVolume + callVolume) / count);
          const avgOI = Math.round((putOI + callOI) / count);
          const avgSpread = (putSpread + callSpread) / count;

          liquidityResult = scoreLiquidity(
            avgVolume,
            avgOI,
            avgSpread,
            settings.liquidityFilters.minOptionVolume,
            settings.liquidityFilters.minOptionOI,
            settings.liquidityFilters.maxBidAskSpreadPct
          );

          // Add volume score based on underlying volume
          liquidityResult.volumeScore = Math.min(
            100,
            (quote.avgVolume / settings.liquidityFilters.minUnderlyingVolume) * 20
          );
        }
      } catch {
        // Keep default low liquidity scores
      }
    }

    // Check earnings proximity
    const withinExclusionWindow = earningsDate
      ? isWithinTradingDays(earningsDate, settings.earningsExclusionDays)
      : false;

    const daysToEarnings = earningsDate
      ? Math.ceil(
          (new Date(earningsDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      symbol,
      trend: trend.regime,
      trendScore: trend.score,
      ma50: mas.ma50 || 0,
      ma200: mas.ma200 || 0,
      priceVsMa50Pct: mas.ma50
        ? ((quote.price - mas.ma50) / mas.ma50) * 100
        : 0,
      priceVsMa200Pct: mas.ma200
        ? ((quote.price - mas.ma200) / mas.ma200) * 100
        : 0,
      volatility: volRegime,
      ivRank: volData.ivRank,
      liquidity: {
        volumeScore: liquidityResult.volumeScore,
        optionOIScore: liquidityResult.optionOIScore,
        spreadScore: liquidityResult.spreadScore,
        overallScore: liquidityResult.overallScore,
        meetsMinimum: liquidityResult.meetsMinimum,
      },
      earningsProximity: {
        daysToEarnings,
        withinExclusionWindow,
      },
      computedAt: getCurrentTimestamp(),
    };
  }

  /**
   * Batch analyze multiple symbols
   */
  async analyzeSymbols(
    symbols: string[],
    settings: TradingSettings,
    earningsDates: Map<string, string | null> = new Map()
  ): Promise<Map<string, SymbolSignals>> {
    const results = new Map<string, SymbolSignals>();

    // Process in batches to avoid overwhelming the provider
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const analyses = await Promise.all(
        batch.map((symbol) =>
          this.analyzeSymbol(
            symbol,
            settings,
            earningsDates.get(symbol) || null
          ).catch((err) => {
            console.warn(`Failed to analyze ${symbol}:`, err);
            return null;
          })
        )
      );

      for (const analysis of analyses) {
        if (analysis) {
          results.set(analysis.symbol, analysis);
        }
      }
    }

    return results;
  }
}
