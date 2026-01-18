import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const journalEntrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  mood: z.enum(['confident', 'cautious', 'neutral', 'anxious', 'excited']).optional(),
  tags: z.array(z.string()).optional(),
  linkedPositionIds: z.array(z.string().uuid()).optional(),
});

// Create journal entry
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
    const parsed = journalEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    const { title, content, mood, tags, linkedPositionIds } = parsed.data;

    // Create journal entry
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        workspace_id: profile.current_workspace_id,
        user_id: user.id,
        title,
        content,
        mood: mood || 'neutral',
        tags: tags || [],
        linked_position_ids: linkedPositionIds || [],
      })
      .select()
      .single();

    if (entryError) {
      console.error('Failed to create journal entry:', entryError);
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500 }
      );
    }

    // Update journaling streak badge
    await updateJournalingStreak(supabase, user.id, profile.current_workspace_id);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Create journal entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get journal entries
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tag = searchParams.get('tag');

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

    let query = supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('workspace_id', profile.current_workspace_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: entries, error: entriesError, count } = await query;

    if (entriesError) {
      console.error('Failed to fetch journal entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update journal entry
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
    const { entryId, ...updates } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingEntry } = await supabase
      .from('journal_entries')
      .select('user_id')
      .eq('id', entryId)
      .single();

    if (!existingEntry || existingEntry.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot edit this entry' },
        { status: 403 }
      );
    }

    const { data: entry, error: updateError } = await supabase
      .from('journal_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update journal entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Update journal entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete journal entry (soft delete)
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existingEntry } = await supabase
      .from('journal_entries')
      .select('user_id')
      .eq('id', entryId)
      .single();

    if (!existingEntry || existingEntry.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot delete this entry' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('journal_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', entryId);

    if (deleteError) {
      console.error('Failed to delete journal entry:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update journaling streak
async function updateJournalingStreak(
  supabase: any,
  userId: string,
  workspaceId: string
) {
  // Get last 7 days of entries
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('created_at')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (!recentEntries) return;

  // Count unique days with entries
  const uniqueDays = new Set(
    recentEntries.map((e: any) =>
      new Date(e.created_at).toISOString().split('T')[0]
    )
  );

  const streakLevel = uniqueDays.size;

  // Check for existing badge
  const { data: existingBadge } = await supabase
    .from('discipline_badges')
    .select('id, level')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('badge_type', 'journaling_streak')
    .single();

  if (existingBadge) {
    // Update if streak is higher
    if (streakLevel > existingBadge.level) {
      await supabase
        .from('discipline_badges')
        .update({
          level: streakLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBadge.id);
    }
  } else if (streakLevel >= 3) {
    // Create new badge if streak is at least 3
    await supabase.from('discipline_badges').insert({
      user_id: userId,
      workspace_id: workspaceId,
      badge_type: 'journaling_streak',
      level: streakLevel,
      description: `${streakLevel} consecutive days of journaling`,
    });
  }
}
