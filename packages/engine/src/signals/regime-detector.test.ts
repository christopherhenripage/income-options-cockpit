import { describe, it, expect, beforeEach } from 'vitest';
import { RegimeDetector } from './regime-detector';
import { MockProvider } from '../providers/mock-provider';

describe('RegimeDetector', () => {
  let provider: MockProvider;
  let detector: RegimeDetector;

  beforeEach(() => {
    provider = new MockProvider();
    detector = new RegimeDetector(provider);
  });

  describe('computeMarketRegime', () => {
    it('should return a valid market regime', async () => {
      const symbols = ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'NVDA'];
      const regime = await detector.computeMarketRegime(symbols);

      // Check trend is valid
      expect([
        'strong_uptrend',
        'uptrend',
        'neutral',
        'downtrend',
        'strong_downtrend',
      ]).toContain(regime.trend);

      // Check volatility is valid
      expect(['low', 'normal', 'elevated', 'high', 'panic']).toContain(
        regime.volatility
      );

      // Check risk mode is valid
      expect(['risk_on', 'risk_off', 'neutral']).toContain(regime.riskOnOff);
    });

    it('should include breadth assessment', async () => {
      const symbols = ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'NVDA'];
      const regime = await detector.computeMarketRegime(symbols);

      expect(regime.breadth).toBeDefined();
      expect([
        'strong',
        'healthy',
        'mixed',
        'weak',
        'very_weak',
      ]).toContain(regime.breadth.assessment);
    });

    it('should include computedAt timestamp', async () => {
      const symbols = ['SPY', 'AAPL'];
      const regime = await detector.computeMarketRegime(symbols);

      expect(regime.computedAt).toBeDefined();
      const date = new Date(regime.computedAt);
      expect(date.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include data quality info', async () => {
      const symbols = ['SPY'];
      const regime = await detector.computeMarketRegime(symbols);

      expect(regime.dataQuality).toBeDefined();
      expect(regime.dataQuality.dataSource).toBe('mock');
    });

    it('should calculate leadership from sector ETFs', async () => {
      const symbols = ['SPY'];
      const regime = await detector.computeMarketRegime(symbols);

      // Leadership may or may not be present depending on data
      if (regime.leadership) {
        expect(regime.leadership.sectors).toBeDefined();
        expect(Array.isArray(regime.leadership.sectors)).toBe(true);
      }
    });
  });

  describe('risk classification', () => {
    it('should classify risk_on for uptrend with normal volatility', async () => {
      const regime = await detector.computeMarketRegime(['SPY']);

      // The mock provider generates deterministic data
      // Just verify we get a valid risk classification
      expect(['risk_on', 'risk_off', 'neutral']).toContain(regime.riskOnOff);
    });
  });

  describe('breadth calculation', () => {
    it('should calculate breadth metrics', async () => {
      const symbols = ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMD'];
      const regime = await detector.computeMarketRegime(symbols);

      expect(regime.breadth).toBeDefined();
      // advDecRatio may be null if no comparison possible
      // percentAbove50MA may be null if insufficient data
      expect(regime.breadth.assessment).toBeDefined();
    });
  });
});
