import {
  MarketDataProvider,
  Quote,
  HistoricalPrice,
  OptionChain,
  OptionContract,
  VolatilityData,
} from '../types';
import { generateId, getCurrentTimestamp } from '../utils';

// Seed data for mock provider
const SEED_QUOTES: Record<string, Omit<Quote, 'timestamp'>> = {
  SPY: { symbol: 'SPY', price: 585.42, bid: 585.40, ask: 585.44, open: 583.50, high: 586.20, low: 582.80, previousClose: 583.15, volume: 45000000, avgVolume: 52000000 },
  QQQ: { symbol: 'QQQ', price: 512.35, bid: 512.32, ask: 512.38, open: 510.20, high: 513.80, low: 509.50, previousClose: 510.05, volume: 32000000, avgVolume: 38000000 },
  IWM: { symbol: 'IWM', price: 225.18, bid: 225.15, ask: 225.21, open: 224.50, high: 226.30, low: 223.90, previousClose: 224.25, volume: 22000000, avgVolume: 25000000 },
  DIA: { symbol: 'DIA', price: 428.55, bid: 428.52, ask: 428.58, open: 427.20, high: 429.40, low: 426.80, previousClose: 427.10, volume: 3500000, avgVolume: 4000000 },
  AAPL: { symbol: 'AAPL', price: 242.85, bid: 242.82, ask: 242.88, open: 241.50, high: 243.60, low: 240.90, previousClose: 241.20, volume: 48000000, avgVolume: 55000000 },
  MSFT: { symbol: 'MSFT', price: 438.22, bid: 438.18, ask: 438.26, open: 436.80, high: 439.50, low: 435.60, previousClose: 436.50, volume: 18000000, avgVolume: 22000000 },
  AMZN: { symbol: 'AMZN', price: 228.45, bid: 228.42, ask: 228.48, open: 227.20, high: 229.80, low: 226.50, previousClose: 227.10, volume: 35000000, avgVolume: 42000000 },
  NVDA: { symbol: 'NVDA', price: 142.68, bid: 142.65, ask: 142.71, open: 141.20, high: 143.80, low: 140.50, previousClose: 141.00, volume: 280000000, avgVolume: 320000000 },
  META: { symbol: 'META', price: 612.35, bid: 612.30, ask: 612.40, open: 609.80, high: 614.20, low: 608.50, previousClose: 609.50, volume: 12000000, avgVolume: 15000000 },
  GOOGL: { symbol: 'GOOGL', price: 198.42, bid: 198.40, ask: 198.44, open: 197.30, high: 199.20, low: 196.80, previousClose: 197.20, volume: 22000000, avgVolume: 28000000 },
  TSLA: { symbol: 'TSLA', price: 425.80, bid: 425.75, ask: 425.85, open: 422.50, high: 428.40, low: 420.30, previousClose: 422.20, volume: 85000000, avgVolume: 95000000 },
  // Sector ETFs
  XLK: { symbol: 'XLK', price: 238.50, bid: 238.48, ask: 238.52, open: 237.20, high: 239.40, low: 236.50, previousClose: 237.10, volume: 8000000, avgVolume: 9500000 },
  XLF: { symbol: 'XLF', price: 48.25, bid: 48.24, ask: 48.26, open: 47.90, high: 48.50, low: 47.70, previousClose: 47.85, volume: 28000000, avgVolume: 32000000 },
  XLE: { symbol: 'XLE', price: 85.42, bid: 85.40, ask: 85.44, open: 85.80, high: 86.20, low: 84.90, previousClose: 85.70, volume: 15000000, avgVolume: 18000000 },
  XLV: { symbol: 'XLV', price: 148.30, bid: 148.28, ask: 148.32, open: 147.80, high: 148.90, low: 147.50, previousClose: 147.70, volume: 6000000, avgVolume: 7500000 },
  XLY: { symbol: 'XLY', price: 225.15, bid: 225.12, ask: 225.18, open: 224.20, high: 226.00, low: 223.80, previousClose: 224.10, volume: 4500000, avgVolume: 5500000 },
  XLP: { symbol: 'XLP', price: 82.45, bid: 82.44, ask: 82.46, open: 82.20, high: 82.70, low: 82.00, previousClose: 82.15, volume: 9000000, avgVolume: 11000000 },
  XLI: { symbol: 'XLI', price: 138.20, bid: 138.18, ask: 138.22, open: 137.50, high: 138.80, low: 137.20, previousClose: 137.40, volume: 7000000, avgVolume: 8500000 },
  XLU: { symbol: 'XLU', price: 78.65, bid: 78.64, ask: 78.66, open: 78.30, high: 79.00, low: 78.10, previousClose: 78.25, volume: 10000000, avgVolume: 12000000 },
};

