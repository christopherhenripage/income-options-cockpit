import {
  MarketDataProvider,
  TradingSettings,
  TradePacket,
  MarketRegime,
  MarketNarrative,
  SymbolSignals,
} from './types';
import { RegimeDetector, SymbolAnalyzer } from './signals';
import { getAllStrategies, StrategyContext } from './strategies';
import { TradeRanker } from './scoring';
import { NarrativeGenerator } from './narrative';
import { generateId, getCurrentTimestamp, calculateDTE } from './utils';

export interface RecomputeResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  regime: MarketRegime;
  narrative: MarketNarrative;
  symbolSignals: Map<string, SymbolSignals>;
  allCandidates: TradePacket[];
  rankedCandidates: TradePacket[];
  stats: {
    symbolsProcessed: number;
    candidatesGenerated: number;
    candidatesAfterFiltering: number;
    byStrategy: Record<string, number>;
    errors: string[];
  };
}

export interface RecomputeOptions {
  workspaceId: string;
  settingsVersionId: string;
  riskProfilePreset: string;
  symbols: string[];
  earningsDates?: Map<string, string | null>;
  minScore?: number;
  topPerStrategy?: number;
  maxPerSymbol?: number;
}

/**
 * Main orchestrator for the trade generation engine
 */
export class TradingEngine {
  private regimeDetector: RegimeDetector;
  private symbolAnalyzer: SymbolAnalyzer;
  private strategies = getAllStrategies();
  private ranker = new TradeRanker();
  private narrativeGenerator = new NarrativeGenerator();

  constructor(private provider: MarketDataProvider) {
    this.regimeDetector = new RegimeDetector(provider);
    this.symbolAnalyzer = new SymbolAnalyzer(provider);
  }

  /**
   * Run a full recompute cycle
   */
  async recompute(
    settings: TradingSettings,
    options: RecomputeOptions
  ): Promise<RecomputeResult> {
    const runId = generateId();
    const startedAt = getCurrentTimestamp();
    const errors: string[] = [];

    // Step 1: Compute market regime
    console.log(`[${runId}] Computing market regime...`);
    const regime = await this.regimeDetector.computeMarketRegime(options.symbols);

    // Step 2: Generate market narrative
    console.log(`[${runId}] Generating market narrative...`);
    const narrative = this.narrativeGenerator.generateNarrative(
      regime,
      options.workspaceId
    );

    // Step 3: Analyze all symbols
    console.log(`[${runId}] Analyzing ${options.symbols.length} symbols...`);
    const symbolSignals = await this.symbolAnalyzer.analyzeSymbols(
      options.symbols,
      settings,
      options.earningsDates
    );

    // Step 4: Generate trade candidates
    console.log(`[${runId}] Generating trade candidates...`);
    const allCandidates: TradePacket[] = [];

    for (const symbol of options.symbols) {
      const signals = symbolSignals.get(symbol);
      if (!signals) {
        errors.push(`No signals for ${symbol}`);
        continue;
      }

      try {
        const candidates = await this.generateCandidatesForSymbol(
          symbol,
          signals,
          regime,
          settings,
          options
        );
        allCandidates.push(...candidates);
      } catch (err) {
        errors.push(`Error generating candidates for ${symbol}: ${err}`);
      }
    }

    // Step 5: Rank and filter candidates
    console.log(`[${runId}] Ranking ${allCandidates.length} candidates...`);
    const rankedCandidates = this.ranker.applyAllFilters(allCandidates, settings, {
      minScore: options.minScore || 40,
      topPerStrategy: options.topPerStrategy || 3,
      maxPerSymbol: options.maxPerSymbol || 2,
      applyRiskBudget: true,
    });

    const finishedAt = getCurrentTimestamp();

    // Calculate stats
    const byStrategy: Record<string, number> = {};
    for (const candidate of rankedCandidates) {
      byStrategy[candidate.strategyType] = (byStrategy[candidate.strategyType] || 0) + 1;
    }

    return {
      runId,
      startedAt,
      finishedAt,
      regime,
      narrative,
      symbolSignals,
      allCandidates,
      rankedCandidates,
      stats: {
        symbolsProcessed: symbolSignals.size,
        candidatesGenerated: allCandidates.length,
        candidatesAfterFiltering: rankedCandidates.length,
        byStrategy,
        errors,
      },
    };
  }

  /**
   * Generate candidates for a single symbol
   */
  private async generateCandidatesForSymbol(
    symbol: string,
    signals: SymbolSignals,
    regime: MarketRegime,
    settings: TradingSettings,
    options: RecomputeOptions
  ): Promise<TradePacket[]> {
    const candidates: TradePacket[] = [];

    // Get quote
    const quote = await this.provider.getQuote(symbol);

    // Get expirations
    const expirations = await this.provider.getOptionExpirations(symbol);

    // Filter expirations to target DTE range
    const targetExpirations = expirations.filter((exp) => {
      const dte = calculateDTE(exp);
      return dte >= 14 && dte <= 60; // Broad range, strategies will further filter
    });

    // For each expiration, try each strategy
    for (const expiration of targetExpirations.slice(0, 4)) {
      // Limit to first 4 valid expirations
      const chain = await this.provider.getOptionChain(symbol, expiration);

      const context: StrategyContext = {
        quote,
        chain,
        signals,
        regime,
        settings,
        settingsVersionId: options.settingsVersionId,
        riskProfilePreset: options.riskProfilePreset,
        workspaceId: options.workspaceId,
        recomputeRunId: options.workspaceId, // Will be updated by caller
      };

      for (const strategy of this.strategies) {
        if (strategy.shouldConsider(context)) {
          const strategyCandidates = strategy.findCandidates(context);
          for (const candidate of strategyCandidates) {
            candidates.push(strategy.candidateToPacket(candidate, context));
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Get current market regime only (without generating trades)
   */
  async getMarketRegime(symbols: string[]): Promise<MarketRegime> {
    return this.regimeDetector.computeMarketRegime(symbols);
  }

  /**
   * Generate market narrative from current regime
   */
  async generateMarketNarrative(
    symbols: string[],
    workspaceId: string
  ): Promise<MarketNarrative> {
    const regime = await this.getMarketRegime(symbols);
    return this.narrativeGenerator.generateNarrative(regime, workspaceId);
  }

  /**
   * Analyze a single symbol
   */
  async analyzeSymbol(
    symbol: string,
    settings: TradingSettings,
    earningsDate?: string | null
  ): Promise<SymbolSignals> {
    return this.symbolAnalyzer.analyzeSymbol(symbol, settings, earningsDate);
  }
}
