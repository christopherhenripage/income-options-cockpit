import { TradingSettings, RiskProfilePreset } from './types';

/**
 * Default trading settings for each risk profile preset
 */
export const DEFAULT_SETTINGS: Record<RiskProfilePreset, TradingSettings> = {
  conservative: {
    tradingEnabled: false,
    brokerExecutionEnabled: false,
    paperModeEnabled: true,

    riskLimits: {
      maxRiskPerTradePct: 2,
      maxTotalRiskPct: 10,
      dailyLossLimitPct: 3,
      dailyLossLimitUsd: null,
      maxNewOrdersPerDay: 3,
      accountSize: null,
    },

    liquidityFilters: {
      minUnderlyingVolume: 1000000,
      minOptionOI: 500,
      minOptionVolume: 100,
      maxBidAskSpreadPct: 5,
    },

    earningsExclusionDays: 14,

    cashSecuredPut: {
      enabled: true,
      minDTE: 30,
      maxDTE: 45,
      targetDeltaMin: 0.15,
      targetDeltaMax: 0.25,
      profitTargetPct: 50,
      maxLossPct: 100,
    },

    coveredCall: {
      enabled: true,
      minDTE: 21,
      maxDTE: 45,
      targetDeltaMin: 0.15,
      targetDeltaMax: 0.25,
      profitTargetPct: 50,
      maxLossPct: null,
    },

    putCreditSpread: {
      enabled: true,
      minDTE: 30,
      maxDTE: 45,
      targetDeltaMin: 0.15,
      targetDeltaMax: 0.25,
      profitTargetPct: 50,
      maxLossPct: 100,
      spreadWidth: 5,
      minCredit: 0.5,
    },

    callCreditSpread: {
      enabled: false, // More conservative - disable bearish strategies
      minDTE: 30,
      maxDTE: 45,
      targetDeltaMin: 0.15,
      targetDeltaMax: 0.25,
      profitTargetPct: 50,
      maxLossPct: 100,
      spreadWidth: 5,
      minCredit: 0.5,
    },

    preferredVolRegimes: ['normal', 'elevated'],
    preferredTrendRegimes: ['uptrend', 'strong_uptrend', 'neutral'],
  },

  balanced: {
    tradingEnabled: false,
    brokerExecutionEnabled: false,
    paperModeEnabled: true,

    riskLimits: {
      maxRiskPerTradePct: 3,
      maxTotalRiskPct: 15,
      dailyLossLimitPct: 5,
      dailyLossLimitUsd: null,
      maxNewOrdersPerDay: 5,
      accountSize: null,
    },

    liquidityFilters: {
      minUnderlyingVolume: 500000,
      minOptionOI: 300,
      minOptionVolume: 50,
      maxBidAskSpreadPct: 8,
    },

    earningsExclusionDays: 10,

    cashSecuredPut: {
      enabled: true,
      minDTE: 21,
      maxDTE: 45,
      targetDeltaMin: 0.20,
      targetDeltaMax: 0.30,
      profitTargetPct: 50,
      maxLossPct: 100,
    },

    coveredCall: {
      enabled: true,
      minDTE: 14,
      maxDTE: 45,
      targetDeltaMin: 0.20,
      targetDeltaMax: 0.30,
      profitTargetPct: 50,
      maxLossPct: null,
    },

    putCreditSpread: {
      enabled: true,
      minDTE: 21,
      maxDTE: 45,
      targetDeltaMin: 0.20,
      targetDeltaMax: 0.30,
      profitTargetPct: 50,
      maxLossPct: 100,
      spreadWidth: 5,
      minCredit: 0.4,
    },

    callCreditSpread: {
      enabled: true,
      minDTE: 21,
      maxDTE: 45,
      targetDeltaMin: 0.20,
      targetDeltaMax: 0.30,
      profitTargetPct: 50,
      maxLossPct: 100,
      spreadWidth: 5,
      minCredit: 0.4,
    },

    preferredVolRegimes: ['normal', 'elevated', 'high'],
    preferredTrendRegimes: ['uptrend', 'strong_uptrend', 'neutral', 'downtrend'],
  },

  aggressive: {
    tradingEnabled: false,
    brokerExecutionEnabled: false,
    paperModeEnabled: true,

    riskLimits: {
      maxRiskPerTradePct: 5, // Hard cap
      maxTotalRiskPct: 25, // Hard cap
      dailyLossLimitPct: 8,
      dailyLossLimitUsd: null,
      maxNewOrdersPerDay: 10,
      accountSize: null,
    },

    liquidityFilters: {
      minUnderlyingVolume: 250000,
      minOptionOI: 100,
      minOptionVolume: 25,
      maxBidAskSpreadPct: 12,
    },

    earningsExclusionDays: 5,

    cashSecuredPut: {
      enabled: true,
      minDTE: 14,
      maxDTE: 45,
      targetDeltaMin: 0.25,
      targetDeltaMax: 0.35,
      profitTargetPct: 50,
      maxLossPct: 150,
    },

    coveredCall: {
      enabled: true,
      minDTE: 7,
      maxDTE: 45,
      targetDeltaMin: 0.25,
      targetDeltaMax: 0.35,
      profitTargetPct: 50,
      maxLossPct: null,
    },

    putCreditSpread: {
      enabled: true,
      minDTE: 14,
      maxDTE: 45,
      targetDeltaMin: 0.25,
      targetDeltaMax: 0.35,
      profitTargetPct: 50,
      maxLossPct: 150,
      spreadWidth: 5,
      minCredit: 0.3,
    },

    callCreditSpread: {
      enabled: true,
      minDTE: 14,
      maxDTE: 45,
      targetDeltaMin: 0.25,
      targetDeltaMax: 0.35,
      profitTargetPct: 50,
      maxLossPct: 150,
      spreadWidth: 5,
      minCredit: 0.3,
    },

    preferredVolRegimes: ['elevated', 'high', 'panic'],
    preferredTrendRegimes: ['uptrend', 'strong_uptrend', 'neutral', 'downtrend', 'strong_downtrend'],
  },
};

