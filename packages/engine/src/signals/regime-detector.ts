import {
  MarketDataProvider,
  MarketRegime,
  TrendRegime,
  VolatilityRegime,
  Quote,
} from '../types';
import {
  calculateMovingAverages,
  calculateHistoricalVolatility,
  determineTrendRegime,
  determineVolatilityRegime,
  getCurrentTimestamp,
} from '../utils';

const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLF', name: 'Financials' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLV', name: 'Healthcare' },
  { symbol: 'XLY', name: 'Consumer Discretionary' },
  { symbol: 'XLP', name: 'Consumer Staples' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLU', name: 'Utilities' },
];

/**
 * Detects market regime based on SPY/QQQ trends and volatility
 */
export class RegimeDetector {
  constructor(private provider: MarketDataProvider) {}

  /**
   * Compute the overall market regime
   */
  async computeMarketRegime(
    universeSymbols: string[]
  ): Promise<MarketRegime> {
    const missingFields: string[] = [];

    // Get SPY data for primary trend
    const [spyHistory, spyQuote, spyVol] = await Promise.all([
      this.provider.getHistoricalPrices('SPY', '1Y'),
      this.provider.getQuote('SPY'),
      this.provider.getVolatilityData('SPY'),
    ]);

    // Calculate SPY trend
    const spyMAs = calculateMovingAverages(spyHistory);
    const spyTrend = determineTrendRegime(
      spyQuote.price,
      spyMAs.ma50,
      spyMAs.ma200
    );

    // Calculate volatility regime
    const hv20 = calculateHistoricalVolatility(spyHistory, 20);
    const volRegime = determineVolatilityRegime(
      spyVol.ivRank,
      spyVol.currentIV,
      hv20
    );

    if (spyVol.ivRank === null) {
      missingFields.push('ivRank');
    }

    // Determine risk-on/off
    let riskOnOff: 'risk_on' | 'neutral' | 'risk_off';
    if (
      spyTrend.regime === 'strong_uptrend' ||
      spyTrend.regime === 'uptrend'
    ) {
      riskOnOff =
        volRegime === 'low' || volRegime === 'normal' ? 'risk_on' : 'neutral';
    } else if (
      spyTrend.regime === 'strong_downtrend' ||
      spyTrend.regime === 'downtrend'
    ) {
      riskOnOff = 'risk_off';
    } else {
      riskOnOff = volRegime === 'high' || volRegime === 'panic' ? 'risk_off' : 'neutral';
    }

    // Calculate breadth using universe
    const breadthResult = await this.calculateBreadth(universeSymbols);

    // Calculate sector leadership
    const leadership = await this.calculateLeadership();

    return {
      trend: spyTrend.regime,
      volatility: volRegime,
      riskOnOff,
      breadth: breadthResult,
      leadership,
      computedAt: getCurrentTimestamp(),
      dataQuality: {
        hasFullData: missingFields.length === 0,
        missingFields,
        dataSource: this.provider.name,
      },
    };
  }

  /**
   * Calculate market breadth from universe
   */
  private async calculateBreadth(
    symbols: string[]
  ): Promise<MarketRegime['breadth']> {
    let advancing = 0;
    let declining = 0;
    let above50MA = 0;
    let total = 0;

    for (const symbol of symbols) {
      try {
        const [quote, history] = await Promise.all([
          this.provider.getQuote(symbol),
          this.provider.getHistoricalPrices(symbol, '3M'),
        ]);

        total++;

        // Check if advancing (up from previous close)
        if (quote.price > quote.previousClose) {
          advancing++;
        } else {
          declining++;
        }

        // Check if above 50MA
        const mas = calculateMovingAverages(history);
        if (mas.ma50 && quote.price > mas.ma50) {
          above50MA++;
        }
      } catch {
        // Skip symbols that error
      }
    }

    const advDecRatio = declining > 0 ? advancing / declining : null;
    const percentAbove50MA = total > 0 ? (above50MA / total) * 100 : null;

    let assessment: MarketRegime['breadth']['assessment'];
    if (percentAbove50MA !== null) {
      if (percentAbove50MA >= 70) assessment = 'strong';
      else if (percentAbove50MA >= 55) assessment = 'healthy';
      else if (percentAbove50MA >= 40) assessment = 'mixed';
      else if (percentAbove50MA >= 25) assessment = 'weak';
      else assessment = 'very_weak';
    } else if (advDecRatio !== null) {
      if (advDecRatio >= 2) assessment = 'strong';
      else if (advDecRatio >= 1.2) assessment = 'healthy';
      else if (advDecRatio >= 0.8) assessment = 'mixed';
      else if (advDecRatio >= 0.5) assessment = 'weak';
      else assessment = 'very_weak';
    } else {
      assessment = 'mixed';
    }

    return {
      advDecRatio,
      percentAbove50MA,
      assessment,
    };
  }

  /**
   * Calculate sector leadership
   */
  private async calculateLeadership(): Promise<MarketRegime['leadership']> {
    const sectors: { symbol: string; name: string; trendScore: number }[] = [];

    for (const sector of SECTOR_ETFS) {
      try {
        const [quote, history] = await Promise.all([
          this.provider.getQuote(sector.symbol),
          this.provider.getHistoricalPrices(sector.symbol, '6M'),
        ]);

        const mas = calculateMovingAverages(history);
        const trend = determineTrendRegime(quote.price, mas.ma50, mas.ma200);

        sectors.push({
          symbol: sector.symbol,
          name: sector.name,
          trendScore: trend.score,
        });
      } catch {
        // Skip sectors that error
      }
    }

    // Sort by trend score descending
    sectors.sort((a, b) => b.trendScore - a.trendScore);

    return sectors.length > 0 ? { sectors } : null;
  }
}
