import { z } from 'zod';

// ============================================================
// Core Market Data Types
// ============================================================

export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  bid: z.number(),
  ask: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  previousClose: z.number(),
  volume: z.number(),
  avgVolume: z.number(),
  timestamp: z.string(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const HistoricalPriceSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
export type HistoricalPrice = z.infer<typeof HistoricalPriceSchema>;

export const OptionContractSchema = z.object({
  symbol: z.string(), // OCC symbol
  underlying: z.string(),
  expiration: z.string(), // YYYY-MM-DD
  strike: z.number(),
  type: z.enum(['call', 'put']),
  bid: z.number(),
  ask: z.number(),
  last: z.number().nullable(),
  volume: z.number(),
  openInterest: z.number(),
  impliedVolatility: z.number().nullable(),
  delta: z.number().nullable(),
  gamma: z.number().nullable(),
  theta: z.number().nullable(),
  vega: z.number().nullable(),
  inTheMoney: z.boolean(),
});
export type OptionContract = z.infer<typeof OptionContractSchema>;

export const OptionChainSchema = z.object({
  underlying: z.string(),
  expiration: z.string(),
  calls: z.array(OptionContractSchema),
  puts: z.array(OptionContractSchema),
});
export type OptionChain = z.infer<typeof OptionChainSchema>;

export const VolatilityDataSchema = z.object({
  symbol: z.string(),
  currentIV: z.number().nullable(),
  ivRank: z.number().nullable(), // 0-100
  ivPercentile: z.number().nullable(), // 0-100
  historicalVolatility20: z.number().nullable(),
  historicalVolatility50: z.number().nullable(),
  vixProxy: z.number().nullable(),
});
export type VolatilityData = z.infer<typeof VolatilityDataSchema>;

// ============================================================
// Regime & Signal Types
// ============================================================

export const TrendRegimeSchema = z.enum([
  'strong_uptrend',
  'uptrend',
  'neutral',
  'downtrend',
  'strong_downtrend',
]);
export type TrendRegime = z.infer<typeof TrendRegimeSchema>;

export const VolatilityRegimeSchema = z.enum([
  'low',
  'normal',
  'elevated',
  'high',
  'panic',
]);
export type VolatilityRegime = z.infer<typeof VolatilityRegimeSchema>;

export const MarketRegimeSchema = z.object({
  trend: TrendRegimeSchema,
  volatility: VolatilityRegimeSchema,
  riskOnOff: z.enum(['risk_on', 'neutral', 'risk_off']),
  breadth: z.object({
    advDecRatio: z.number().nullable(),
    percentAbove50MA: z.number().nullable(),
    assessment: z.enum(['strong', 'healthy', 'mixed', 'weak', 'very_weak']),
  }),
  leadership: z.object({
    sectors: z.array(z.object({
      symbol: z.string(),
      name: z.string(),
      trendScore: z.number(),
    })),
  }).nullable(),
  computedAt: z.string(),
  dataQuality: z.object({
    hasFullData: z.boolean(),
    missingFields: z.array(z.string()),
    dataSource: z.string(),
  }),
});
export type MarketRegime = z.infer<typeof MarketRegimeSchema>;

export const SymbolSignalsSchema = z.object({
  symbol: z.string(),
  trend: TrendRegimeSchema,
  trendScore: z.number(), // -100 to 100
  ma50: z.number(),
  ma200: z.number(),
  priceVsMa50Pct: z.number(),
  priceVsMa200Pct: z.number(),
  volatility: VolatilityRegimeSchema,
  ivRank: z.number().nullable(),
  liquidity: z.object({
    volumeScore: z.number(), // 0-100
    optionOIScore: z.number(), // 0-100
    spreadScore: z.number(), // 0-100
    overallScore: z.number(), // 0-100
    meetsMinimum: z.boolean(),
  }),
  earningsProximity: z.object({
    daysToEarnings: z.number().nullable(),
    withinExclusionWindow: z.boolean(),
  }),
  computedAt: z.string(),
});
export type SymbolSignals = z.infer<typeof SymbolSignalsSchema>;

// ============================================================
// Strategy Types
// ============================================================

export const StrategyTypeSchema = z.enum([
  'cash_secured_put',
  'covered_call',
  'put_credit_spread',
  'call_credit_spread',
]);
export type StrategyType = z.infer<typeof StrategyTypeSchema>;

export const OptionLegSchema = z.object({
  action: z.enum(['buy', 'sell']),
  quantity: z.number(),
  option: OptionContractSchema,
  orderPrice: z.number(), // mid price to use
});
export type OptionLeg = z.infer<typeof OptionLegSchema>;

export const RiskBoxSchema = z.object({
  maxProfit: z.number(),
  maxLoss: z.number(),
  breakeven: z.number(),
  breakevenLower: z.number().nullable(), // for spreads
  breakevenUpper: z.number().nullable(),
  buyingPowerRequired: z.number(),
  collateralRequired: z.number(),
  returnOnRisk: z.number(), // annualized %
  returnOnCapital: z.number(), // raw %
  probabilityOfProfit: z.number().nullable(), // estimated
});
export type RiskBox = z.infer<typeof RiskBoxSchema>;

export const ExitRulesSchema = z.object({
  profitTargetPct: z.number(),
  maxLossPct: z.number().nullable(),
  dteExit: z.number(),
  rollGuidance: z.string().nullable(),
});
export type ExitRules = z.infer<typeof ExitRulesSchema>;

export const InvalidationConditionSchema = z.object({
  type: z.enum(['trend_break', 'vol_spike', 'liquidity_deterioration', 'earnings_approaching', 'price_breach']),
  description: z.string(),
  threshold: z.string(),
});
export type InvalidationCondition = z.infer<typeof InvalidationConditionSchema>;

export const ReasonSchema = z.object({
  category: z.string(),
  check: z.string(),
  passed: z.boolean(),
  value: z.string(),
  threshold: z.string(),
  weight: z.number(),
  contribution: z.number(), // to final score
});
export type Reason = z.infer<typeof ReasonSchema>;

export const ScoreComponentSchema = z.object({
  name: z.string(),
  rawValue: z.number(),
  normalizedScore: z.number(), // 0-100
  weight: z.number(),
  weightedScore: z.number(),
});
export type ScoreComponent = z.infer<typeof ScoreComponentSchema>;

export const ConvictionMeterSchema = z.object({
  confidence: z.number(), // 0-100
  uncertainty: z.number(), // 0-100
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    description: z.string(),
  })),
});
export type ConvictionMeter = z.infer<typeof ConvictionMeterSchema>;