// Generate historical prices for a symbol
function generateHistoricalPrices(
  symbol: string,
  currentPrice: number,
  days: number
): HistoricalPrice[] {
  const prices: HistoricalPrice[] = [];
  const volatility = symbol === 'TSLA' || symbol === 'NVDA' ? 0.025 : 0.012;
  const trend = 0.0003; // Slight upward bias

  let price = currentPrice;
  const today = new Date();

  // Generate from oldest to newest
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dailyReturn = (Math.random() - 0.5) * 2 * volatility + trend;
    price = price * (1 + dailyReturn);

    const dayRange = price * volatility;
    const open = price + (Math.random() - 0.5) * dayRange;
    const high = Math.max(open, price) + Math.random() * dayRange * 0.5;
    const low = Math.min(open, price) - Math.random() * dayRange * 0.5;
    const volume = Math.floor(
      (SEED_QUOTES[symbol]?.avgVolume || 10000000) * (0.7 + Math.random() * 0.6)
    );

    prices.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume,
    });
  }

  // Ensure last price matches current quote
  if (prices.length > 0) {
    prices[prices.length - 1].close = currentPrice;
  }

  return prices;
}

// Generate option expirations
function generateExpirations(): string[] {
  const expirations: string[] = [];
  const today = new Date();

  // Weekly expirations for next 8 weeks
  for (let i = 1; i <= 8; i++) {
    const exp = new Date(today);
    exp.setDate(exp.getDate() + (5 - exp.getDay() + 7 * i) % 7 + 7 * (i - 1));
    if (exp.getDay() !== 5) {
      exp.setDate(exp.getDate() + (5 - exp.getDay() + 7) % 7);
    }
    expirations.push(exp.toISOString().split('T')[0]);
  }

  // Monthly expirations (3rd Friday) for next 4 months
  for (let m = 0; m < 4; m++) {
    const monthDate = new Date(today);
    monthDate.setMonth(monthDate.getMonth() + m + 2);
    monthDate.setDate(1);

    // Find 3rd Friday
    const firstDay = monthDate.getDay();
    const firstFriday = firstDay <= 5 ? 6 - firstDay : 13 - firstDay;
    const thirdFriday = firstFriday + 14;
    monthDate.setDate(thirdFriday);

    expirations.push(monthDate.toISOString().split('T')[0]);
  }

  return Array.from(new Set(expirations)).sort();
}

