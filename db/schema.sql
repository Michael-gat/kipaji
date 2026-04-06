-- ================================================================
--  KIPAJI — COMPLETE PostgreSQL SCHEMA  (v2 — with Auth & Drills)
--  Run: psql -U postgres -d kipaji -f schema.sql
-- ================================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- DIMENSION TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS dim_teams (
    team_id      BIGINT       PRIMARY KEY,
    team_name    VARCHAR(100) NOT NULL,
    abbreviation CHAR(3)      NOT NULL UNIQUE,
    city         VARCHAR(100),
    state        VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dim_players (
    player_id  BIGINT       PRIMARY KEY,
    full_name  VARCHAR(150) NOT NULL,
    first_name VARCHAR(100),
    last_name  VARCHAR(100)
);

-- ================================================================
-- SEASON BRIDGE & STATS
-- ================================================================

CREATE TABLE IF NOT EXISTS player_team_seasons (
    id                       SERIAL  PRIMARY KEY,
    player_id                BIGINT  NOT NULL REFERENCES dim_players(player_id),
    primary_team_id          BIGINT  REFERENCES dim_teams(team_id),
    primary_team_abbr        CHAR(3),
    all_teams_season         VARCHAR(60),
    num_teams                SMALLINT DEFAULT 1,
    games_with_primary_team  SMALLINT,
    season                   CHAR(7)  NOT NULL DEFAULT '2024-25',
    UNIQUE (player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_pts_player ON player_team_seasons(player_id);
CREATE INDEX IF NOT EXISTS idx_pts_team   ON player_team_seasons(primary_team_id);

CREATE TABLE IF NOT EXISTS player_season_stats (
    id            SERIAL  PRIMARY KEY,
    player_id     BIGINT  NOT NULL REFERENCES dim_players(player_id),
    season        CHAR(7) NOT NULL DEFAULT '2024-25',
    games_played  SMALLINT,
    min_avg       NUMERIC(6,3),
    -- Scoring & Shooting
    pts_avg       NUMERIC(6,3),
    fgm_avg       NUMERIC(6,3),
    fga_avg       NUMERIC(6,3),
    fg_pct        NUMERIC(5,3),
    fg3m_avg      NUMERIC(6,3),
    fg3a_avg      NUMERIC(6,3),
    fg3_pct       NUMERIC(5,3),
    ftm_avg       NUMERIC(6,3),
    fta_avg       NUMERIC(6,3),
    ft_pct        NUMERIC(5,3),
    -- Rebounding
    oreb_avg      NUMERIC(5,3),
    dreb_avg      NUMERIC(5,3),
    reb_avg       NUMERIC(5,3),
    -- Playmaking & Ball Control
    ast_avg       NUMERIC(5,3),
    ast_tov_ratio NUMERIC(10,3),
    tov_avg       NUMERIC(5,3),
    -- Defense
    stl_avg       NUMERIC(5,3),
    blk_avg       NUMERIC(5,3),
    pf_avg        NUMERIC(5,3),
    UNIQUE (player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_pss_player ON player_season_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_pss_pts    ON player_season_stats(pts_avg DESC);

-- ================================================================
-- FACT TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS fact_player_games (
    id          SERIAL  PRIMARY KEY,
    player_id   BIGINT  NOT NULL REFERENCES dim_players(player_id),
    game_id     BIGINT  NOT NULL,
    team_id     BIGINT  REFERENCES dim_teams(team_id),
    team_name   VARCHAR(100),
    game_date   DATE    NOT NULL,
    matchup     VARCHAR(20),
    wl          CHAR(1),
    min         NUMERIC(6,2),
    fgm SMALLINT, fga SMALLINT, fg_pct  NUMERIC(5,3),
    fg3m SMALLINT, fg3a SMALLINT, fg3_pct NUMERIC(5,3),
    ftm SMALLINT, fta SMALLINT, ft_pct  NUMERIC(5,3),
    oreb SMALLINT, dreb SMALLINT, reb   SMALLINT,
    ast SMALLINT, stl SMALLINT, blk    SMALLINT,
    tov SMALLINT, pf  SMALLINT, pts    SMALLINT,
    plus_minus SMALLINT,
    UNIQUE (player_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_fpg_player ON fact_player_games(player_id);
CREATE INDEX IF NOT EXISTS idx_fpg_date   ON fact_player_games(game_date);
CREATE INDEX IF NOT EXISTS idx_fpg_team   ON fact_player_games(team_id);

CREATE TABLE IF NOT EXISTS fact_team_games (
    id        SERIAL  PRIMARY KEY,
    game_id   BIGINT  NOT NULL,
    team_id   BIGINT  REFERENCES dim_teams(team_id),
    game_date DATE    NOT NULL,
    matchup   VARCHAR(20),
    wl        CHAR(1),
    min  NUMERIC(6,2),
    fgm  SMALLINT, fga  SMALLINT, fg_pct  NUMERIC(5,3),
    fg3m SMALLINT, fg3a SMALLINT, fg3_pct NUMERIC(5,3),
    ftm  SMALLINT, fta  SMALLINT, ft_pct  NUMERIC(5,3),
    oreb SMALLINT, dreb SMALLINT, reb     SMALLINT,
    ast  SMALLINT, stl  SMALLINT, blk     SMALLINT,
    tov  SMALLINT, pf   SMALLINT, pts     SMALLINT,
    UNIQUE (team_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_ftg_team ON fact_team_games(team_id);
CREATE INDEX IF NOT EXISTS idx_ftg_date ON fact_team_games(game_date);

-- ================================================================
-- DRILLS
-- ================================================================

CREATE TABLE IF NOT EXISTS drills (
    drill_id           VARCHAR(10)      PRIMARY KEY,
    drill_name         VARCHAR(150) NOT NULL,
    improves_skill     VARCHAR(150),
    target_metrics     VARCHAR(200),
    difficulty_level   VARCHAR(20),
    positions_targeted VARCHAR(100),
    description        TEXT,
    intensity          VARCHAR(10),
    focus              VARCHAR(30)
);

-- ================================================================
-- USER AUTH
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                               CHECK (role IN ('user','coach','admin')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- USER → SAVED ANALYSES  (optional, for dashboard history)
-- ================================================================

CREATE TABLE IF NOT EXISTS user_analyses (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id   BIGINT      NOT NULL REFERENCES dim_players(player_id),
    analysis    JSONB       NOT NULL,   -- full ML output stored as JSON
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ua_user   ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ua_player ON user_analyses(player_id);
CREATE INDEX IF NOT EXISTS idx_ua_date   ON user_analyses(created_at DESC);

-- ================================================================
-- LOAD CSV DATA
-- (Run from same folder as CSV files, or adjust paths)
-- ================================================================

\copy dim_teams(team_id, team_name, abbreviation, city, state) FROM '/docker-entrypoint-initdb.d/Data/kipaji_dim_teams.csv' WITH (FORMAT csv, HEADER true);

\copy dim_players(player_id, full_name, first_name, last_name) FROM '/docker-entrypoint-initdb.d/Data/kipaji_dim_players.csv' WITH (FORMAT csv, HEADER true);

\copy player_team_seasons(player_id, primary_team_id, primary_team_abbr, all_teams_season, num_teams, games_with_primary_team, season) FROM '/docker-entrypoint-initdb.d/Data/kipaji_player_team_seasons.csv' WITH (FORMAT csv, HEADER true);

\copy player_season_stats(player_id, games_played, min_avg, pts_avg, fgm_avg, fga_avg, fg_pct, fg3m_avg, fg3a_avg, fg3_pct, ftm_avg, fta_avg, ft_pct, oreb_avg, dreb_avg, reb_avg, ast_avg, stl_avg, blk_avg, tov_avg, pf_avg, ast_tov_ratio, season) FROM '/docker-entrypoint-initdb.d/Data/kipaji_player_season_stats.csv' WITH (FORMAT csv, HEADER true);

\copy fact_player_games(player_id, game_id, game_date, matchup, wl, min, fgm, fga, fg_pct, fg3m, fg3a, fg3_pct, ftm, fta, ft_pct, oreb, dreb, reb, ast, stl, blk, tov, pf, pts, plus_minus, team_id, team_name) FROM '/docker-entrypoint-initdb.d/Data/kipaji_fact_player_games.csv' WITH (FORMAT csv, HEADER true);

\copy fact_team_games(game_id, team_id, game_date, matchup, wl, min, fgm, fga, fg_pct, fg3m, fg3a, fg3_pct, ftm, fta, ft_pct, oreb, dreb, reb, ast, stl, blk, tov, pf, pts) FROM '/docker-entrypoint-initdb.d/Data/kipaji_fact_team_games.csv' WITH (FORMAT csv, HEADER true);

\copy drills(drill_id, drill_name, improves_skill, target_metrics, difficulty_level, positions_targeted, description) FROM '/docker-entrypoint-initdb.d/Data/kipaji_drills.csv' WITH (FORMAT csv, HEADER true);
