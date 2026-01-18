import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Badge types and their descriptions
export const BADGE_TYPES = {
  journaling_streak: {
    name: 'Journaling Streak',
    description: (level: number) => `${level} consecutive days of journaling`,
    icon: '📝',
    levels: [3, 7, 14, 30, 60, 90],
  },
  risk_discipline_streak: {
    name: 'Risk Discipline',
    description: (level: number) => `${level}-day streak following risk rules`,
    icon: '🛡️',
    levels: [5, 10, 20, 30, 50, 100],
  },
  profitable_trades: {
    name: 'Profitable Trades',
    description: (level: number) => `${level} profitable paper trades`,
    icon: '💰',
    levels: [5, 10, 25, 50, 100, 200],
  },
  learning_progress: {
    name: 'Learning Progress',
    description: (level: number) => `Completed ${level} learning modules`,
    icon: '📚',
    levels: [1, 5, 10, 20, 30, 50],
  },
  regime_awareness: {
    name: 'Regime Awareness',
    description: (level: number) => `${level} days checking market narrative`,
    icon: '🎯',
    levels: [7, 14, 30, 60, 90, 180],
  },
  paper_trading_master: {
    name: 'Paper Trading Master',
    description: (level: number) => `${level} total paper trades executed`,
    icon: '🎓',
    levels: [10, 25, 50, 100, 200, 500],
  },
  win_rate_achievement: {
    name: 'Win Rate',
    description: (level: number) => `Maintained ${level}% win rate`,
    icon: '🏆',
    levels: [60, 70, 75, 80, 85, 90],
  },
  position_sizing_discipline: {
    name: 'Position Sizing',
    description: (level: number) => `${level} trades with proper position sizing`,
    icon: '⚖️',
    levels: [10, 25, 50, 100, 200, 500],
  },
};

// Get badges for current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    // Get user's badges
    const { data: badges, error: badgesError } = await supabase
      .from('discipline_badges')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', profile.current_workspace_id)
      .order('updated_at', { ascending: false });

    if (badgesError) {
      console.error('Failed to fetch badges:', badgesError);
      return NextResponse.json(
        { error: 'Failed to fetch badges' },
        { status: 500 }
      );
    }

    // Enrich with badge metadata
    const enrichedBadges = (badges || []).map((badge) => {
      const badgeType = BADGE_TYPES[badge.badge_type as keyof typeof BADGE_TYPES];
      return {
        ...badge,
        name: badgeType?.name || badge.badge_type,
        icon: badgeType?.icon || '🏅',
        description: badgeType?.description(badge.level) || badge.description,
        nextLevel: badgeType?.levels.find((l) => l > badge.level),
      };
    });

    // Calculate badge progress for unearned badges
    const earnedTypes = new Set(badges?.map((b) => b.badge_type) || []);
    const availableBadges = Object.entries(BADGE_TYPES)
      .filter(([type]) => !earnedTypes.has(type))
      .map(([type, info]) => ({
        badge_type: type,
        name: info.name,
        icon: info.icon,
        description: info.description(info.levels[0]),
        targetLevel: info.levels[0],
        earned: false,
      }));

    return NextResponse.json({
      badges: enrichedBadges,
      available: availableBadges,
      stats: {
        totalBadges: enrichedBadges.length,
        totalPossible: Object.keys(BADGE_TYPES).length,
      },
    });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Trigger badge recalculation (called after relevant actions)
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { badgeType } = body;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    let newBadge = null;
    let updatedBadge = null;

    // Calculate badge based on type
    switch (badgeType) {
      case 'profitable_trades':
        const result = await calculateProfitableTrades(
          supabase,
          user.id,
          profile.current_workspace_id
        );
        newBadge = result.newBadge;
        updatedBadge = result.updatedBadge;
        break;

      case 'paper_trading_master':
        const paperResult = await calculatePaperTradingMaster(
          supabase,
          user.id,
          profile.current_workspace_id
        );
        newBadge = paperResult.newBadge;
        updatedBadge = paperResult.updatedBadge;
        break;

      // Add more badge calculations as needed
    }

    return NextResponse.json({
      success: true,
      newBadge,
      updatedBadge,
    });
  } catch (error) {
    console.error('Calculate badge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateProfitableTrades(
  supabase: any,
  userId: string,
  workspaceId: string
) {
  // Count profitable closed positions
  const { data: positions } = await supabase
    .from('paper_positions')
    .select('realized_pnl')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'closed')
    .gt('realized_pnl', 0);

  const profitableCount = positions?.length || 0;
  const badgeType = BADGE_TYPES.profitable_trades;
  const achievedLevel = badgeType.levels
    .filter((l) => l <= profitableCount)
    .pop();

  if (!achievedLevel) {
    return { newBadge: null, updatedBadge: null };
  }

  // Check existing badge
  const { data: existingBadge } = await supabase
    .from('discipline_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('badge_type', 'profitable_trades')
    .single();

  if (existingBadge) {
    if (achievedLevel > existingBadge.level) {
      const { data: updated } = await supabase
        .from('discipline_badges')
        .update({
          level: achievedLevel,
          description: badgeType.description(achievedLevel),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBadge.id)
        .select()
        .single();

      return { newBadge: null, updatedBadge: updated };
    }
    return { newBadge: null, updatedBadge: null };
  }

  // Create new badge
  const { data: newBadge } = await supabase
    .from('discipline_badges')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      badge_type: 'profitable_trades',
      level: achievedLevel,
      description: badgeType.description(achievedLevel),
    })
    .select()
    .single();

  return { newBadge, updatedBadge: null };
}

async function calculatePaperTradingMaster(
  supabase: any,
  userId: string,
  workspaceId: string
) {
  // Count all closed positions
  const { count } = await supabase
    .from('paper_positions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'closed');

  const totalTrades = count || 0;
  const badgeType = BADGE_TYPES.paper_trading_master;
  const achievedLevel = badgeType.levels
    .filter((l) => l <= totalTrades)
    .pop();

  if (!achievedLevel) {
    return { newBadge: null, updatedBadge: null };
  }

  // Check existing badge
  const { data: existingBadge } = await supabase
    .from('discipline_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('badge_type', 'paper_trading_master')
    .single();

  if (existingBadge) {
    if (achievedLevel > existingBadge.level) {
      const { data: updated } = await supabase
        .from('discipline_badges')
        .update({
          level: achievedLevel,
          description: badgeType.description(achievedLevel),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBadge.id)
        .select()
        .single();

      return { newBadge: null, updatedBadge: updated };
    }
    return { newBadge: null, updatedBadge: null };
  }

  // Create new badge
  const { data: newBadge } = await supabase
    .from('discipline_badges')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      badge_type: 'paper_trading_master',
      level: achievedLevel,
      description: badgeType.description(achievedLevel),
    })
    .select()
    .single();

  return { newBadge, updatedBadge: null };
}
