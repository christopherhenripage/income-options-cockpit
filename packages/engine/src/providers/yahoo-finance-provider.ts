import yahooFinance from 'yahoo-finance2';
import {
  MarketDataProvider,
  Quote,
  HistoricalPrice,
  OptionChain,
  OptionContract,
  VolatilityData,
} from '../types';
import { getCurrentTimestamp } from '../utils';

// Yahoo Finance response types (simplified for our needs)
interface YFQuoteResult {
  symbol: string;
  regularMarketPrice?: number;
  bid?: number;
  ask?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  regularMarketVolume?: number;
  averageDailyVolume10Day?: number;
  averageDailyVolume3Month?: number;
}

interface YFChartQuote {
  date: Date;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
}

interface YFOption {
  contractSymbol: string;
  strike: number;
  bid?: number;
  ask?: number;
  lastPrice?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
}

interface YFChartResult {
  quotes: YFChartQuote[];
}

interface YFOptionsResult {
  expirationDates?: number[];
  options?: Array<{
    calls?: YFOption[];
    puts?: YFOption[];
  }>;
}

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 60) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Black-Scholes Greeks Calculator
class BlackScholes {
  // Standard normal cumulative distribution function
  private static normCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  // Standard normal probability density function
  private static normPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // Calculate d1 and d2
  private static getD1D2(
    S: number, // Stock price
    K: number, // Strike price
    T: number, // Time to expiration (years)
    r: number, // Risk-free rate
    sigma: number // Volatility
  ): { d1: number; d2: number } {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return { d1, d2 };
  }

  // Calculate Greeks
  static calculateGreeks(
    S: number, // Stock price
    K: number, // Strike price
    T: number, // Time to expiration (years)
    r: number, // Risk-free rate (e.g., 0.05 for 5%)
    sigma: number, // Implied volatility (e.g., 0.30 for 30%)
    optionType: 'call' | 'put'
  ): { delta: number; gamma: number; theta: number; vega: number } {
    // Handle edge cases
    if (T <= 0 || sigma <= 0) {
      return { delta: 0, gamma: 0, theta: 0, vega: 0 };
    }

    const { d1, d2 } = this.getD1D2(S, K, T, r, sigma);
    const sqrtT = Math.sqrt(T);

    // Delta
    let delta: number;
    if (optionType === 'call') {
      delta = this.normCDF(d1);
    } else {
      delta = this.normCDF(d1) - 1;
    }

    // Gamma (same for calls and puts)
    const gamma = this.normPDF(d1) / (S * sigma * sqrtT);

    // Theta (per day, so divide by 365)
    let theta: number;
    const part1 = -(S * this.normPDF(d1) * sigma) / (2 * sqrtT);
    if (optionType === 'call') {
      theta = (part1 - r * K * Math.exp(-r * T) * this.normCDF(d2)) / 365;
    } else {
      theta = (part1 + r * K * Math.exp(-r * T) * this.normCDF(-d2)) / 365;
    }

    // Vega (per 1% change in volatility)
    const vega = (S * sqrtT * this.normPDF(d1)) / 100;

    return {
      delta: Math.round(delta * 1000) / 1000,
      gamma: Math.round(gamma * 10000) / 10000,
      theta: Math.round(theta * 100) / 100,
      vega: Math.round(vega * 100) / 100,
    };
  }

  // Calculate implied volatility from option price using Newton-Raphson
  static calculateIV(
    optionPrice: number,
    S: number,
    K: number,
    T: number,
    r: number,
    optionType: 'call' | 'put'
  ): number | null {
    if (T <= 0 || optionPrice <= 0) return null;

    let sigma = 0.3; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      const price = this.calculatePrice(S, K, T, r, sigma, optionType);
      const vega = this.calculateVega(S, K, T, r, sigma);

      if (Math.abs(vega) < 0.00001) break;

      const diff = optionPrice - price;
      if (Math.abs(diff) < tolerance) {
        return Math.round(sigma * 10000) / 10000;
      }

      sigma = sigma + diff / (vega * 100); // vega is per 1%
      if (sigma <= 0) sigma = 0.01;
      if (sigma > 5) sigma = 5; // Cap at 500%
    }

