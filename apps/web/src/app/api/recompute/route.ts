import { NextRequest, NextResponse } from 'next/server';
import {
  TradingEngine,
  MockProvider,
  DEFAULT_SYMBOLS,
  getDefaultSettings,
} from '@cockpit/engine';

// Verify cron secret for scheduled calls
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true; // Allow if no secret configured (dev mode)

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    // For cron calls, verify secret
    const isCronCall = request.headers.get('x-vercel-cron') === 'true';
    if (isCronCall && !verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, we'd get the workspace from the authenticated user
    const workspaceId = 'default-workspace';
    const settingsVersionId = 'default-settings';
    const riskProfilePreset = 'balanced';

    // Initialize provider based on environment
    const providerType = process.env.MARKET_DATA_PROVIDER || 'mock';
    let provider;

    if (providerType === 'mock') {
      provider = new MockProvider();
    } else {
      // For real providers, would initialize here with API key
      // For now, fall back to mock
      provider = new MockProvider();
    }

    // Get settings (in real app, from database)
    const settings = getDefaultSettings('balanced');

    // Create engine and run recompute
    const engine = new TradingEngine(provider);

    const result = await engine.recompute(settings, {
      workspaceId,
      settingsVersionId,
      riskProfilePreset,
      symbols: DEFAULT_SYMBOLS.slice(0, 11), // Core symbols
      minScore: 40,
      topPerStrategy: 3,
      maxPerSymbol: 2,
    });

    // In a real app, we'd store results in the database
    // For now, return the results

    return NextResponse.json({
      success: true,
      runId: result.runId,
      stats: result.stats,
      regime: {
        trend: result.regime.trend,
        volatility: result.regime.volatility,
        riskOnOff: result.regime.riskOnOff,
        breadth: result.regime.breadth.assessment,
      },
      candidateCount: result.rankedCandidates.length,
      candidates: result.rankedCandidates.slice(0, 10).map((c) => ({
        id: c.id,
        symbol: c.symbol,
        strategyType: c.strategyType,
        score: c.score,
        netCredit: c.netCredit,
        maxLoss: c.riskBox.maxLoss,
        dte: c.dte,
      })),
    });
  } catch (error) {
    console.error('Recompute error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Simple health check / status endpoint
  return NextResponse.json({
    status: 'ok',
    provider: process.env.MARKET_DATA_PROVIDER || 'mock',
    tradingEnabled: process.env.TRADING_ENABLED === 'true',
    brokerExecutionEnabled: process.env.BROKER_EXECUTION_ENABLED === 'true',
  });
}