// ============================================================
// Trade Packet (The Core Output)
// ============================================================

export const TradePacketSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdAt: z.string(),
  symbol: z.string(),
  strategyType: StrategyTypeSchema,
  status: z.enum(['candidate', 'approved', 'executed', 'expired', 'rejected']),

  // Market Context
  underlyingPrice: z.number(),
  marketRegime: MarketRegimeSchema,
  symbolSignals: SymbolSignalsSchema,

  // Strategy Details
  legs: z.array(OptionLegSchema),
  netCredit: z.number(),
  netDebit: z.number().nullable(),
  dte: z.number(),

  // Risk Analysis
  riskBox: RiskBoxSchema,
  exitRules: ExitRulesSchema,
  invalidationConditions: z.array(InvalidationConditionSchema),

  // Scoring & Reasoning
  score: z.number(), // 0-100
  scoreComponents: z.array(ScoreComponentSchema),
  reasons: z.array(ReasonSchema),
  conviction: ConvictionMeterSchema,

  // Provenance
  settingsVersionId: z.string(),
  riskProfilePreset: z.string(),
  recomputeRunId: z.string(),

  // Order Guidance
  orderTicketInstructions: z.string(),

  // Explanations
  plainEnglishSummary: z.string(),
  learningNotes: z.array(z.object({
    topic: z.string(),
    explanation: z.string(),
  })),
});
export type TradePacket = z.infer<typeof TradePacketSchema>;

