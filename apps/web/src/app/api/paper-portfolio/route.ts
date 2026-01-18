import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
      console.error('Failed to create paper position:', positionError);
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
    console.error('Open position error:', error);
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
      console.error('Failed to fetch positions:', positionsError);
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    // Calculate summary stats
    const openPositions = positions?.filter((p) => p.status === 'open') || [];
    const closedPositions = positions?.filter((p) => p.status === 'closed') || [];

    const totalOpenPnL = openPositions.reduce((sum, p) => {
      // Mock current P/L calculation - in reality would need current prices
      return sum + (p.credit_received * 0.3); // Assume 30% profit for mock
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
    console.error('Get positions error:', error);
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
      console.error('Failed to close position:', updateError);
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
    console.error('Close position error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
