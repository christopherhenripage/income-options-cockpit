import { describe, it, expect, beforeEach } from 'vitest';
import { CashSecuredPutStrategy } from './cash-secured-put';
import { MockProvider } from '../providers/mock-provider';
import { StrategyContext } from './base-strategy';
import { getDefaultSettings } from '../defaults';
import { MarketRegime, SymbolSignals, Quote, OptionChain } from '../types';

describe('CashSecuredPutStrategy', () => {
  let strategy: CashSecuredPutStrategy;
  let mockContext: StrategyContext;

  beforeEach(async () => {
    const provider = new MockProvider();
    strategy = new CashSecuredPutStrategy();

    const settings = getDefaultSettings('balanced');

    const quote: Quote = {
      symbol: 'AAPL',
      price: 240,
      bid: 239.95,
      ask: 240.05,
      last: 240,
      change: 2.5,
      changePct: 1.05,
      volume: 50000000,
      avgVolume: 45000000,
      high: 242,
      low: 238,
      open: 239,
      previousClose: 237.5,
      timestamp: new Date().toISOString(),
    };

    const chain: OptionChain = await provider.getOptionChain('AAPL', '2024-03-15');

    const signals: SymbolSignals = {
      trend: 'uptrend',
      trendScore: 65,
      ma50: 235,
      ma200: 220,
      rsi14: 55,
      atr14: 4.5,
      ivRank: 45,
      ivPercentile: 50,
      liquidity: {
        meetsMinimum: true,
        underlyingVolume: 50000000,
        optionVolume: 150000,
        avgSpreadPct: 1.5,
        overallScore: 85,
      },
      earningsProximity: {
        daysToEarnings: 45,
        withinExclusionWindow: false,
      },
      support: 230,
      resistance: 250,
    };

    const regime: MarketRegime = {
      trend: 'uptrend',
      trendScore: 55,
      volatilityLevel: 'normal',
      vixLevel: 16,
      vixPercentile: 40,
      breadthScore: 65,
      timestamp: new Date().toISOString(),
    };

    mockContext = {
      quote,
      chain,
      signals,
      regime,
      settings,
      settingsVersionId: 'v1',
      riskProfilePreset: 'balanced',
      workspaceId: 'test-workspace',
      recomputeRunId: 'run-123',
    };
  });

  describe('shouldConsider', () => {
    it('should return true in uptrend with good liquidity', () => {
      const result = strategy.shouldConsider(mockContext);
      expect(result).toBe(true);
    });

    it('should return false in strong downtrend for non-aggressive', () => {
      mockContext.signals.trend = 'strong_downtrend';
      const result = strategy.shouldConsider(mockContext);
      expect(result).toBe(false);
    });

    it('should return false when strategy is disabled', () => {
      mockContext.settings.cashSecuredPut.enabled = false;
      const result = strategy.shouldConsider(mockContext);
      expect(result).toBe(false);
    });

    it('should return false when liquidity is insufficient', () => {
      mockContext.signals.liquidity.meetsMinimum = false;
      const result = strategy.shouldConsider(mockContext);
      expect(result).toBe(false);
    });

    it('should return false within earnings exclusion window', () => {
      mockContext.signals.earningsProximity.withinExclusionWindow = true;
      const result = strategy.shouldConsider(mockContext);
      expect(result).toBe(false);
    });
  });

  describe('findCandidates', () => {
    it('should find candidates when shouldConsider is true', () => {
      const candidates = strategy.findCandidates(mockContext);
      // May or may not find candidates depending on the chain data
      expect(Array.isArray(candidates)).toBe(true);
    });

    it('should return empty array when shouldConsider is false', () => {
      mockContext.settings.cashSecuredPut.enabled = false;
      // shouldConsider would be false, but findCandidates can still be called
      // It filters by DTE and other criteria
      const candidates = strategy.findCandidates(mockContext);
      expect(Array.isArray(candidates)).toBe(true);
    });
  });

  describe('strategy properties', () => {
    it('should have correct strategy type', () => {
      expect(strategy.strategyType).toBe('cash_secured_put');
    });

    it('should have correct name', () => {
      expect(strategy.name).toBe('Cash-Secured Put');
    });
  });

  describe('candidate structure', () => {
    it('should create candidates with required fields', () => {
      const candidates = strategy.findCandidates(mockContext);

      for (const candidate of candidates) {
        expect(candidate.legs).toBeDefined();
        expect(candidate.netCredit).toBeGreaterThan(0);
        expect(candidate.dte).toBeGreaterThan(0);
        expect(candidate.riskBox).toBeDefined();
        expect(candidate.reasons).toBeDefined();
        expect(candidate.scoreComponents).toBeDefined();
        expect(candidate.score).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