// ============================================================
// Settings & Risk Profile Types
// ============================================================

export const RiskProfilePresetSchema = z.enum([
  'conservative',
  'balanced',
  'aggressive',
]);
export type RiskProfilePreset = z.infer<typeof RiskProfilePresetSchema>;

export const StrategySettingsSchema = z.object({
  enabled: z.boolean(),
  minDTE: z.number(),
  maxDTE: z.number(),
  targetDeltaMin: z.number(),
  targetDeltaMax: z.number(),
  profitTargetPct: z.number(),
  maxLossPct: z.number().nullable(),
});
export type StrategySettings = z.infer<typeof StrategySettingsSchema>;

export const SpreadSettingsSchema = StrategySettingsSchema.extend({
  spreadWidth: z.number(), // in dollars
  minCredit: z.number(),
});
export type SpreadSettings = z.infer<typeof SpreadSettingsSchema>;

export const LiquidityFiltersSchema = z.object({
  minUnderlyingVolume: z.number(),
  minOptionOI: z.number(),
  minOptionVolume: z.number(),
  maxBidAskSpreadPct: z.number(),
});
export type LiquidityFilters = z.infer<typeof LiquidityFiltersSchema>;

export const RiskLimitsSchema = z.object({
  maxRiskPerTradePct: z.number().max(5),
  maxTotalRiskPct: z.number().max(25),
  dailyLossLimitPct: z.number(),
  dailyLossLimitUsd: z.number().nullable(),
  maxNewOrdersPerDay: z.number(),
  accountSize: z.number().nullable(), // for estimation
});
export type RiskLimits = z.infer<typeof RiskLimitsSchema>;

export const TradingSettingsSchema = z.object({
  // Global toggles
  tradingEnabled: z.boolean(),
  brokerExecutionEnabled: z.boolean(),
  paperModeEnabled: z.boolean(),

  // Risk limits
  riskLimits: RiskLimitsSchema,

  // Liquidity filters
  liquidityFilters: LiquidityFiltersSchema,

  // Earnings
  earningsExclusionDays: z.number(),

  // Strategy-specific settings
  cashSecuredPut: StrategySettingsSchema,
  coveredCall: StrategySettingsSchema,
  putCreditSpread: SpreadSettingsSchema,
  callCreditSpread: SpreadSettingsSchema,

  // Regime preferences
  preferredVolRegimes: z.array(VolatilityRegimeSchema),
  preferredTrendRegimes: z.array(TrendRegimeSchema),
});
export type TradingSettings = z.infer<typeof TradingSettingsSchema>;

// ============================================================
// Market Narrative Types
// ============================================================

export const MarketNarrativeSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  date: z.string(),
  createdAt: z.string(),
  title: z.string(),

  // Structured data
  regime: MarketRegimeSchema,

  // Narrative sections
  summary: z.string(),
  trendAnalysis: z.string(),
  volatilityAnalysis: z.string(),
  breadthAnalysis: z.string(),
  leadershipAnalysis: z.string().nullable(),
  strategyImplications: z.string(),

  // Recommendations
  preferredStrategies: z.array(StrategyTypeSchema),
  cautionFlags: z.array(z.string()),

  // Data quality
  dataQuality: z.object({
    hasFullData: z.boolean(),
    missingFields: z.array(z.string()),
  }),
});
export type MarketNarrative = z.infer<typeof MarketNarrativeSchema>;

// ============================================================
// Provider Interface Types
// ============================================================

export interface MarketDataProvider {
  name: string;
  getQuote(symbol: string): Promise<Quote>;
  getHistoricalPrices(symbol: string, range: '1M' | '3M' | '6M' | '1Y'): Promise<HistoricalPrice[]>;
  getOptionExpirations(symbol: string): Promise<string[]>;
  getOptionChain(symbol: string, expiration: string): Promise<OptionChain>;
  getVolatilityData(symbol: string): Promise<VolatilityData>;
  getBatchQuotes(symbols: string[]): Promise<Map<string, Quote>>;
}

// ============================================================
// Broker Types
// ============================================================

