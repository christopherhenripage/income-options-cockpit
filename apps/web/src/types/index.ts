// Shared TypeScript interfaces for the web app

import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export engine types
export type {
  TradePacket,
  TradingSettings,
  MarketRegime,
  SymbolSignals,
  OptionContract,
  RiskProfilePreset,
} from '@cockpit/engine';

// Supabase client type
export type TypedSupabaseClient = SupabaseClient;

// Trade candidate for display
export interface TradeCandidate {
  id: string;
  symbol: string;
  strategyType: 'cash_secured_put' | 'covered_call' | 'put_credit_spread' | 'call_credit_spread';
  strike: number;
  expiration: string;
  premium: number;
  maxRisk: number;
  annualizedReturn: number;
  dte: number;
  confidenceScore: number;
  status: 'candidate' | 'approved' | 'executed' | 'expired' | 'rejected';
  createdAt: string;
  delta?: number;
  iv?: number;
  underlyingPrice?: number;
}

// Paper position
export interface PaperPosition {
  id: string;
  userId: string;
  workspaceId: string;
  symbol: string;
  strategyType: string;
  entryPrice: number;
  quantity: number;
  strike: number;
  expiration: string;
  status: 'open' | 'closed';
  entryDate: string;
  exitDate?: string;
  exitPrice?: number;
  realizedPnl?: number;
  notes?: string;
}

// Journal entry
export interface JournalEntry {
  id: string;
  userId: string;
  workspaceId: string;
  positionId?: string;
  entryType: 'trade_reflection' | 'daily_review' | 'lesson_learned' | 'market_observation';
  content: string;
  tags: string[];
  mood?: 'confident' | 'neutral' | 'anxious' | 'frustrated';
  createdAt: string;
  updatedAt: string;
}

// Badge
export interface Badge {
  id: string;
  userId: string;
  workspaceId: string;
  badgeType: string;
  level: number;
  description: string;
  earnedAt: string;
  name?: string;
  icon?: string;
  nextLevel?: number;
}

// Comment
export interface Comment {
  id: string;
  userId: string;
  workspaceId: string;
  entityType: 'trade' | 'position' | 'journal';
  entityId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    name: string;
    avatar?: string;
  };
  replies?: Comment[];
}

// Broker connection
export interface BrokerConnection {
  id: string;
  provider: 'schwab' | 'manual' | 'paper';
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  accountId?: string;
  lastSync?: string;
  error?: string;
}

// Order for execution
export interface Order {
  id: string;
  symbol: string;
  strategyType: string;
  orderType: 'limit' | 'market';
  action: 'buy_to_open' | 'sell_to_open' | 'buy_to_close' | 'sell_to_close';
  quantity: number;
  limitPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filledPrice?: number;
  filledAt?: string;
  createdAt: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Market overview data
export interface MarketOverview {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'normal' | 'high' | 'extreme';
}

// Risk summary
export interface RiskSummary {
  perTradeRiskPct: number;
  perTradeRiskLimit: number;
  totalRiskPct: number;
  totalRiskLimit: number;
  dailyLossPct: number;
  dailyLossLimit: number;
  openPositions: number;
  maxPositions: number;
}

// Loading state helper
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Filter options for trades
export interface TradeFilters {
  status?: TradeCandidate['status'][];
  strategyType?: TradeCandidate['strategyType'][];
  symbol?: string;
  minConfidence?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}
