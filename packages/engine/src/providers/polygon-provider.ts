import {
  MarketDataProvider,
  Quote,
  HistoricalPrice,
  OptionChain,
  OptionContract,
  VolatilityData,
} from '../types';
import { getCurrentTimestamp } from '../utils';

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

// Polygon API response types
interface PolygonPrevDayResponse {
  status: string;
  results: Array<{
    T: string; // ticker
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
    vw: number; // volume weighted avg price
  }>;
}

interface PolygonSnapshotResponse {
  status: string;
  ticker: {
    ticker: string;
    todaysChange: number;
    todaysChangePerc: number;
    updated: number;
    day: {
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
      vw: number;
    };
    prevDay: {
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
      vw: number;
    };
    min?: {
      av: number; // accumulated volume
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
      vw: number;
    };
  };
}

interface PolygonAggregatesResponse {
  status: string;
  resultsCount: number;
  results?: Array<{
    t: number; // timestamp
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  }>;
}

interface PolygonOptionsContractsResponse {
  status: string;
  results?: Array<{
    ticker: string;
    underlying_ticker: string;
    expiration_date: string;
    strike_price: number;
    contract_type: 'call' | 'put';
  }>;
  next_url?: string;
}

interface PolygonOptionsSnapshotResponse {
  status: string;
  results?: Array<{
    break_even_price?: number;
    day?: {
      change: number;
      change_percent: number;
      close: number;
      high: number;
      low: number;
      open: number;
      previous_close: number;
      volume: number;
      vwap: number;
    };
    details?: {
      contract_type: 'call' | 'put';
      exercise_style: string;
      expiration_date: string;
      shares_per_contract: number;
      strike_price: number;
      ticker: string;
    };
    greeks?: {
      delta: number;
      gamma: number;
      theta: number;
      vega: number;
    };
    implied_volatility?: number;
    last_quote?: {
      ask: number;
      ask_size: number;
      bid: number;
      bid_size: number;
      last_updated: number;
      midpoint: number;
    };
    open_interest?: number;
    underlying_asset?: {
      change_to_break_even: number;
      last_updated: number;
      price: number;
      ticker: string;
    };
  }>;
}

/**
 * Polygon.io Market Data Provider
 * Provides real market data from Polygon.io API
 *
 * Free tier: 5 API calls/minute, delayed data
 * Basic tier ($29/mo): 100 API calls/minute, delayed data
 * Starter tier ($79/mo): 100 API calls/minute, real-time data
 */
export class PolygonProvider implements MarketDataProvider {
  name = 'polygon';
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';

  // Caches with different TTLs based on data freshness needs
  private quoteCache = new SimpleCache<Quote>(60); // 1 min cache for quotes
  private historicalCache = new SimpleCache<HistoricalPrice[]>(300); // 5 min for historical
  private expirationCache = new SimpleCache<string[]>(300); // 5 min for expirations
  private chainCache = new SimpleCache<OptionChain>(60); // 1 min for chains
  private volCache = new SimpleCache<VolatilityData>(120); // 2 min for vol data

  // Rate limiting
  private requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minRequestInterval = 200; // 200ms between requests (safe for free tier)

  constructor(apiKey?: string) {
    this.apiKey = (apiKey || process.env.POLYGON_API_KEY || process.env.MARKET_DATA_API_KEY || '').trim();
    if (!this.apiKey) {
      throw new Error('Polygon API key is required. Set POLYGON_API_KEY or MARKET_DATA_API_KEY environment variable.');
    }
  }