export const BrokerOrderStatusSchema = z.enum([
  'pending',
  'submitted',
  'filled',
  'partial_fill',
  'cancelled',
  'rejected',
  'expired',
]);
export type BrokerOrderStatus = z.infer<typeof BrokerOrderStatusSchema>;

export const BrokerOrderRequestSchema = z.object({
  tradePacketId: z.string(),
  legs: z.array(z.object({
    action: z.enum(['buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close']),
    symbol: z.string(),
    quantity: z.number(),
    orderType: z.enum(['limit', 'market']),
    limitPrice: z.number().nullable(),
  })),
  orderType: z.enum(['net_credit', 'net_debit', 'even']),
  limitPrice: z.number(),
  duration: z.enum(['day', 'gtc']),
});
export type BrokerOrderRequest = z.infer<typeof BrokerOrderRequestSchema>;

export interface BrokerProvider {
  name: string;
  isConnected(): Promise<boolean>;
  createOrderPayload(packet: TradePacket): BrokerOrderRequest;
  validateOrder(request: BrokerOrderRequest): Promise<{ valid: boolean; errors: string[] }>;
  submitOrder(request: BrokerOrderRequest): Promise<{
    success: boolean;
    orderId: string | null;
    error: string | null;
  }>;
  getOrderStatus(orderId: string): Promise<{
    status: BrokerOrderStatus;
    filledQuantity: number;
    fillPrice: number | null;
  }>;
  cancelOrder(orderId: string): Promise<{ success: boolean; error: string | null }>;
}

// ============================================================
// Paper Trading Types
// ============================================================

export const PaperPositionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  tradePacketId: z.string(),
  symbol: z.string(),
  strategyType: StrategyTypeSchema,
  openedAt: z.string(),
  closedAt: z.string().nullable(),
  status: z.enum(['open', 'closed', 'expired']),
  legs: z.array(OptionLegSchema),
  entryCredit: z.number(),
  exitDebit: z.number().nullable(),
  realizedPnL: z.number().nullable(),
  currentPnL: z.number(),
  currentValue: z.number(),
  notes: z.string().nullable(),
});
export type PaperPosition = z.infer<typeof PaperPositionSchema>;

export const PaperFillSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  tradePacketId: z.string(),
  fillTime: z.string(),
  legs: z.array(z.object({
    symbol: z.string(),
    quantity: z.number(),
    fillPrice: z.number(),
  })),
  netFillPrice: z.number(),
  slippageBps: z.number(),
  notes: z.string().nullable(),
});
export type PaperFill = z.infer<typeof PaperFillSchema>;

// ============================================================
// Workspace & Collaboration Types
// ============================================================

export const WorkspaceRoleSchema = z.enum(['owner', 'admin', 'viewer']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const CommentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  entityType: z.enum(['trade_packet', 'narrative', 'run']),
  entityId: z.string(),
  authorUserId: z.string(),
  authorDisplayName: z.string(),
  body: z.string(),
  tag: z.enum(['question', 'insight', 'risk_note', 'general']).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type Comment = z.infer<typeof CommentSchema>;

// ============================================================
// Journal & Discipline Types
// ============================================================

export const JournalEntrySchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdAt: z.string(),
  relatedTradePacketId: z.string().nullable(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  mood: z.enum(['confident', 'cautious', 'uncertain', 'learning']).nullable(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const DisciplineBadgeSchema = z.object({
  type: z.enum([
    'risk_discipline_streak',
    'journaling_streak',
    'max_drawdown_controlled',
    'profit_target_adherence',
  ]),
  level: z.number(),
  earnedAt: z.string(),
  description: z.string(),
});
export type DisciplineBadge = z.infer<typeof DisciplineBadgeSchema>;

// ============================================================
// Recompute Run Types
// ============================================================

export const RecomputeRunSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  provider: z.string(),
  symbolsProcessed: z.number(),
  tradesGenerated: z.number(),
  notes: z.string().nullable(),
  errorJson: z.any().nullable(),
});
export type RecomputeRun = z.infer<typeof RecomputeRunSchema>;
