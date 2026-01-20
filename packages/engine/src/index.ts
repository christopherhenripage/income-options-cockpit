// Types
export * from './types';

// Providers
export { MockProvider, MOCK_SYMBOLS, PolygonProvider, TradierProvider, YahooFinanceProvider } from './providers';
export type { MarketDataProvider } from './providers';

// Signals
export { RegimeDetector, SymbolAnalyzer } from './signals';

// Strategies
export {
  BaseStrategy,
  CashSecuredPutStrategy,
  CoveredCallStrategy,
  PutCreditSpreadStrategy,
  CallCreditSpreadStrategy,
  getAllStrategies,
} from './strategies';
export type { StrategyContext, StrategyCandidate } from './strategies';

// Scoring
export { TradeRanker } from './scoring';

// Narrative
export { NarrativeGenerator } from './narrative';

// Orchestrator
export { TradingEngine } from './orchestrator';
export type { RecomputeResult, RecomputeOptions } from './orchestrator';

// Defaults
export {
  DEFAULT_SETTINGS,
  DEFAULT_SYMBOLS,
  getDefaultSettings,
  validateSettings,
  calculateSettingsDiff,
} from './defaults';

// Utils
export * from './utils';

// Cache
export {
  Cache,
  memoize,
  memoizeAsync,
  symbolSignalsCache,
  marketRegimeCache,
  optionChainCache,
  quoteCache,
} from './cache';

// Brokers
export {
  // Types
  type BrokerProvider,
  type BrokerConfig,
  type Order,
  type OrderRequest,
  type OrderResponse,
  type OrderLeg,
  type AccountInfo,
  type BrokerPosition,
  // Providers
  ManualBrokerProvider,
  PaperBrokerProvider,
  SchwabBrokerProvider,
  // Factory
  createBrokerProvider,
  BrokerExecutionManager,
} from './brokers';
export type { PaperProviderConfig, SchwabConfig } from './brokers';
