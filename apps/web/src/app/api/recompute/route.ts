import { NextRequest, NextResponse } from 'next/server';
import {
  TradingEngine,
  MockProvider,
  PolygonProvider,
  DEFAULT_SYMBOLS,
  getDefaultSettings,
} from '@cockpit/engine';
import { logger, logApiError, logApiRequest } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { timingSafeEqual } from '@/lib/validation';

// Verify cron secret for scheduled calls using timing-safe comparison
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true; // Allow if no secret configured (dev mode)

  const expected = `Bearer ${cronSecret}`;
  if (!authHeader) return false;

  return timingSafeEqual(authHeader, expected);
}

export async function POST(request: NextRequest) {
  logApiRequest('/api/recompute', 'POST');

  try {
    // Rate limiting - allow 10 requests per minute
    const rateLimitResult = checkRateLimit(request, { limit: 10, windowMs: 60000 });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // For cron calls, verify secret
    const isCronCall = request.headers.get('x-vercel-cron') === 'true';
    if (isCronCall && !verifyCronSecret(request)) {
      logger.warn('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, we'd get the workspace from the authenticated user
    const workspaceId = 'default-workspace';
    const settingsVersionId = 'default-settings';
    const riskProfilePreset = 'balanced';

    // Initialize provider based on environment
    const providerType = process.env.MARKET_DATA_PROVIDER || 'mock';
    let provider;

    if (providerType === 'polygon') {
      const apiKey = process.env.POLYGON_API_KEY || process.env.MARKET_DATA_API_KEY;
      if (!apiKey) {
        logger.warn('Polygon API key not configured, falling back to mock provider');
        provider = new MockProvider();
      } else {
        provider = new PolygonProvider(apiKey);
        logger.info('Using Polygon provider with real market data');
      }
    } else {
      provider = new MockProvider();
    }

    // Get settings (in real app, from database)
    const settings = getDefaultSettings('balanced');

    // Create engine and run recompute
    const engine = new TradingEngine(provider);

    // Override settings for paper trading - larger account size for realistic trades
    const paperTradingSettings = {
      ...settings,
      riskLimits: {
        ...settings.riskLimits,
        accountSize: 500000, // Larger account for paper trading
        maxTotalRiskPct: 50, // More lenient for learning
      },
    };

    const result = await engine.recompute(paperTradingSettings, {
      workspaceId,
      settingsVersionId,
      riskProfilePreset,
      symbols: DEFAULT_SYMBOLS.slice(0, 11), // Core symbols
      minScore: 30,
      topPerStrategy: 5,
      maxPerSymbol: 3,
    });

    logger.info('Recompute completed', {
      runId: result.runId,
      candidateCount: result.rankedCandidates.length,
    });

    // In a real app, we'd store results in the database
    // For now, return the results

    return NextResponse.json(
      {
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
      },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    logApiError('/api/recompute', error);
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
  // Rate limiting for status endpoint
  const rateLimitResult = checkRateLimit(request, { limit: 60, windowMs: 60000 });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  // Simple health check / status endpoint
  return NextResponse.json(
    {
      status: 'ok',
      provider: process.env.MARKET_DATA_PROVIDER || 'mock',
      tradingEnabled: process.env.TRADING_ENABLED === 'true',
      brokerExecutionEnabled: process.env.BROKER_EXECUTION_ENABLED === 'true',
    },
    { headers: rateLimitResult.headers }
  );
}