  private async rateLimitedFetch<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(r => setTimeout(r, this.minRequestInterval - timeSinceLastRequest));
        }

        this.lastRequestTime = Date.now();

        try {
          const response = await fetch(`${url}&apiKey=${this.apiKey}`);

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Polygon rate limit exceeded. Please wait and try again.');
            }
            throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          resolve(data as T);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(task);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessingQueue = false;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const cacheKey = `quote-${symbol}`;
    const cached = this.quoteCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Use snapshot endpoint for real-time-ish data
      const url = `${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?`;
      const data = await this.rateLimitedFetch<PolygonSnapshotResponse>(url);

      if (data.status !== 'OK' || !data.ticker) {
        throw new Error(`No data for symbol: ${symbol}`);
      }

      const t = data.ticker;
      const quote: Quote = {
        symbol,
        price: t.day?.c || t.prevDay.c,
        bid: t.min?.c || t.day?.c || t.prevDay.c, // Approximate
        ask: t.min?.c || t.day?.c || t.prevDay.c, // Approximate
        open: t.day?.o || t.prevDay.o,
        high: t.day?.h || t.prevDay.h,
        low: t.day?.l || t.prevDay.l,
        previousClose: t.prevDay.c,
        volume: t.day?.v || 0,
        avgVolume: Math.round(t.prevDay.v * 0.8), // Estimate based on prev day
        timestamp: getCurrentTimestamp(),
      };

      this.quoteCache.set(cacheKey, quote);
      return quote;
    } catch (error) {
      // Try fallback to previous day endpoint
      try {
        const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/prev?`;
        const data = await this.rateLimitedFetch<PolygonPrevDayResponse>(url);

        if (data.status !== 'OK' || !data.results?.[0]) {
          throw new Error(`No data for symbol: ${symbol}`);
        }

        const r = data.results[0];
        const quote: Quote = {
          symbol,
          price: r.c,
          bid: r.c,
          ask: r.c,
          open: r.o,
          high: r.h,
          low: r.l,
          previousClose: r.c, // Not available in prev endpoint
          volume: r.v,
          avgVolume: r.v,
          timestamp: getCurrentTimestamp(),
        };

        this.quoteCache.set(cacheKey, quote);
        return quote;
      } catch {
        throw error;
      }
    }
  }

  async getHistoricalPrices(
    symbol: string,
    range: '1M' | '3M' | '6M' | '1Y'
  ): Promise<HistoricalPrice[]> {
    const cacheKey = `hist-${symbol}-${range}`;
    const cached = this.historicalCache.get(cacheKey);
    if (cached) return cached;

    const days = range === '1M' ? 30 : range === '3M' ? 90 : range === '6M' ? 180 : 365;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=500`;
    const data = await this.rateLimitedFetch<PolygonAggregatesResponse>(url);

    if (data.status !== 'OK' || !data.results) {
      throw new Error(`No historical data for symbol: ${symbol}`);
    }

    const prices: HistoricalPrice[] = data.results.map((r) => ({
      date: new Date(r.t).toISOString().split('T')[0],
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
    }));

    this.historicalCache.set(cacheKey, prices);
    return prices;
  }

  async getOptionExpirations(symbol: string): Promise<string[]> {
    const cacheKey = `exp-${symbol}`;
    const cached = this.expirationCache.get(cacheKey);
    if (cached) return cached;

    // Get contracts and extract unique expirations
    const url = `${this.baseUrl}/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=250`;
    const data = await this.rateLimitedFetch<PolygonOptionsContractsResponse>(url);

    if (data.status !== 'OK' || !data.results) {
      throw new Error(`No options data for symbol: ${symbol}`);
    }

    const expirations = Array.from(new Set(data.results.map((c) => c.expiration_date))).sort();

    // Filter to only future expirations
    const today = new Date().toISOString().split('T')[0];
    const futureExpirations = expirations.filter((exp) => exp >= today);

    this.expirationCache.set(cacheKey, futureExpirations);
    return futureExpirations;
  }

  async getOptionChain(symbol: string, expiration: string): Promise<OptionChain> {
    const cacheKey = `chain-${symbol}-${expiration}`;
    const cached = this.chainCache.get(cacheKey);
    if (cached) return cached;

    // Get underlying price first
    const quote = await this.getQuote(symbol);
    const underlyingPrice = quote.price;

    // Get options snapshot for this underlying
    const url = `${this.baseUrl}/v3/snapshot/options/${symbol}?expiration_date=${expiration}&limit=250`;
    const data = await this.rateLimitedFetch<PolygonOptionsSnapshotResponse>(url);

    if (data.status !== 'OK' || !data.results) {
      throw new Error(`No options chain for ${symbol} expiring ${expiration}`);
    }

    const dte = Math.ceil(
      (new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const calls: OptionContract[] = [];
    const puts: OptionContract[] = [];

    for (const opt of data.results) {
      if (!opt.details || !opt.last_quote) continue;

      const contract: OptionContract = {
        symbol: opt.details.ticker,
        underlying: symbol,
        expiration: opt.details.expiration_date,
        strike: opt.details.strike_price,
        type: opt.details.contract_type,
        bid: opt.last_quote.bid || 0,
        ask: opt.last_quote.ask || 0,
        last: opt.last_quote.midpoint || null,
        volume: opt.day?.volume || 0,
        openInterest: opt.open_interest || 0,
        impliedVolatility: opt.implied_volatility
          ? Math.round(opt.implied_volatility * 100 * 100) / 100
          : null,
        delta: opt.greeks?.delta ?? null,
        gamma: opt.greeks?.gamma ?? null,
        theta: opt.greeks?.theta ?? null,
        vega: opt.greeks?.vega ?? null,
        inTheMoney:
          opt.details.contract_type === 'call'
            ? opt.details.strike_price < underlyingPrice
            : opt.details.strike_price > underlyingPrice,
      };

      if (opt.details.contract_type === 'call') {
        calls.push(contract);
      } else {
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
  }

  async getVolatilityData(symbol: string): Promise<VolatilityData> {
    const cacheKey = `vol-${symbol}`;
    const cached = this.volCache.get(cacheKey);
    if (cached) return cached;

    // Get historical prices for HV calculation
    const history = await this.getHistoricalPrices(symbol, '3M');

    // Calculate HV20 and HV50
    const returns20: number[] = [];
    const returns50: number[] = [];

    for (let i = 1; i < Math.min(21, history.length); i++) {
      returns20.push(
        Math.log(history[history.length - i].close / history[history.length - i - 1].close)
      );
    }
    for (let i = 1; i < Math.min(51, history.length); i++) {
      returns50.push(
        Math.log(history[history.length - i].close / history[history.length - i - 1].close)
      );
    }

    const calcVol = (returns: number[]): number => {
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance =
        returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
      return Math.sqrt(variance) * Math.sqrt(252) * 100;
    };

    const hv20 = returns20.length >= 20 ? calcVol(returns20) : null;
    const hv50 = returns50.length >= 50 ? calcVol(returns50) : null;

    // Get ATM option for IV estimate
    let currentIV: number | null = null;
    let ivRank: number | null = null;

    try {
      const expirations = await this.getOptionExpirations(symbol);
      // Find expiration around 30 days out
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const nearestExp = expirations.reduce((prev, curr) => {
        return Math.abs(new Date(curr).getTime() - new Date(targetDateStr).getTime()) <
          Math.abs(new Date(prev).getTime() - new Date(targetDateStr).getTime())
          ? curr
          : prev;
      });

      const chain = await this.getOptionChain(symbol, nearestExp);
      const quote = await this.getQuote(symbol);

      // Find ATM put
      const atmPut = chain.puts.reduce((prev, curr) =>
        Math.abs(curr.strike - quote.price) < Math.abs(prev.strike - quote.price) ? curr : prev
      );

      if (atmPut.impliedVolatility) {
        currentIV = atmPut.impliedVolatility;
        // Estimate IV rank based on HV comparison (rough approximation)
        if (hv50) {
          ivRank = Math.min(100, Math.max(0, Math.round((currentIV / (hv50 * 1.5)) * 50)));
        }
      }
    } catch {
      // Options data not available, continue with HV data only
    }

    // Get VIX if this is SPY
    let vixProxy: number | null = null;
    if (symbol === 'SPY') {
      try {
        const vixQuote = await this.getQuote('VIX');
        vixProxy = vixQuote.price;
      } catch {
        // VIX not available
      }
    }

    const volData: VolatilityData = {
      symbol,
      currentIV: currentIV ? Math.round(currentIV * 100) / 100 : null,
      ivRank,
      ivPercentile: ivRank, // Approximate
      historicalVolatility20: hv20 ? Math.round(hv20 * 100) / 100 : null,
      historicalVolatility50: hv50 ? Math.round(hv50 * 100) / 100 : null,
      vixProxy,
    };

    this.volCache.set(cacheKey, volData);
    return volData;
  }

  async getBatchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const quotes = new Map<string, Quote>();

    // Process in parallel with rate limiting handled internally
    const results = await Promise.allSettled(
      symbols.map((symbol) => this.getQuote(symbol))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        quotes.set(symbols[index], result.value);
      }
    });

    return quotes;
  }

  // Utility to clear caches (useful for testing or forced refresh)
  clearCaches(): void {
    this.quoteCache.clear();
    this.historicalCache.clear();
    this.expirationCache.clear();
    this.chainCache.clear();
    this.volCache.clear();
  }
}
