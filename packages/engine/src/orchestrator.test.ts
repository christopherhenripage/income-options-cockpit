import { describe, it, expect, beforeEach } from 'vitest';
import { TradingEngine } from './orchestrator';
import { MockProvider } from './providers/mock-provider';
import { DEFAULT_SETTINGS, getDefaultSettings } from './defaults';

describe('TradingEngine', () => {
  let engine: TradingEngine;
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
    engine = new TradingEngine(provider);
  });

  describe('recompute', () => {
    it('should run full recompute cycle', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'NVDA'],
      });

      expect(result).toBeDefined();
      expect(result.regime).toBeDefined();
      expect(result.narrative).toBeDefined();
      expect(result.rankedCandidates).toBeDefined();
      expect(Array.isArray(result.rankedCandidates)).toBe(true);
    });

    it('should return market regime', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY', 'QQQ'],
      });

      const { regime } = result;

      expect(regime.trend).toBeDefined();
      expect(regime.volatility).toBeDefined();
    });

    it('should return narrative', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY', 'AAPL'],
      });

      const { narrative } = result;

      expect(narrative.title).toBeDefined();
      expect(narrative.summary).toBeDefined();
    });

    it('should respect disabled strategies', async () => {
      const settings = getDefaultSettings('balanced');
      // Disable all strategies
      settings.cashSecuredPut.enabled = false;
      settings.coveredCall.enabled = false;
      settings.putCreditSpread.enabled = false;
      settings.callCreditSpread.enabled = false;

      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY', 'AAPL'],
      });

      // With all strategies disabled, should have no trade packets
      expect(result.rankedCandidates).toHaveLength(0);
    });

    it('should rank trade packets by score', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMD', 'META', 'AMZN'],
      });

      const { rankedCandidates } = result;

      // If we have multiple packets, they should be in descending score order
      if (rankedCandidates.length > 1) {
        for (let i = 1; i < rankedCandidates.length; i++) {
          expect(rankedCandidates[i - 1].score).toBeGreaterThanOrEqual(
            rankedCandidates[i].score
          );
        }
      }
    });

    it('should include timing information', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY'],
      });

      expect(result.startedAt).toBeDefined();
      expect(result.finishedAt).toBeDefined();
    });
  });

  describe('trade packet structure', () => {
    it('should have valid trade packet fields', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'NVDA'],
      });

      for (const packet of result.rankedCandidates) {
        // Basic info
        expect(packet.id).toBeDefined();
        expect(packet.symbol).toBeDefined();
        expect(packet.strategyType).toBeDefined();

        // Strategy must be defined-risk
        expect([
          'cash_secured_put',
          'covered_call',
          'put_credit_spread',
          'call_credit_spread',
        ]).toContain(packet.strategyType);

        // Ranking score
        expect(packet.score).toBeGreaterThanOrEqual(0);
        expect(packet.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('symbol analysis', () => {
    it('should analyze all symbols', async () => {
      const symbols = ['SPY', 'AAPL', 'MSFT'];
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols,
      });

      expect(result.symbolSignals).toBeDefined();
      expect(result.symbolSignals.size).toBe(symbols.length);
    });
  });

  describe('error handling', () => {
    it('should handle empty symbol list', async () => {
      const settings = getDefaultSettings('balanced');
      const result = await engine.recompute(settings, {
        workspaceId: 'test-workspace',
        settingsVersionId: 'v1',
        riskProfilePreset: 'balanced',
        symbols: [],
      });

      expect(result.rankedCandidates).toHaveLength(0);
    });
  });

  describe('getMarketRegime', () => {
    it('should return regime for symbols', async () => {
      const regime = await engine.getMarketRegime(['SPY', 'QQQ']);

      expect(regime).toBeDefined();
      expect(regime.trend).toBeDefined();
    });
  });
});
