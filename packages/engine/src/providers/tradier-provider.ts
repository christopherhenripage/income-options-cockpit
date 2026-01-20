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

// Tradier API response types
interface TradierQuoteResponse {
  quotes: {
    quote: TradierQuote | TradierQuote[];
  };
}

interface TradierQuote {
  symbol: string;
  description: string;
  last: number;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  close: number;
  prevclose: number;
  volume: number;
  average_volume: number;
  change: number;
  change_percentage: number;
}

interface TradierHistoryResponse {
  history: {
    day: TradierHistoryDay[] | TradierHistoryDay;
  } | null;
}

interface TradierHistoryDay {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradierExpirationsResponse {
  expirations: {
    date: string[] | string;
  } | null;
}

interface TradierOptionChainResponse {
  options: {
    option: TradierOption[] | TradierOption;
  } | null;
}

interface TradierOption {
  symbol: string;
  description: string;
  underlying: string;
  strike: number;
  expiration_date: string;
  option_type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  greeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    mid_iv: number;
  };
}

/**
 * Tradier Market Data Provider
 * Uses Tradier's API for stock quotes and options data
 * Sandbox provides 15-minute delayed data for free
 */
export class TradierProvider implements MarketDataProvider {
  name = 'tradier';

  private apiKey: string;
  private baseUrl: string;
  private quoteCache = new SimpleCache<Quote>(60); // 1 min cache
  private historyCache = new SimpleCache<HistoricalPrice[]>(300); // 5 min cache
  private expirationCache = new SimpleCache<string[]>(300); // 5 min cache
  private chainCache = new SimpleCache<OptionChain>(60); // 1 min cache

  constructor(apiKey?: string, useSandbox: boolean = true) {
    this.apiKey = (apiKey || process.env.TRADIER_API_KEY || '').trim();
    this.baseUrl = useSandbox
      ? 'https://sandbox.tradier.com/v1'
      : 'https://api.tradier.com/v1';

    if (!this.apiKey) {
      throw new Error('Tradier API key is required');
    }
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Tradier API: Unauthorized - check your API key');
      }
      if (response.status === 429) {
        throw new Error('Tradier API: Rate limit exceeded');
      }
      throw new Error(`Tradier API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const cacheKey = `quote-${symbol}`;
    const cached = this.quoteCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetch<TradierQuoteResponse>(
      `/markets/quotes?symbols=${encodeURIComponent(symbol)}`
    );

    if (!data.quotes?.quote) {
      throw new Error(`No quote data for symbol: ${symbol}`);
    }

    const q = Array.isArray(data.quotes.quote) ? data.quotes.quote[0] : data.quotes.quote;

    const quote: Quote = {
      symbol: q.symbol,
      price: q.last || q.close,
      bid: q.bid,
      ask: q.ask,
      open: q.open,
      high: q.high,
      low: q.low,
      previousClose: q.prevclose,
      volume: q.volume,
      avgVolume: q.average_volume,
      timestamp: getCurrentTimestamp(),
    };

    this.quoteCache.set(cacheKey, quote);
    return quote;
  }

  async getBatchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const results = new Map<string, Quote>();

    // Tradier supports batch quotes
    const symbolList = symbols.join(',');
    const data = await this.fetch<TradierQuoteResponse>(
      `/markets/quotes?symbols=${encodeURIComponent(symbolList)}`
    );

    if (!data.quotes?.quote) {
      return results;
    }

    const quotes = Array.isArray(data.quotes.quote) ? data.quotes.quote : [data.quotes.quote];

    for (const q of quotes) {
      const quote: Quote = {
        symbol: q.symbol,
        price: q.last || q.close,
        bid: q.bid,
        ask: q.ask,
        open: q.open,
        high: q.high,
        low: q.low,
        previousClose: q.prevclose,
        volume: q.volume,
        avgVolume: q.average_volume,
        timestamp: getCurrentTimestamp(),
      };
      results.set(q.symbol, quote);
      this.quoteCache.set(`quote-${q.symbol}`, quote);
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

    // Calculate date range
    const end = new Date();
    const start = new Date();
    const days = range === '1M' ? 30 : range === '3M' ? 90 : range === '6M' ? 180 : 365;
    start.setDate(start.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const data = await this.fetch<TradierHistoryResponse>(
      `/markets/history?symbol=${encodeURIComponent(symbol)}&interval=daily&start=${startStr}&end=${endStr}`
    );

    if (!data.history?.day) {
      throw new Error(`No historical data for symbol: ${symbol}`);
    }

    const days_data = Array.isArray(data.history.day) ? data.history.day : [data.history.day];

    const prices: HistoricalPrice[] = days_data.map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    this.historyCache.set(cacheKey, prices);
    return prices;
  }

  async getOptionExpirations(symbol: string): Promise<string[]> {
    const cacheKey = `exp-${symbol}`;
    const cached = this.expirationCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetch<TradierExpirationsResponse>(
      `/markets/options/expirations?symbol=${encodeURIComponent(symbol)}`
    );

    if (!data.expirations?.date) {
      throw new Error(`No options expirations for symbol: ${symbol}`);
    }

    const expirations = Array.isArray(data.expirations.date)
      ? data.expirations.date
      : [data.expirations.date];

    // Filter to future expirations only
    const today = new Date().toISOString().split('T')[0];
    const futureExpirations = expirations.filter((exp) => exp >= today);

    this.expirationCache.set(cacheKey, futureExpirations);
    return futureExpirations;
  }

  async getOptionChain(symbol: string, expiration: string): Promise<OptionChain> {
    const cacheKey = `chain-${symbol}-${expiration}`;
    const cached = this.chainCache.get(cacheKey);
    if (cached) return cached;

    // Get underlying price for ITM calculation
    const quote = await this.getQuote(symbol);
    const underlyingPrice = quote.price;

    const data = await this.fetch<TradierOptionChainResponse>(
      `/markets/options/chains?symbol=${encodeURIComponent(symbol)}&expiration=${expiration}&greeks=true`
    );

    if (!data.options?.option) {
      throw new Error(`No options chain for ${symbol} expiring ${expiration}`);
    }

    const options = Array.isArray(data.options.option) ? data.options.option : [data.options.option];

    const calls: OptionContract[] = [];
    const puts: OptionContract[] = [];

    for (const opt of options) {
      const contract: OptionContract = {
        symbol: opt.symbol,
        underlying: opt.underlying || symbol,
        expiration: opt.expiration_date,
        strike: opt.strike,
        type: opt.option_type,
        bid: opt.bid || 0,
        ask: opt.ask || 0,
        last: opt.last || null,
        volume: opt.volume || 0,
        openInterest: opt.open_interest || 0,
        impliedVolatility: opt.greeks?.mid_iv || null,
        delta: opt.greeks?.delta || null,
        gamma: opt.greeks?.gamma || null,
        theta: opt.greeks?.theta || null,
        vega: opt.greeks?.vega || null,
        inTheMoney:
          opt.option_type === 'call'
            ? opt.strike < underlyingPrice
            : opt.strike > underlyingPrice,
      };

      if (opt.option_type === 'call') {
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
      // Find expiration ~30 days out
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
      const targetStr = targetDate.toISOString().split('T')[0];

      const nearestExp = expirations.reduce((prev, curr) => {
        return Math.abs(new Date(curr).getTime() - targetDate.getTime()) <
          Math.abs(new Date(prev).getTime() - targetDate.getTime())
          ? curr
          : prev;
      });

      const chain = await this.getOptionChain(symbol, nearestExp);
      const quote = await this.getQuote(symbol);

      // Find ATM options
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
    } catch (e) {
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
