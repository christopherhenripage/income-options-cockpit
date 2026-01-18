-- ============================================================
-- Income Options Cockpit - Initial Schema
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Workspaces
-- ============================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Workspace Members
-- ============================================================
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  experienced_mode BOOLEAN NOT NULL DEFAULT FALSE,
  learning_mode BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Settings Versions
-- ============================================================
CREATE TABLE settings_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  preset_name TEXT NOT NULL CHECK (preset_name IN ('conservative', 'balanced', 'aggressive', 'custom')),
  settings_json JSONB NOT NULL,
  diff_json JSONB,
  notes TEXT
);

-- ============================================================
-- Current Settings
-- ============================================================
CREATE TABLE current_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  settings_version_id UUID NOT NULL REFERENCES settings_versions(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Symbol Universe
-- ============================================================
CREATE TABLE symbol_universe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  earnings_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, symbol)
);

-- ============================================================
-- Recompute Runs
-- ============================================================
CREATE TABLE recompute_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) DEFAULT 'running',
  provider TEXT NOT NULL DEFAULT 'mock',
  symbols_processed INTEGER DEFAULT 0,
  trades_generated INTEGER DEFAULT 0,
  notes TEXT,
  error_json JSONB,
  lock_key TEXT UNIQUE
);

-- ============================================================
-- Trade Packets
-- ============================================================
CREATE TABLE trade_packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recompute_run_id UUID REFERENCES recompute_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('cash_secured_put', 'covered_call', 'put_credit_spread', 'call_credit_spread')),
  status TEXT NOT NULL CHECK (status IN ('candidate', 'approved', 'executed', 'expired', 'rejected')) DEFAULT 'candidate',
  score INTEGER NOT NULL,
  score_components_json JSONB NOT NULL,
  packet_json JSONB NOT NULL,
  settings_version_id UUID REFERENCES settings_versions(id),
  risk_profile_preset TEXT
);

-- Create index for common queries
CREATE INDEX idx_trade_packets_workspace_status ON trade_packets(workspace_id, status);
CREATE INDEX idx_trade_packets_workspace_symbol ON trade_packets(workspace_id, symbol);
CREATE INDEX idx_trade_packets_created_at ON trade_packets(created_at DESC);

-- ============================================================
-- Trade Approvals
-- ============================================================
CREATE TABLE trade_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_packet_id UUID NOT NULL REFERENCES trade_packets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approval_mode TEXT NOT NULL CHECK (approval_mode IN ('manual', 'paper', 'broker')),
  notes TEXT
);

-- ============================================================
-- Broker Connections
-- ============================================================
CREATE TABLE broker_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('manual', 'paper', 'schwab')),
  status TEXT NOT NULL CHECK (status IN ('disconnected', 'pending', 'connected', 'error')) DEFAULT 'disconnected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encrypted_tokens_json JSONB,
  token_ref TEXT,
  last_error TEXT,
  UNIQUE(workspace_id, provider)
);

-- ============================================================
-- Broker Orders
-- ============================================================
CREATE TABLE broker_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  trade_packet_id UUID NOT NULL REFERENCES trade_packets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'filled', 'partial_fill', 'cancelled', 'rejected', 'expired')) DEFAULT 'pending',
  request_json JSONB NOT NULL,
  response_json JSONB,
  broker_order_id TEXT,
  error_json JSONB
);

-- ============================================================
-- Paper Fills
-- ============================================================
CREATE TABLE paper_fills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  trade_packet_id UUID NOT NULL REFERENCES trade_packets(id) ON DELETE CASCADE,
  fill_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  legs_json JSONB NOT NULL,
  fill_price NUMERIC(12, 4) NOT NULL,
  slippage_bps INTEGER DEFAULT 0,
  notes TEXT
);

-- ============================================================
-- Paper Positions
-- ============================================================
CREATE TABLE paper_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  trade_packet_id UUID REFERENCES trade_packets(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'expired')) DEFAULT 'open',
  position_json JSONB NOT NULL,
  pnl_json JSONB,
  entry_credit NUMERIC(12, 4),
  current_value NUMERIC(12, 4),
  realized_pnl NUMERIC(12, 4)
);

CREATE INDEX idx_paper_positions_workspace_status ON paper_positions(workspace_id, status);

-- ============================================================
-- Journal Entries
-- ============================================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  related_trade_packet_id UUID REFERENCES trade_packets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags_json JSONB DEFAULT '[]',
  mood TEXT CHECK (mood IN ('confident', 'cautious', 'uncertain', 'learning'))
);

-- ============================================================
-- Comments
-- ============================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('trade_packet', 'narrative', 'run')),
  entity_id UUID NOT NULL,
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  tag TEXT CHECK (tag IN ('question', 'insight', 'risk_note', 'general')),
  meta_json JSONB
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);

-- ============================================================
-- Market Narratives
-- ============================================================
CREATE TABLE market_narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  narrative_json JSONB NOT NULL,
  recompute_run_id UUID REFERENCES recompute_runs(id) ON DELETE SET NULL,
  UNIQUE(workspace_id, date)
);

-- ============================================================
-- Discipline Badges
-- ============================================================
CREATE TABLE discipline_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'risk_discipline_streak',
    'journaling_streak',
    'max_drawdown_controlled',
    'profit_target_adherence'
  )),
  level INTEGER NOT NULL DEFAULT 1,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  UNIQUE(workspace_id, user_id, badge_type)
);

-- ============================================================
-- Workspace Invites
-- ============================================================
CREATE TABLE workspace_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  UNIQUE(workspace_id, email)
);

-- ============================================================
-- Functions
-- ============================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to create default workspace for new user
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create default workspace
  INSERT INTO workspaces (name, owner_user_id)
  VALUES ('My Workspace', NEW.user_id)
  RETURNING id INTO new_workspace_id;

  -- Add user as owner
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.user_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new profile
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_symbol_universe_updated_at
  BEFORE UPDATE ON symbol_universe
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_broker_connections_updated_at
  BEFORE UPDATE ON broker_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
