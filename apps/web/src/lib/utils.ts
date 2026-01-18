import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'score-excellent';
  if (score >= 50) return 'score-good';
  if (score >= 30) return 'score-fair';
  return 'score-poor';
}

export function getTrendClass(
  trend: string
): 'trend-up' | 'trend-down' | 'trend-neutral' {
  if (trend.includes('uptrend')) return 'trend-up';
  if (trend.includes('downtrend')) return 'trend-down';
  return 'trend-neutral';
}

export function getVolatilityClass(vol: string): string {
  switch (vol) {
    case 'low':
      return 'vol-low';
    case 'normal':
      return 'vol-normal';
    case 'elevated':
      return 'vol-elevated';
    case 'high':
      return 'vol-high';
    case 'panic':
      return 'vol-panic';
    default:
      return 'vol-normal';
  }
}

export function getStrategyClass(strategy: string): string {
  switch (strategy) {
    case 'cash_secured_put':
      return 'strategy-csp';
    case 'covered_call':
      return 'strategy-cc';
    case 'put_credit_spread':
      return 'strategy-pcs';
    case 'call_credit_spread':
      return 'strategy-ccs';
    default:
      return '';
  }
}

export function getStrategyLabel(strategy: string): string {
  switch (strategy) {
    case 'cash_secured_put':
      return 'CSP';
    case 'covered_call':
      return 'CC';
    case 'put_credit_spread':
      return 'PCS';
    case 'call_credit_spread':
      return 'CCS';
    default:
      return strategy;
  }
}

export function getStrategyFullName(strategy: string): string {
  switch (strategy) {
    case 'cash_secured_put':
      return 'Cash-Secured Put';
    case 'covered_call':
      return 'Covered Call';
    case 'put_credit_spread':
      return 'Put Credit Spread';
    case 'call_credit_spread':
      return 'Call Credit Spread';
    default:
      return strategy;
  }
}

export function calculateDTE(expiration: string): number {
  const exp = new Date(expiration);
  const now = new Date();
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
