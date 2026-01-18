-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbol_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompute_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function to check workspace membership
-- ============================================================
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin/owner of workspace
CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Profiles Policies
-- ============================================================
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Allow viewing profiles of workspace members
CREATE POLICY "Users can view profiles of workspace members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.user_id
    )
  );

-- ============================================================
-- Workspaces Policies
-- ============================================================
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (is_workspace_member(id));

CREATE POLICY "Owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
  ON workspaces FOR DELETE
  USING (owner_user_id = auth.uid());

-- ============================================================
-- Workspace Members Policies
-- ============================================================
CREATE POLICY "Members can view workspace membership"
  ON workspace_members FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can update workspace members"
  ON workspace_members FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can remove workspace members"
  ON workspace_members FOR DELETE
  USING (is_workspace_admin(workspace_id) OR user_id = auth.uid());

-- ============================================================
-- Settings Policies
-- ============================================================
CREATE POLICY "Members can view settings versions"
  ON settings_versions FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can create settings versions"
  ON settings_versions FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Members can view current settings"
  ON current_settings FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can update current settings"
  ON current_settings FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can insert current settings"
  ON current_settings FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

-- ============================================================
-- Symbol Universe Policies
-- ============================================================
CREATE POLICY "Members can view symbol universe"
  ON symbol_universe FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage symbol universe"
  ON symbol_universe FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can update symbol universe"
  ON symbol_universe FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can delete from symbol universe"
  ON symbol_universe FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Recompute Runs Policies
-- ============================================================
CREATE POLICY "Members can view recompute runs"
  ON recompute_runs FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can create recompute runs"
  ON recompute_runs FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can update recompute runs"
  ON recompute_runs FOR UPDATE
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Trade Packets Policies
-- ============================================================
CREATE POLICY "Members can view trade packets"
  ON trade_packets FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "System can create trade packets"
  ON trade_packets FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can update trade packets"
  ON trade_packets FOR UPDATE
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Trade Approvals Policies
-- ============================================================
CREATE POLICY "Members can view trade approvals"
  ON trade_approvals FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can create trade approvals"
  ON trade_approvals FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

-- ============================================================
-- Broker Policies
-- ============================================================
CREATE POLICY "Admins can view broker connections"
  ON broker_connections FOR SELECT
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can manage broker connections"
  ON broker_connections FOR ALL
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can view broker orders"
  ON broker_orders FOR SELECT
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can manage broker orders"
  ON broker_orders FOR ALL
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Paper Trading Policies
-- ============================================================
CREATE POLICY "Members can view paper fills"
  ON paper_fills FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can create paper fills"
  ON paper_fills FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Members can view paper positions"
  ON paper_positions FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage paper positions"
  ON paper_positions FOR ALL
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Journal Entries Policies
-- ============================================================
CREATE POLICY "Members can view journal entries"
  ON journal_entries FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id) AND author_user_id = auth.uid());

CREATE POLICY "Authors can update their journal entries"
  ON journal_entries FOR UPDATE
  USING (author_user_id = auth.uid());

CREATE POLICY "Authors can delete their journal entries"
  ON journal_entries FOR DELETE
  USING (author_user_id = auth.uid());

-- ============================================================
-- Comments Policies
-- ============================================================
CREATE POLICY "Members can view comments"
  ON comments FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create comments"
  ON comments FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id) AND author_user_id = auth.uid());

CREATE POLICY "Authors can update their comments"
  ON comments FOR UPDATE
  USING (author_user_id = auth.uid());

CREATE POLICY "Authors can delete their comments"
  ON comments FOR DELETE
  USING (author_user_id = auth.uid());

-- ============================================================
-- Market Narratives Policies
-- ============================================================
CREATE POLICY "Members can view market narratives"
  ON market_narratives FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "System can create market narratives"
  ON market_narratives FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "System can update market narratives"
  ON market_narratives FOR UPDATE
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Discipline Badges Policies
-- ============================================================
CREATE POLICY "Members can view discipline badges"
  ON discipline_badges FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "System can manage discipline badges"
  ON discipline_badges FOR ALL
  USING (is_workspace_admin(workspace_id));

-- ============================================================
-- Workspace Invites Policies
-- ============================================================
CREATE POLICY "Admins can view invites"
  ON workspace_invites FOR SELECT
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can create invites"
  ON workspace_invites FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "Admins can delete invites"
  ON workspace_invites FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- Invitees can view their own invites
CREATE POLICY "Users can view invites sent to them"
  ON workspace_invites FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
