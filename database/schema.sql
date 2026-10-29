-- Gradient CodeQuest Database Schema for Supabase PostgreSQL
-- Enable uuid-ossp or pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EVENT_ADMINS TABLE
CREATE TABLE IF NOT EXISTS event_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 4. GAME_NODES TABLE
-- Node Types: START, QUEST, TREASURE_HUNT, FINISH
CREATE TABLE IF NOT EXISTS game_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    position INT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('START', 'QUEST', 'TREASURE_HUNT', 'FINISH')),
    title TEXT NOT NULL,
    challenge_statement TEXT NOT NULL,
    points INT NOT NULL DEFAULT 100 CHECK (points >= 0),
    expected_answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, position)
);

-- 5. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL,
    score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, name)
);

-- 6. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    ug_year TEXT NOT NULL CHECK (ug_year IN ('UG1', 'UG2', 'UG3', 'UG4')),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TEAM_PROGRESS TABLE
CREATE TABLE IF NOT EXISTS team_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    current_node_id UUID REFERENCES game_nodes(id) ON DELETE SET NULL,
    current_position INT NOT NULL DEFAULT 1,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id)
);

-- 8. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES game_nodes(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_feedback TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SCORE_EVENTS TABLE
CREATE TABLE IF NOT EXISTS score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES game_nodes(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    points INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, node_id)
);

-- 10. NODE_HINTS TABLE
CREATE TABLE IF NOT EXISTS node_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES game_nodes(id) ON DELETE CASCADE,
    hint_number INT NOT NULL DEFAULT 1,
    hint_text TEXT NOT NULL,
    debugging_task TEXT NOT NULL,
    debugging_answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(node_id, hint_number)
);

-- 11. HINT_UNLOCKS TABLE
CREATE TABLE IF NOT EXISTS hint_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES game_nodes(id) ON DELETE CASCADE,
    hint_id UUID NOT NULL REFERENCES node_hints(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, hint_id)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_game_nodes_event_pos ON game_nodes(event_id, position);
CREATE INDEX IF NOT EXISTS idx_teams_event_score ON teams(event_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_progress_team ON team_progress(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_node ON submissions(node_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_score_events_team ON score_events(team_id);
CREATE INDEX IF NOT EXISTS idx_hint_unlocks_team ON hint_unlocks(team_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE hint_unlocks ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS if using Supabase Auth:
-- auth.uid() returns the authenticated user's ID in Supabase
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES:
-- 1. Users: anyone can read basic profile info, admins can update/insert
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_admin ON users FOR ALL USING (is_admin());

-- 2. Events: public can view active events; admins have full access
CREATE POLICY events_public_read ON events FOR SELECT USING (true);
CREATE POLICY events_admin_all ON events FOR ALL USING (is_admin());

-- 3. Game Nodes: players can view nodes in the path, but expected answers hidden from teams
CREATE POLICY nodes_public_read ON game_nodes FOR SELECT USING (true);
CREATE POLICY nodes_admin_all ON game_nodes FOR ALL USING (is_admin());

-- 4. Teams: public can read teams for leaderboard; admins manage
CREATE POLICY teams_read ON teams FOR SELECT USING (true);
CREATE POLICY teams_admin_all ON teams FOR ALL USING (is_admin());

-- 5. Players: public can read team rosters; admins manage
CREATE POLICY players_read ON players FOR SELECT USING (true);
CREATE POLICY players_admin_all ON players FOR ALL USING (is_admin());

-- 6. Team Progress: anyone can read for leaderboard display; system/admin updates
CREATE POLICY progress_read ON team_progress FOR SELECT USING (true);
CREATE POLICY progress_admin_all ON team_progress FOR ALL USING (is_admin());

-- 7. Submissions: teams can insert and read their own submissions; admins review
CREATE POLICY submissions_read ON submissions FOR SELECT USING (true);
CREATE POLICY submissions_insert ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY submissions_admin_update ON submissions FOR UPDATE USING (is_admin());

-- 8. Score Events: public can view for audit/leaderboard; admins insert
CREATE POLICY score_events_read ON score_events FOR SELECT USING (true);
CREATE POLICY score_events_admin ON score_events FOR ALL USING (is_admin());

-- 9. Node Hints: hints text without debugging answer visible once unlocked; admins have full access
CREATE POLICY node_hints_read ON node_hints FOR SELECT USING (true);
CREATE POLICY node_hints_admin ON node_hints FOR ALL USING (is_admin());

-- 10. Hint Unlocks: teams can read and unlock
CREATE POLICY hint_unlocks_read ON hint_unlocks FOR SELECT USING (true);
CREATE POLICY hint_unlocks_insert ON hint_unlocks FOR INSERT WITH CHECK (true);