    return Math.round(sigma * 10000) / 10000;
  }

  private static calculatePrice(
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number,
    optionType: 'call' | 'put'
  ): number {
    const { d1, d2 } = this.getD1D2(S, K, T, r, sigma);

    if (optionType === 'call') {
      return S * this.normCDF(d1) - K * Math.exp(-r * T) * this.normCDF(d2);
    } else {
      return K * Math.exp(-r * T) * this.normCDF(-d2) - S * this.normCDF(-d1);
    }
  }

  private static calculateVega(S: number, K: number, T: number, r: number, sigma: number): number {
    const { d1 } = this.getD1D2(S, K, T, r, sigma);
    return (S * Math.sqrt(T) * this.normPDF(d1)) / 100;
  }
}

/**
 * Yahoo Finance Market Data Provider
 * Uses yahoo-finance2 for free delayed market data
 * No API key required
 */
export class YahooFinanceProvider implements MarketDataProvider {
  name = 'yahoo';

  private quoteCache = new SimpleCache<Quote>(60); // 1 min cache
  private historyCache = new SimpleCache<HistoricalPrice[]>(300); // 5 min cache
  private expirationCache = new SimpleCache<string[]>(300); // 5 min cache
  private chainCache = new SimpleCache<OptionChain>(60); // 1 min cache

  // Current risk-free rate (approximate 10-year Treasury)
  private riskFreeRate = 0.045;

  constructor() {
    // No initialization needed - yahoo-finance2 handles setup automatically
  }

