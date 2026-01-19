import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger, logApiError } from '@/lib/logger';

/**
 * Calculate estimated unrealized P&L for an open position
 * Uses time decay approximation since we don't have real-time option prices
 *
 * For credit positions (CSP, credit spreads):
 * - Max profit = credit received (option expires worthless)
 * - P&L increases as time passes due to theta decay
 * - Time decay accelerates near expiration (square root approximation)
 */
function calculateUnrealizedPnL(position: {
  credit_received: number;
  entry_date: string;
  expiration_date: string;
  strategy_type: string;
}): number {
  const now = new Date();
  const entryDate = new Date(position.entry_date);
  const expirationDate = new Date(position.expiration_date);

  // Calculate time values
  const totalDays = Math.max(1, (expirationDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // If expired, return full credit (assuming OTM expiration for paper trades)
  if (daysRemaining <= 0) {
    return position.credit_received;
  }

  // Time decay approximation using square root formula
  // Options lose value faster as expiration approaches
  // At entry: 0% profit, at expiration: 100% profit (if OTM)
  const timeDecayFactor = 1 - Math.sqrt(daysRemaining / totalDays);

  // Apply time decay to credit received
  // Multiply by 0.85 to be conservative (real positions may not achieve full profit)
  const estimatedPnL = position.credit_received * timeDecayFactor * 0.85;

  return Math.round(estimatedPnL * 100) / 100;
}

// Schema for opening a paper position
const openPositionSchema = z.object({
  tradePacketId: z.string().uuid(),
  fillPrice: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  notes: z.string().optional(),
});

// Schema for closing a paper position
const closePositionSchema = z.object({
  positionId: z.string().uuid(),
  closePrice: z.number().positive(),
  notes: z.string().optional(),
});

// Open a paper position
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = openPositionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { tradePacketId, fillPrice, quantity, notes } = parsed.data;

    // Get trade packet details
    const { data: tradePacket, error: tradeError } = await supabase
      .from('trade_packets')
      .select('*')
      .eq('id', tradePacketId)
      .single();

    if (tradeError || !tradePacket) {
      return NextResponse.json(
        { error: 'Trade packet not found' },
        { status: 404 }
      );
    }

    // Calculate position details
    const creditReceived = fillPrice * quantity * 100; // Options are per 100 shares
    const maxRisk = tradePacket.max_risk_amount * quantity;

    // Create paper position
    const { data: position, error: positionError } = await supabase
      .from('paper_positions')
      .insert({
        workspace_id: tradePacket.workspace_id,
        trade_packet_id: tradePacketId,
        user_id: user.id,
        symbol: tradePacket.symbol,
        strategy_type: tradePacket.strategy_type,
        legs: tradePacket.legs,
        quantity,
        entry_price: fillPrice,
        credit_received: creditReceived,
        max_risk: maxRisk,
        status: 'open',
        opened_at: new Date().toISOString(),
        notes,
      })
      .select()
      .single();

    if (positionError) {
      logger.error('Failed to create paper position', { error: positionError });
      return NextResponse.json(
        { error: 'Failed to create position' },
        { status: 500 }
      );
    }

    // Record in trade log
    await supabase.from('paper_trade_log').insert({
      position_id: position.id,
      action: 'open',
      price: fillPrice,
      quantity,
      notes,
    });

    return NextResponse.json({ success: true, position });
  } catch (error) {
    logApiError('/api/paper-portfolio', error, { operation: 'open' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get paper positions
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('paper_positions')
      .select('*')
      .eq('workspace_id', profile.current_workspace_id);

    if (status === 'open') {
      query = query.eq('status', 'open');
    } else if (status === 'closed') {
      query = query.eq('status', 'closed');
    }
    // 'all' returns both

    const { data: positions, error: positionsError } = await query.order(
      'opened_at',
      { ascending: false }
    );

    if (positionsError) {
      logger.error('Failed to fetch positions', { error: positionsError });
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    // Calculate summary stats
    const openPositions = positions?.filter((p) => p.status === 'open') || [];
    const closedPositions = positions?.filter((p) => p.status === 'closed') || [];

    const totalOpenPnL = openPositions.reduce((sum, p) => {
      // Calculate estimated P&L based on time decay
      const pnl = calculateUnrealizedPnL({
        credit_received: p.credit_received || 0,
        entry_date: p.entry_date || p.created_at,
        expiration_date: p.expiration_date,
        strategy_type: p.strategy_type,
      });
      return sum + pnl;
    }, 0);

    const totalRealizedPnL = closedPositions.reduce((sum, p) => {
      return sum + (p.realized_pnl || 0);
    }, 0);

    return NextResponse.json({
      positions,
      summary: {
        openCount: openPositions.length,
        closedCount: closedPositions.length,
        totalOpenPnL,
        totalRealizedPnL,
        totalPnL: totalOpenPnL + totalRealizedPnL,
      },
    });
  } catch (error) {
    logApiError('/api/paper-portfolio', error, { operation: 'get' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Close a paper position
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = closePositionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { positionId, closePrice, notes } = parsed.data;

    // Get position
    const { data: position, error: positionError } = await supabase
      .from('paper_positions')
      .select('*')
      .eq('id', positionId)
      .single();

    if (positionError || !position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    if (position.status !== 'open') {
      return NextResponse.json(
        { error: 'Position is already closed' },
        { status: 400 }
      );
    }

    // Calculate realized P/L
    // For options we sold: profit = credit received - debit paid to close
    const debitPaid = closePrice * position.quantity * 100;
    const realizedPnL = position.credit_received - debitPaid;

    // Update position
    const { data: updatedPosition, error: updateError } = await supabase
      .from('paper_positions')
      .update({
        status: 'closed',
        exit_price: closePrice,
        realized_pnl: realizedPnL,
        closed_at: new Date().toISOString(),
        close_notes: notes,
      })
      .eq('id', positionId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to close position', { error: updateError });
      return NextResponse.json(
        { error: 'Failed to close position' },
        { status: 500 }
      );
    }

    // Record in trade log
    await supabase.from('paper_trade_log').insert({
      position_id: positionId,
      action: 'close',
      price: closePrice,
      quantity: position.quantity,
      pnl: realizedPnL,
      notes,
    });

    return NextResponse.json({ success: true, position: updatedPosition });
  } catch (error) {
    logApiError('/api/paper-portfolio', error, { operation: 'close' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