// Generate option chain for a symbol and expiration
function generateOptionChain(
  symbol: string,
  underlyingPrice: number,
  expiration: string
): OptionChain {
  const dte = Math.ceil(
    (new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Determine strike interval based on underlying price
  let strikeInterval: number;
  if (underlyingPrice > 500) strikeInterval = 5;
  else if (underlyingPrice > 200) strikeInterval = 2.5;
  else if (underlyingPrice > 50) strikeInterval = 1;
  else strikeInterval = 0.5;

  // Generate strikes around current price
  const strikes: number[] = [];
  const numStrikes = 15;
  const baseStrike =
    Math.round(underlyingPrice / strikeInterval) * strikeInterval;

  for (let i = -numStrikes; i <= numStrikes; i++) {
    strikes.push(baseStrike + i * strikeInterval);
  }

  // Base IV for this symbol
  const baseIV =
    symbol === 'TSLA' || symbol === 'NVDA'
      ? 0.45
      : symbol.startsWith('X')
      ? 0.18
      : 0.22;

  const calls: OptionContract[] = [];
  const puts: OptionContract[] = [];

  for (const strike of strikes) {
    const moneyness = (strike - underlyingPrice) / underlyingPrice;
    const isITMCall = strike < underlyingPrice;
    const isITMPut = strike > underlyingPrice;

    // IV smile - higher IV for OTM options
    const ivAdjustment = Math.abs(moneyness) * 0.5;
    const iv = baseIV + ivAdjustment;

    // Time value component
    const timeValue = Math.sqrt(dte / 365) * underlyingPrice * iv;

    // Intrinsic values
    const callIntrinsic = Math.max(0, underlyingPrice - strike);
    const putIntrinsic = Math.max(0, strike - underlyingPrice);

    // Approximate option prices
    const callMid =
      callIntrinsic + timeValue * Math.exp(-Math.abs(moneyness) * 2) * 0.5;
    const putMid =
      putIntrinsic + timeValue * Math.exp(-Math.abs(moneyness) * 2) * 0.5;

    // Bid-ask spread based on liquidity
    const spreadPct =
      Math.abs(moneyness) > 0.1 ? 0.08 : Math.abs(moneyness) > 0.05 ? 0.04 : 0.02;

    // Approximate delta
    const callDelta = isITMCall
      ? 0.5 + Math.min(0.5, Math.abs(moneyness) * 3)
      : 0.5 - Math.min(0.5, Math.abs(moneyness) * 3);
    const putDelta = callDelta - 1;

    // Open interest and volume - higher near ATM
    const liquidityMult = Math.exp(-Math.abs(moneyness) * 10);
    const baseOI = symbol.startsWith('X') ? 2000 : 5000;
    const baseVol = symbol.startsWith('X') ? 500 : 1500;

    const callContract: OptionContract = {
      symbol: `${symbol}${expiration.replace(/-/g, '')}C${strike.toFixed(2).replace('.', '')}`,
      underlying: symbol,
      expiration,
      strike,
      type: 'call',
      bid: Math.round(Math.max(0.01, callMid * (1 - spreadPct / 2)) * 100) / 100,
      ask: Math.round(Math.max(0.02, callMid * (1 + spreadPct / 2)) * 100) / 100,
      last: Math.round(callMid * 100) / 100,
      volume: Math.floor(baseVol * liquidityMult * (0.5 + Math.random())),
      openInterest: Math.floor(baseOI * liquidityMult * (0.5 + Math.random())),
      impliedVolatility: Math.round(iv * 10000) / 100,
      delta: Math.round(callDelta * 100) / 100,
      gamma: Math.round((0.05 * liquidityMult) * 1000) / 1000,
      theta: Math.round((-callMid / dte) * 100) / 100,
      vega: Math.round((underlyingPrice * 0.01 * Math.sqrt(dte / 365)) * 100) / 100,
      inTheMoney: isITMCall,
    };

    const putContract: OptionContract = {
      symbol: `${symbol}${expiration.replace(/-/g, '')}P${strike.toFixed(2).replace('.', '')}`,
      underlying: symbol,
      expiration,
      strike,
      type: 'put',
      bid: Math.round(Math.max(0.01, putMid * (1 - spreadPct / 2)) * 100) / 100,
      ask: Math.round(Math.max(0.02, putMid * (1 + spreadPct / 2)) * 100) / 100,
      last: Math.round(putMid * 100) / 100,
      volume: Math.floor(baseVol * liquidityMult * (0.5 + Math.random())),
      openInterest: Math.floor(baseOI * liquidityMult * (0.5 + Math.random())),
      impliedVolatility: Math.round(iv * 10000) / 100,
      delta: Math.round(putDelta * 100) / 100,
      gamma: Math.round((0.05 * liquidityMult) * 1000) / 1000,
      theta: Math.round((-putMid / dte) * 100) / 100,
      vega: Math.round((underlyingPrice * 0.01 * Math.sqrt(dte / 365)) * 100) / 100,
      inTheMoney: isITMPut,
    };

    calls.push(callContract);
    puts.push(putContract);
  }

  return {
    underlying: symbol,
    expiration,
    calls,
    puts,
  };
}

/**
 * Mock Market Data Provider
 * Provides deterministic test data for development and testing
 */
export class MockProvider implements MarketDataProvider {
  name = 'mock';
  private historicalCache: Map<string, HistoricalPrice[]> = new Map();
  private expirations: string[] = generateExpirations();

  async getQuote(symbol: string): Promise<Quote> {
    const baseQuote = SEED_QUOTES[symbol];
    if (!baseQuote) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    return {
      ...baseQuote,
      timestamp: getCurrentTimestamp(),
    };
  }

  async getHistoricalPrices(
    symbol: string,
    range: '1M' | '3M' | '6M' | '1Y'
  ): Promise<HistoricalPrice[]> {
    const cacheKey = `${symbol}-${range}`;

    if (!this.historicalCache.has(cacheKey)) {
      const quote = await this.getQuote(symbol);
      const days =
        range === '1M' ? 30 : range === '3M' ? 90 : range === '6M' ? 180 : 365;
      const prices = generateHistoricalPrices(symbol, quote.price, days);
      this.historicalCache.set(cacheKey, prices);
    }

    return this.historicalCache.get(cacheKey)!;
  }

  async getOptionExpirations(symbol: string): Promise<string[]> {
    // Verify symbol exists
    await this.getQuote(symbol);
    return this.expirations;
  }

  async getOptionChain(symbol: string, expiration: string): Promise<OptionChain> {
    const quote = await this.getQuote(symbol);
    return generateOptionChain(symbol, quote.price, expiration);
  }

  async getVolatilityData(symbol: string): Promise<VolatilityData> {
    const history = await this.getHistoricalPrices(symbol, '3M');
    const quote = await this.getQuote(symbol);

    // Calculate HV20 and HV50
    const returns20: number[] = [];
    const returns50: number[] = [];

    for (let i = 1; i < Math.min(21, history.length); i++) {
      returns20.push(Math.log(history[history.length - i].close / history[history.length - i - 1].close));
    }
    for (let i = 1; i < Math.min(51, history.length); i++) {
      returns50.push(Math.log(history[history.length - i].close / history[history.length - i - 1].close));
    }

    const calcVol = (returns: number[]): number => {
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
      return Math.sqrt(variance) * Math.sqrt(252) * 100;
    };

    const hv20 = returns20.length >= 20 ? calcVol(returns20) : null;
    const hv50 = returns50.length >= 50 ? calcVol(returns50) : null;

    // Mock IV based on symbol
    const baseIV =
      symbol === 'TSLA' || symbol === 'NVDA' ? 45 : symbol.startsWith('X') ? 18 : 22;
    const currentIV = baseIV + (Math.random() - 0.5) * 5;

    // Mock IV rank (0-100)
    const ivRank = Math.floor(30 + Math.random() * 40);

    return {
      symbol,
      currentIV: Math.round(currentIV * 100) / 100,
      ivRank,
      ivPercentile: ivRank + Math.floor((Math.random() - 0.5) * 10),
      historicalVolatility20: hv20 ? Math.round(hv20 * 100) / 100 : null,
      historicalVolatility50: hv50 ? Math.round(hv50 * 100) / 100 : null,
      vixProxy: symbol === 'SPY' ? 16 + Math.random() * 5 : null,
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const quotes = new Map<string, Quote>();
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        quotes.set(symbol, quote);
      } catch {
        // Skip unknown symbols
      }
    }
    return quotes;
  }
}

// Export available symbols for testing
export const MOCK_SYMBOLS = Object.keys(SEED_QUOTES);
