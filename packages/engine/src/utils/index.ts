import { HistoricalPrice, TrendRegime, VolatilityRegime } from '../types';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Calculate all moving averages for a price series
 */
export function calculateMovingAverages(
  history: HistoricalPrice[]
): { ma50: number | null; ma200: number | null; current: number } {
  const closes = history.map((h) => h.close);
  const current = closes[closes.length - 1] || 0;

  return {
    ma50: calculateSMA(closes, 50),
    ma200: calculateSMA(closes, 200),
    current,
  };
}

/**
 * Calculate historical volatility (standard deviation of returns)
 */
export function calculateHistoricalVolatility(
  history: HistoricalPrice[],
  period: number
): number | null {
  if (history.length < period + 1) return null;

  const slice = history.slice(-(period + 1));
  const returns: number[] = [];

  for (let i = 1; i < slice.length; i++) {
    const ret = Math.log(slice[i].close / slice[i - 1].close);
    returns.push(ret);
  }

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  const dailyVol = Math.sqrt(variance);

  // Annualize (252 trading days)
  return dailyVol * Math.sqrt(252) * 100;
}

/**
 * Determine trend regime from price vs moving averages
 */
export function determineTrendRegime(
  price: number,
  ma50: number | null,
  ma200: number | null
): { regime: TrendRegime; score: number } {
  if (!ma50 || !ma200) {
    return { regime: 'neutral', score: 0 };
  }

  const pctAbove50 = ((price - ma50) / ma50) * 100;
  const pctAbove200 = ((price - ma200) / ma200) * 100;
  const ma50Above200 = ((ma50 - ma200) / ma200) * 100;

  // Score from -100 to 100
  let score = 0;
  score += Math.max(-30, Math.min(30, pctAbove50 * 3));
  score += Math.max(-30, Math.min(30, pctAbove200 * 2));
  score += Math.max(-40, Math.min(40, ma50Above200 * 4));

  let regime: TrendRegime;
  if (score > 50) regime = 'strong_uptrend';
  else if (score > 20) regime = 'uptrend';
  else if (score > -20) regime = 'neutral';
  else if (score > -50) regime = 'downtrend';
  else regime = 'strong_downtrend';

  return { regime, score };
}

/**
 * Determine volatility regime from IV rank and historical vol
 */
export function determineVolatilityRegime(
  ivRank: number | null,
  currentIV: number | null,
  hv20: number | null
): VolatilityRegime {
  // If we have IV rank, use it as primary
  if (ivRank !== null) {
    if (ivRank >= 80) return 'panic';
    if (ivRank >= 60) return 'high';
    if (ivRank >= 40) return 'elevated';
    if (ivRank >= 20) return 'normal';
    return 'low';
  }

  // Fallback: compare current IV to historical vol
  if (currentIV !== null && hv20 !== null) {
    const ratio = currentIV / hv20;
    if (ratio >= 1.5) return 'panic';
    if (ratio >= 1.3) return 'high';
    if (ratio >= 1.1) return 'elevated';
    if (ratio >= 0.9) return 'normal';
    return 'low';
  }

  return 'normal';
}

/**
 * Calculate days to expiration
 */
export function calculateDTE(expirationDate: string): number {
  const exp = new Date(expirationDate);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate annualized return on risk
 */
export function calculateAnnualizedReturn(
  credit: number,
  maxLoss: number,
  dte: number
): number {
  if (maxLoss <= 0 || dte <= 0) return 0;
  const rawReturn = (credit / maxLoss) * 100;
  const annualized = (rawReturn * 365) / dte;
  return Math.round(annualized * 100) / 100;
}

/**
 * Calculate return on capital
 */
export function calculateROC(
  credit: number,
  buyingPower: number
): number {
  if (buyingPower <= 0) return 0;
  return Math.round((credit / buyingPower) * 100 * 100) / 100;
}

/**
 * Calculate bid-ask spread percentage
 */
export function calculateSpreadPct(bid: number, ask: number): number {
  if (bid <= 0) return 100;
  const mid = (bid + ask) / 2;
  return ((ask - bid) / mid) * 100;
}

/**
 * Calculate mid price
 */
export function calculateMid(bid: number, ask: number): number {
  return (bid + ask) / 2;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate approximate probability of profit based on delta
 */
export function estimateProbabilityOfProfit(shortDelta: number): number {
  // For short options, POP ≈ 1 - |delta|
  // This is a rough approximation
  return Math.round((1 - Math.abs(shortDelta)) * 100);
}

/**
 * Score liquidity on 0-100 scale
 */
export function scoreLiquidity(
  volume: number,
  openInterest: number,
  spreadPct: number,
  minVolume: number,
  minOI: number,
  maxSpread: number
): { score: number; meetsMinimum: boolean } {
  // Volume score
  const volumeScore = Math.min(100, (volume / (minVolume * 5)) * 100);

  // OI score
  const oiScore = Math.min(100, (openInterest / (minOI * 5)) * 100);

  // Spread score (inverse - lower is better)
  const spreadScore = spreadPct <= maxSpread
    ? Math.max(0, 100 - (spreadPct / maxSpread) * 50)
    : Math.max(0, 50 - ((spreadPct - maxSpread) / maxSpread) * 50);

  const overallScore = (volumeScore * 0.3 + oiScore * 0.3 + spreadScore * 0.4);

  const meetsMinimum =
    volume >= minVolume &&
    openInterest >= minOI &&
    spreadPct <= maxSpread;

  return {
    score: Math.round(overallScore),
    meetsMinimum,
  };
}

/**
 * Check if date is within N trading days
 */
export function isWithinTradingDays(
  targetDate: string | null,
  days: number
): boolean {
  if (!targetDate) return false;
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Get current date string
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
