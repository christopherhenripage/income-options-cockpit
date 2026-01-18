import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider, MOCK_SYMBOLS } from './mock-provider';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('getQuote', () => {
    it('should return quote for known symbol', async () => {
      const quote = await provider.getQuote('SPY');

      expect(quote.symbol).toBe('SPY');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.bid).toBeGreaterThan(0);
      expect(quote.ask).toBeGreaterThan(0);
      expect(quote.bid).toBeLessThanOrEqual(quote.ask);
      expect(quote.volume).toBeGreaterThan(0);
    });

    it('should throw for unknown symbol', async () => {
      await expect(provider.getQuote('UNKNOWN')).rejects.toThrow('Unknown symbol');
    });

    it('should return consistent data for same symbol', async () => {
      const quote1 = await provider.getQuote('AAPL');
      const quote2 = await provider.getQuote('AAPL');

      expect(quote1.price).toBe(quote2.price);
      expect(quote1.symbol).toBe(quote2.symbol);
    });
  });

  describe('getBatchQuotes', () => {
    it('should return quotes for multiple symbols', async () => {
      const quotes = await provider.getBatchQuotes(['SPY', 'AAPL', 'MSFT']);

      expect(quotes.size).toBe(3);
      expect(quotes.has('SPY')).toBe(true);
      expect(quotes.has('AAPL')).toBe(true);
      expect(quotes.has('MSFT')).toBe(true);
    });

    it('should skip unknown symbols without throwing', async () => {
      const quotes = await provider.getBatchQuotes(['SPY', 'UNKNOWN']);

      expect(quotes.size).toBe(1);
      expect(quotes.has('SPY')).toBe(true);
      expect(quotes.has('UNKNOWN')).toBe(false);
    });
  });

  describe('getHistoricalPrices', () => {
    it('should return historical prices for specified range', async () => {
      const history = await provider.getHistoricalPrices('SPY', '1M');

      expect(history.length).toBeGreaterThan(0);
      // 1 month should have roughly 20-22 trading days
      expect(history.length).toBeGreaterThanOrEqual(15);
      expect(history.length).toBeLessThanOrEqual(30);
    });

    it('should return data with valid OHLCV', async () => {
      const history = await provider.getHistoricalPrices('AAPL', '1M');

      for (const bar of history) {
        expect(bar.open).toBeGreaterThan(0);
        expect(bar.close).toBeGreaterThan(0);
        expect(bar.volume).toBeGreaterThan(0);
        expect(bar.high).toBeDefined();
        expect(bar.low).toBeDefined();
      }
    });

    it('should return different data for different ranges', async () => {
      const oneMonth = await provider.getHistoricalPrices('SPY', '1M');
      const threeMonth = await provider.getHistoricalPrices('SPY', '3M');
      const oneYear = await provider.getHistoricalPrices('SPY', '1Y');

      expect(threeMonth.length).toBeGreaterThan(oneMonth.length);
      expect(oneYear.length).toBeGreaterThan(threeMonth.length);
    });
  });

  describe('getOptionChain', () => {
    it('should return option chain with calls and puts', async () => {
      const expirations = await provider.getOptionExpirations('AAPL');
      const chain = await provider.getOptionChain('AAPL', expirations[0]);

      expect(chain.calls.length).toBeGreaterThan(0);
      expect(chain.puts.length).toBeGreaterThan(0);
    });

    it('should return valid option contracts', async () => {
      const expirations = await provider.getOptionExpirations('SPY');
      const chain = await provider.getOptionChain('SPY', expirations[0]);

      for (const call of chain.calls) {
        expect(call.underlying).toBe('SPY');
        expect(call.type).toBe('call');
        expect(call.strike).toBeGreaterThan(0);
        expect(call.bid).toBeGreaterThanOrEqual(0);
        expect(call.ask).toBeGreaterThan(0);
        expect(call.delta).toBeGreaterThanOrEqual(0);
        expect(call.delta).toBeLessThanOrEqual(1);
      }

      for (const put of chain.puts) {
        expect(put.underlying).toBe('SPY');
        expect(put.type).toBe('put');
        expect(put.strike).toBeGreaterThan(0);
        expect(put.delta).toBeLessThanOrEqual(0);
        expect(put.delta).toBeGreaterThanOrEqual(-1);
      }
    });

    it('should return IV data for options', async () => {
      const expirations = await provider.getOptionExpirations('MSFT');
      const chain = await provider.getOptionChain('MSFT', expirations[0]);

      for (const option of [...chain.calls, ...chain.puts]) {
        expect(option.impliedVolatility).toBeGreaterThan(0);
      }
    });
  });

  describe('getOptionExpirations', () => {
    it('should return array of expiration dates', async () => {
      const expirations = await provider.getOptionExpirations('AAPL');

      expect(expirations.length).toBeGreaterThan(0);
      expect(expirations[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return valid future dates', async () => {
      const expirations = await provider.getOptionExpirations('SPY');
      const today = new Date().toISOString().split('T')[0];

      for (const exp of expirations) {
        expect(exp >= today).toBe(true);
      }
    });
  });

  describe('getVolatilityData', () => {
    it('should return volatility data', async () => {
      const volData = await provider.getVolatilityData('SPY');

      expect(volData.symbol).toBe('SPY');
      expect(volData.currentIV).toBeGreaterThan(0);
      expect(volData.ivRank).toBeGreaterThanOrEqual(0);
      expect(volData.ivRank).toBeLessThanOrEqual(100);
    });
  });

  describe('MOCK_SYMBOLS', () => {
    it('should contain expected symbols', () => {
      expect(MOCK_SYMBOLS).toContain('SPY');
      expect(MOCK_SYMBOLS).toContain('QQQ');
      expect(MOCK_SYMBOLS).toContain('AAPL');
      expect(MOCK_SYMBOLS).toContain('MSFT');
    });

    it('should have at least 10 symbols', () => {
      expect(MOCK_SYMBOLS.length).toBeGreaterThanOrEqual(10);
    });
  });
});