  async getQuote(symbol: string): Promise<Quote> {
    const cacheKey = `quote-${symbol}`;
    const cached = this.quoteCache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = (await yahooFinance.quote(symbol)) as unknown as YFQuoteResult;

      if (!data) {
        throw new Error(`No quote data for symbol: ${symbol}`);
      }

      const quote: Quote = {
        symbol: data.symbol,
        price: data.regularMarketPrice || 0,
        bid: data.bid || data.regularMarketPrice || 0,
        ask: data.ask || data.regularMarketPrice || 0,
        open: data.regularMarketOpen || 0,
        high: data.regularMarketDayHigh || 0,
        low: data.regularMarketDayLow || 0,
        previousClose: data.regularMarketPreviousClose || 0,
        volume: data.regularMarketVolume || 0,
        avgVolume: data.averageDailyVolume10Day || data.averageDailyVolume3Month || 0,
        timestamp: getCurrentTimestamp(),
      };

      this.quoteCache.set(cacheKey, quote);
      return quote;
    } catch (error) {
      throw new Error(
        `Failed to get quote for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const results = new Map<string, Quote>();

    // Yahoo Finance supports batch quotes
    try {
      const data = (await yahooFinance.quote(symbols)) as unknown as YFQuoteResult | YFQuoteResult[];
      const quotes = Array.isArray(data) ? data : [data];

      for (const q of quotes) {
        if (!q) continue;

        const quote: Quote = {
          symbol: q.symbol,
          price: q.regularMarketPrice || 0,
          bid: q.bid || q.regularMarketPrice || 0,
          ask: q.ask || q.regularMarketPrice || 0,
          open: q.regularMarketOpen || 0,
          high: q.regularMarketDayHigh || 0,
          low: q.regularMarketDayLow || 0,
          previousClose: q.regularMarketPreviousClose || 0,
          volume: q.regularMarketVolume || 0,
          avgVolume: q.averageDailyVolume10Day || q.averageDailyVolume3Month || 0,
          timestamp: getCurrentTimestamp(),
        };

        results.set(q.symbol, quote);
        this.quoteCache.set(`quote-${q.symbol}`, quote);
      }
    } catch (error) {
      // Fall back to individual quotes
      for (const symbol of symbols) {
        try {
          const quote = await this.getQuote(symbol);
          results.set(symbol, quote);
        } catch {
          // Skip failed symbols
        }
      }
    }

    return results;
  }

  async getHistoricalPrices(
    symbol: string,
    range: '1M' | '3M' | '6M' | '1Y'
  ): Promise<HistoricalPrice[]> {
    const cacheKey = `history-${symbol}-${range}`;
    const cached = this.historyCache.get(cacheKey);
    if (cached) return cached;

    // Map range to Yahoo Finance period
    const periodMap: Record<string, string> = {
      '1M': '1mo',
      '3M': '3mo',
      '6M': '6mo',
      '1Y': '1y',
    };

    try {
      const data = (await yahooFinance.chart(symbol, {
        period1: this.getStartDate(range),
        interval: '1d',
      })) as unknown as YFChartResult;

      if (!data.quotes || data.quotes.length === 0) {
        throw new Error(`No historical data for symbol: ${symbol}`);
      }

      const prices: HistoricalPrice[] = data.quotes
        .filter((q: YFChartQuote) => q.close !== null && q.close !== undefined)
        .map((q: YFChartQuote) => ({
          date: new Date(q.date).toISOString().split('T')[0],
          open: q.open || 0,
          high: q.high || 0,
          low: q.low || 0,
          close: q.close || 0,
          volume: q.volume || 0,
        }));

      this.historyCache.set(cacheKey, prices);
      return prices;
    } catch (error) {
      throw new Error(
        `Failed to get historical prices for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getStartDate(range: '1M' | '3M' | '6M' | '1Y'): Date {
    const now = new Date();
    switch (range) {
      case '1M':
        return new Date(now.setMonth(now.getMonth() - 1));
      case '3M':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6M':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() - 1));
    }
  }

  async getOptionExpirations(symbol: string): Promise<string[]> {
    const cacheKey = `exp-${symbol}`;
    const cached = this.expirationCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get options data which includes expirations
      const data = (await yahooFinance.options(symbol)) as unknown as YFOptionsResult;

      if (!data.expirationDates || data.expirationDates.length === 0) {
        throw new Error(`No options expirations for symbol: ${symbol}`);
      }

      // Convert timestamps to YYYY-MM-DD format
      const expirations = data.expirationDates.map((timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toISOString().split('T')[0];
      });

      // Filter to future expirations only
      const today = new Date().toISOString().split('T')[0];
      const futureExpirations = expirations.filter((exp: string) => exp >= today);

      this.expirationCache.set(cacheKey, futureExpirations);
      return futureExpirations;
    } catch (error) {
      throw new Error(
        `Failed to get option expirations for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getOptionChain(symbol: string, expiration: string): Promise<OptionChain> {
    const cacheKey = `chain-${symbol}-${expiration}`;
    const cached = this.chainCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get underlying price first
      const quote = await this.getQuote(symbol);
      const underlyingPrice = quote.price;

      // Convert expiration to timestamp
      const expirationTimestamp = new Date(expiration).getTime() / 1000;

      const data = (await yahooFinance.options(symbol, { date: expirationTimestamp })) as unknown as YFOptionsResult;

      if (!data.options || data.options.length === 0) {
        throw new Error(`No options chain for ${symbol} expiring ${expiration}`);
      }

      const optionData = data.options[0];
      const calls: OptionContract[] = [];
      const puts: OptionContract[] = [];

      // Calculate time to expiration in years
      const now = new Date();
      const expDate = new Date(expiration);
      const T = Math.max((expDate.getTime() - now.getTime()) / (365 * 24 * 60 * 60 * 1000), 0.001);

      // Process calls
      if (optionData.calls) {
        for (const opt of optionData.calls) {
          const midPrice = ((opt.bid || 0) + (opt.ask || 0)) / 2;

          // Calculate IV from option price if not provided
          let iv = opt.impliedVolatility || null;
          if (!iv && midPrice > 0) {
            iv = BlackScholes.calculateIV(
              midPrice,
              underlyingPrice,
              opt.strike,
              T,
              this.riskFreeRate,
              'call'
            );
          }

          // Calculate Greeks
          const greeks =
            iv && iv > 0
              ? BlackScholes.calculateGreeks(
                  underlyingPrice,
                  opt.strike,
                  T,
                  this.riskFreeRate,
                  iv,
                  'call'
                )
              : { delta: null, gamma: null, theta: null, vega: null };

          const contract: OptionContract = {
            symbol: opt.contractSymbol,
            underlying: symbol,
            expiration,
            strike: opt.strike,
            type: 'call',
            bid: opt.bid || 0,
            ask: opt.ask || 0,
            last: opt.lastPrice || null,
            volume: opt.volume || 0,
            openInterest: opt.openInterest || 0,
            impliedVolatility: iv,
            delta: greeks.delta,
            gamma: greeks.gamma,
            theta: greeks.theta,
            vega: greeks.vega,
            inTheMoney: opt.strike < underlyingPrice,
          };

          calls.push(contract);
        }
      }

      // Process puts
      if (optionData.puts) {
        for (const opt of optionData.puts) {
          const midPrice = ((opt.bid || 0) + (opt.ask || 0)) / 2;

          // Calculate IV from option price if not provided
          let iv = opt.impliedVolatility || null;
          if (!iv && midPrice > 0) {
            iv = BlackScholes.calculateIV(
              midPrice,
              underlyingPrice,
              opt.strike,
              T,
              this.riskFreeRate,
              'put'
            );
          }

          // Calculate Greeks
          const greeks =
            iv && iv > 0
              ? BlackScholes.calculateGreeks(
                  underlyingPrice,
                  opt.strike,
                  T,
                  this.riskFreeRate,
                  iv,
                  'put'
                )
              : { delta: null, gamma: null, theta: null, vega: null };

          const contract: OptionContract = {
            symbol: opt.contractSymbol,
            underlying: symbol,
            expiration,
            strike: opt.strike,
            type: 'put',
            bid: opt.bid || 0,
            ask: opt.ask || 0,
            last: opt.lastPrice || null,
            volume: opt.volume || 0,
            openInterest: opt.openInterest || 0,
            impliedVolatility: iv,
            delta: greeks.delta,
            gamma: greeks.gamma,
            theta: greeks.theta,
            vega: greeks.vega,
            inTheMoney: opt.strike > underlyingPrice,
          };

          puts.push(contract);
        }
      }

      // Sort by strike
      calls.sort((a, b) => a.strike - b.strike);
      puts.sort((a, b) => a.strike - b.strike);

      const chain: OptionChain = {
        underlying: symbol,
        expiration,
        calls,
        puts,
      };

      this.chainCache.set(cacheKey, chain);
      return chain;
    } catch (error) {
      throw new Error(
        `Failed to get option chain for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getVolatilityData(symbol: string): Promise<VolatilityData> {
    // Get historical prices to calculate HV
    const history = await this.getHistoricalPrices(symbol, '3M');

    // Calculate historical volatility (20-day and 50-day)
    const returns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const ret = Math.log(history[i].close / history[i - 1].close);
      returns.push(ret);
    }

    const calcStdDev = (arr: number[], period: number) => {
      const slice = arr.slice(-period);
      if (slice.length < period) return null;
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
      return Math.sqrt(variance) * Math.sqrt(252); // Annualized
    };

    const hv20 = returns.length >= 20 ? calcStdDev(returns, 20) : null;
    const hv50 = returns.length >= 50 ? calcStdDev(returns, 50) : null;

    // Try to get current IV from ATM option
    let currentIV: number | null = null;
    let ivRank: number | null = null;
    let ivPercentile: number | null = null;

    try {
      const expirations = await this.getOptionExpirations(symbol);
      if (expirations.length > 0) {
        // Find expiration ~30 days out
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);

        const nearestExp = expirations.reduce((prev, curr) => {
          return Math.abs(new Date(curr).getTime() - targetDate.getTime()) <
            Math.abs(new Date(prev).getTime() - targetDate.getTime())
            ? curr
            : prev;
        });

        const chain = await this.getOptionChain(symbol, nearestExp);
        const quote = await this.getQuote(symbol);

        // Find ATM options
        if (chain.calls.length > 0) {
          const atmCall = chain.calls.reduce((prev, curr) => {
            return Math.abs(curr.strike - quote.price) < Math.abs(prev.strike - quote.price)
              ? curr
              : prev;
          });

          if (atmCall.impliedVolatility) {
            currentIV = atmCall.impliedVolatility;
            // Estimate IV rank (simplified - would need historical IV data for accuracy)
            if (hv50) {
              ivRank = Math.min(100, Math.max(0, ((currentIV - hv50) / hv50) * 100 + 50));
              ivPercentile = ivRank; // Simplified
            }
          }
        }
      }
    } catch {
      // Options data not available, continue with what we have
    }

    return {
      symbol,
      currentIV,
      ivRank,
      ivPercentile,
      historicalVolatility20: hv20,
      historicalVolatility50: hv50,
      vixProxy: null,
    };
  }
}
