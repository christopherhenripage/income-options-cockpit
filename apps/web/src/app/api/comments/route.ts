import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createCommentSchema = z.object({
  tradePacketId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

// Create a comment
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { tradePacketId, content, parentId } = parsed.data;

    // Verify user has access to the trade packet
    const { data: tradePacket, error: tradeError } = await supabase
      .from('trade_packets')
      .select('workspace_id')
      .eq('id', tradePacketId)
      .single();

    if (tradeError || !tradePacket) {
      return NextResponse.json(
        { error: 'Trade packet not found' },
        { status: 404 }
      );
    }

    // Verify user is a member of the workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', tradePacket.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Viewers cannot comment
    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot add comments' },
        { status: 403 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        trade_packet_id: tradePacketId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:profiles!comments_user_id_fkey(display_name, avatar_url)
      `)
      .single();

    if (commentError) {
      console.error('Failed to create comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get comments for a trade packet
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tradePacketId = searchParams.get('tradePacketId');

    if (!tradePacketId) {
      return NextResponse.json(
        { error: 'Trade packet ID required' },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get comments with user info
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `)
      .eq('trade_packet_id', tradePacketId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Failed to fetch comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Organize into threaded structure
    const topLevelComments = comments?.filter((c) => !c.parent_id) || [];
    const replies = comments?.filter((c) => c.parent_id) || [];

    const threaded = topLevelComments.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parent_id === comment.id),
    }));

    return NextResponse.json({ comments: threaded });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a comment
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content required' },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the comment
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existingComment || existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot edit this comment' },
        { status: 403 }
      );
    }

    // Update comment
    const { data: comment, error: updateError } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update comment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a comment (soft delete)
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID required' },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the comment or is admin
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id, trade_packet:trade_packets(workspace_id)')
      .eq('id', commentId)
      .single();

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user owns comment or is admin of workspace
    if (existingComment.user_id !== user.id) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', (existingComment.trade_packet as any).workspace_id)
        .eq('user_id', user.id)
        .single();

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Cannot delete this comment' },
          { status: 403 }
        );
      }
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (deleteError) {
      console.error('Failed to delete comment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
