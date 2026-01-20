import { NextRequest, NextResponse } from 'next/server';
import {
  TradingEngine,
  MockProvider,
  PolygonProvider,
  TradierProvider,
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

    // Initialize provider based on environment (trim to handle any whitespace in env vars)
    const providerType = (process.env.MARKET_DATA_PROVIDER || 'mock').trim();
    const polygonApiKey = (process.env.POLYGON_API_KEY || process.env.MARKET_DATA_API_KEY || '').trim();
    const tradierApiKey = (process.env.TRADIER_API_KEY || '').trim();
    const useTradierSandbox = process.env.TRADIER_USE_SANDBOX !== 'false'; // Default to sandbox

    // Get settings (in real app, from database)
    const settings = getDefaultSettings('balanced');

    // Override settings for paper trading - larger account size for realistic trades
    const paperTradingSettings = {
      ...settings,
      riskLimits: {
        ...settings.riskLimits,
        accountSize: 500000, // Larger account for paper trading
        maxTotalRiskPct: 50, // More lenient for learning
      },
    };

    const recomputeOptions = {
      workspaceId,
      settingsVersionId,
      riskProfilePreset,
      symbols: DEFAULT_SYMBOLS.slice(0, 11), // Core symbols
      minScore: 30,
      topPerStrategy: 5,
      maxPerSymbol: 3,
    };

    let result;
    let usingLiveData = false;
    let providerUsed = 'mock';

    // Priority: Tradier (best free options data) > Polygon > Mock
    // Try Tradier first - free sandbox includes 15-min delayed data with Greeks
    if ((providerType === 'tradier' || tradierApiKey) && tradierApiKey) {
      try {
        const tradierProvider = new TradierProvider(tradierApiKey, useTradierSandbox);
        const engine = new TradingEngine(tradierProvider);
        logger.info('Attempting to use Tradier provider with real market data', {
          sandbox: useTradierSandbox,
        });
        result = await engine.recompute(paperTradingSettings, recomputeOptions);
        usingLiveData = true;
        providerUsed = 'tradier';
        logger.info('Successfully fetched live market data from Tradier');
      } catch (tradierError) {
        logger.warn('Tradier provider failed, trying next provider', {
          error: tradierError instanceof Error ? tradierError.message : 'Unknown error',
        });
        // Fall through to try Polygon
      }
    }

    // Try Polygon if Tradier isn't configured or failed
    if (!result && providerType === 'polygon' && polygonApiKey) {
      try {
        const polygonProvider = new PolygonProvider(polygonApiKey);
        const engine = new TradingEngine(polygonProvider);
        logger.info('Attempting to use Polygon provider with real market data');
        result = await engine.recompute(paperTradingSettings, recomputeOptions);
        usingLiveData = true;
        providerUsed = 'polygon';
        logger.info('Successfully fetched live market data from Polygon');
      } catch (polygonError) {
        logger.warn('Polygon provider failed, falling back to mock data', {
          error: polygonError instanceof Error ? polygonError.message : 'Unknown error',
        });
        // Fall through to mock provider
      }
    }

    // Use mock provider if no live data provider succeeded
    if (!result) {
      const mockProvider = new MockProvider();
      const engine = new TradingEngine(mockProvider);
      logger.info('Using mock provider');
      result = await engine.recompute(paperTradingSettings, recomputeOptions);
      providerUsed = 'mock';
    }

    logger.info('Recompute completed', {
      runId: result.runId,
      candidateCount: result.rankedCandidates.length,
    });

    // In a real app, we'd store results in the database
    // For now, return the results

    return NextResponse.json(
      {
        success: true,
        liveData: usingLiveData,
        provider: providerUsed,
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
          underlyingPrice: c.underlyingPrice,
          legs: c.legs.map((leg) => ({
            action: leg.action,
            quantity: leg.quantity,
            strike: leg.option.strike,
            type: leg.option.type,
            expiration: leg.option.expiration,
            symbol: leg.option.symbol,
          })),
          orderTicketInstructions: c.orderTicketInstructions,
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
  const tradierConfigured = !!process.env.TRADIER_API_KEY?.trim();
  const polygonConfigured = !!(process.env.POLYGON_API_KEY?.trim() || process.env.MARKET_DATA_API_KEY?.trim());

  return NextResponse.json(
    {
      status: 'ok',
      provider: (process.env.MARKET_DATA_PROVIDER || 'mock').trim(),
      tradierConfigured,
      polygonConfigured,
      tradingEnabled: process.env.TRADING_ENABLED === 'true',
      brokerExecutionEnabled: process.env.BROKER_EXECUTION_ENABLED === 'true',
    },
    { headers: rateLimitResult.headers }
  );
}