/**
 * Get default settings for a preset
 */
export function getDefaultSettings(preset: RiskProfilePreset): TradingSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS[preset]));
}

/**
 * Default universe of symbols
 */
export const DEFAULT_SYMBOLS = [
  // Major ETFs
  'SPY',
  'QQQ',
  'IWM',
  'DIA',
  // Mega caps
  'AAPL',
  'MSFT',
  'AMZN',
  'NVDA',
  'META',
  'GOOGL',
  'TSLA',
  // Sector ETFs
  'XLK',
  'XLF',
  'XLE',
  'XLV',
  'XLY',
  'XLP',
  'XLI',
  'XLU',
];

/**
 * Validate settings against hard caps
 */
export function validateSettings(settings: TradingSettings): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Hard caps that cannot be exceeded
  if (settings.riskLimits.maxRiskPerTradePct > 5) {
    errors.push('maxRiskPerTradePct cannot exceed 5%');
  }

  if (settings.riskLimits.maxTotalRiskPct > 25) {
    errors.push('maxTotalRiskPct cannot exceed 25%');
  }

  if (settings.riskLimits.dailyLossLimitPct <= 0) {
    errors.push('dailyLossLimitPct must be set and positive');
  }

  if (settings.liquidityFilters.minOptionOI < 10) {
    errors.push('minOptionOI cannot be less than 10');
  }

  if (settings.liquidityFilters.minUnderlyingVolume < 10000) {
    errors.push('minUnderlyingVolume cannot be less than 10,000');
  }

  // Validate strategy settings
  const strategies = [
    settings.cashSecuredPut,
    settings.coveredCall,
    settings.putCreditSpread,
    settings.callCreditSpread,
  ];

  for (const strategy of strategies) {
    if (strategy.minDTE < 1) {
      errors.push('minDTE must be at least 1 day');
    }
    if (strategy.maxDTE < strategy.minDTE) {
      errors.push('maxDTE must be >= minDTE');
    }
    if (strategy.targetDeltaMin < 0.05 || strategy.targetDeltaMax > 0.5) {
      errors.push('Delta targets should be between 0.05 and 0.50');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate diff between two settings objects
 */
export function calculateSettingsDiff(
  oldSettings: TradingSettings,
  newSettings: TradingSettings
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};

  function compare(oldObj: Record<string, unknown>, newObj: Record<string, unknown>, path = '') {
    for (const key of Object.keys(newObj)) {
      const fullPath = path ? `${path}.${key}` : key;
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
        compare(
          (oldVal as Record<string, unknown>) || {},
          newVal as Record<string, unknown>,
          fullPath
        );
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff[fullPath] = { old: oldVal, new: newVal };
      }
    }
  }

  compare(
    oldSettings as unknown as Record<string, unknown>,
    newSettings as unknown as Record<string, unknown>
  );

  return diff;
}
