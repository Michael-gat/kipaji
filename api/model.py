"""
Kipaji ML Model — Player Analysis & Drill Recommender
======================================================
Steps:
  1. Load & validate player season stats
  2. Infer position cluster via KMeans
  3. Compute derived KPIs per player
  4. Benchmark against position-peers (percentile rank)
  5. Classify each area: Strength / Average / Weakness
  6. Identify top 2-3 primary weaknesses
  7. Map weaknesses → drill categories
  8. Recommend 2-3 specific drills per weakness
  9. Return structured analysis dict (consumed by FastAPI)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sqlalchemy import create_engine

# Paths
BASE_DIR   = Path(__file__).parent
MODELS_DIR = BASE_DIR / "saved_models"
MODELS_DIR.mkdir(exist_ok=True)
DB_URI = "postgresql://postgres:postgres@127.0.0.1:5432/kipaji"
# Position cluster labels (matched to KMeans output)
CLUSTER_LABELS = {
    0: "G",      # Guards / Wings starters  (high AST, 3P, pts)
    1: "F/C",    # Big men bench            (high reb/blk, low 3P)
    2: "BENCH",  # Fringe / low-min
    3: "C/PF",   # Elite bigs               (highest reb, blk)
    4: "G/F",    # Role guards / wings
}

# Metrics that define each position group (higher = more important for position)
POSITION_METRIC_WEIGHTS = {
    "G":     {"ast_avg":2.0, "fg3_pct":2.0, "fg3a_avg":1.5, "tov_avg":1.5, "stl_avg":1.5, "pts_avg":1.5},
    "G/F":   {"fg3_pct":1.5, "stl_avg":1.5, "pts_avg":1.5, "reb_avg":1.0},
    "F/C":   {"reb_avg":2.0, "oreb_avg":2.0, "blk_avg":2.0, "fg_pct":1.5},
    "C/PF":  {"reb_avg":2.5, "oreb_avg":2.5, "blk_avg":2.5, "fg_pct":2.0, "pts_avg":1.5},
    "BENCH": {"fg_pct":1.0, "min_avg":1.0},
}

#  KPI derivation 
def compute_kpis(row: pd.Series) -> dict:
    """Compute derived KPIs from a player's season averages."""
    min_g  = max(row["min_avg"], 0.1)   # guard against /0
    fga_g  = max(row["fga_avg"], 0.1)

    return {
        # Raw averages (already per-game)
        "pts_avg":       round(row["pts_avg"], 3),
        "ast_avg":       round(row["ast_avg"], 3),
        "reb_avg":       round(row["reb_avg"], 3),
        "oreb_avg":      round(row["oreb_avg"], 3),
        "dreb_avg":      round(row["dreb_avg"], 3),
        "stl_avg":       round(row["stl_avg"], 3),
        "blk_avg":       round(row["blk_avg"], 3),
        "tov_avg":       round(row["tov_avg"], 3),
        "pf_avg":        round(row["pf_avg"], 3),
        "min_avg":       round(row["min_avg"], 3),
        "fgm_avg":       round(row["fgm_avg"], 3),
        "fga_avg":       round(row["fga_avg"], 3),
        "fg3m_avg":      round(row["fg3m_avg"], 3),
        "fg3a_avg":      round(row["fg3a_avg"], 3),
        "ftm_avg":       round(row["ftm_avg"], 3),
        "fta_avg":       round(row["fta_avg"], 3),
        # Efficiency
        "fg_pct":        round(row["fg_pct"], 3),
        "fg3_pct":       round(row["fg3_pct"], 3),
        "ft_pct":        round(row["ft_pct"], 3),
        "ast_tov_ratio": round(row["ast_tov_ratio"], 3),
        # Derived rate stats
        "usage_rate":       round((row["fga_avg"] + row["ast_avg"] + row["tov_avg"]) / min_g, 4),
        "defensive_activity": round((row["stl_avg"] + row["blk_avg"]) / min_g, 4),
        "rebounding_rate":  round(row["reb_avg"] / min_g, 4),
        "scoring_efficiency": round(row["pts_avg"] / fga_g, 4),
    }


# Weakness → drill-category mapping 
WEAKNESS_DRILL_MAP = {
    "fg_pct":             ["shooting_mechanics", "finishing"],
    "scoring_efficiency": ["shooting_mechanics", "finishing"],
    "fg3_pct":            ["perimeter_shooting"],
    "ft_pct":             ["free_throw"],
    "ast_tov_ratio":      ["ball_handling", "decision_making"],
    "tov_avg":            ["ball_handling", "decision_making"],
    "ast_avg":            ["passing"],
    "reb_avg":            ["rebounding"],
    "oreb_avg":           ["rebounding"],
    "dreb_avg":           ["rebounding"],
    "stl_avg":            ["defensive_awareness"],
    "blk_avg":            ["defensive_awareness"],
    "defensive_activity": ["defensive_awareness"],
    "pf_avg":             ["discipline_footwork"],
    "rebounding_rate":    ["rebounding"],
    "usage_rate":         ["decision_making"],
}

# Each drill in the CSV has Target_Metrics; we map category → metric keywords
DRILL_CATEGORY_KEYWORDS = {
    "shooting_mechanics": ["fg_pct", "pts_avg", "ft_pct"],
    "finishing":          ["fg_pct", "pts_avg"],
    "perimeter_shooting": ["fg3_pct", "fg_pct"],
    "free_throw":         ["ft_pct"],
    "ball_handling":      ["tov_avg", "ast_tov_ratio"],
    "decision_making":    ["ast_tov_ratio", "tov_avg", "ast_avg"],
    "passing":            ["ast_avg", "ast_tov_ratio"],
    "rebounding":         ["reb_avg", "oreb_avg", "dreb_avg"],
    "defensive_awareness":["stl_avg", "blk_avg"],
    "discipline_footwork":["pf_avg", "stl_avg"],
}

# Metrics to benchmark (displayed name → column key)
BENCHMARK_METRICS = {
    "Field Goal %":          "fg_pct",
    "3-Point %":             "fg3_pct",
    "Free Throw %":          "ft_pct",
    "Assist/Turnover Ratio": "ast_tov_ratio",
    "Usage Rate":            "usage_rate",
    "Defensive Activity":    "defensive_activity",
    "Rebounding Rate":       "rebounding_rate",
    "Scoring Efficiency":    "scoring_efficiency",
    "Assists (avg)":         "ast_avg",
    "Rebounds (avg)":        "reb_avg",
    "Steals (avg)":          "stl_avg",
    "Blocks (avg)":          "blk_avg",
    "Turnovers (avg)":       "tov_avg",
    "Fouls (avg)":           "pf_avg",
}

# For turnovers and fouls, lower is BETTER — flip percentile logic
LOWER_IS_BETTER = {"tov_avg", "pf_avg"}


class KipajiModel:
    """
    Main model class. Call `.fit()` once to train on the season dataset,
    then `.analyze_player(player_id)` for any player.
    """

    def __init__(self):
        self.stats_df   : Optional[pd.DataFrame] = None
        self.players_df : Optional[pd.DataFrame] = None
        self.teams_df   : Optional[pd.DataFrame] = None
        self.drills_df  : Optional[pd.DataFrame] = None
        self.kpis_df    : Optional[pd.DataFrame] = None   # derived KPIs for all players
        self.scaler     : Optional[StandardScaler] = None
        self.kmeans     : Optional[KMeans] = None
        self.is_fitted   = False


    # 1. FIT
 
    def fit(self) -> "KipajiModel":
        # Load data from PostgreSQL
        engine = create_engine(DB_URI)
        self.stats_df   = pd.read_sql_table("player_season_stats", engine)
        self.players_df = pd.read_sql_table("dim_players", engine)
        self.teams_df   = pd.read_sql_table("player_team_seasons", engine)
        self.drills_df  = pd.read_sql_table("drills", engine)

        # Merge player name + team into stats
        self.stats_df = self.stats_df.merge(
            self.players_df[["player_id", "full_name"]], on="player_id", how="left"
        )
        team_info = self.teams_df[["player_id", "primary_team_abbr", "primary_team_id",
                                   "all_teams_season", "num_teams"]].rename(
            columns={"primary_team_abbr": "team_abbr", "primary_team_id": "team_id"})
        self.stats_df = self.stats_df.merge(team_info, on="player_id", how="left")

        # Compute KPIs for every player
        kpi_rows = []
        for _, row in self.stats_df.iterrows():
            kpi = compute_kpis(row)
            kpi["player_id"]   = row["player_id"]
            kpi["full_name"]   = row["full_name"]
            kpi["team_abbr"]   = row.get("team_abbr", "N/A")
            kpi["games_played"]= row["games_played"]
            kpi_rows.append(kpi)
        self.kpis_df = pd.DataFrame(kpi_rows)

        # Position clustering 
        pos_features = ["reb_avg","oreb_avg","dreb_avg","blk_avg",
                        "ast_avg","fg3_pct","fg3a_avg","stl_avg","min_avg","pts_avg"]
        X = self.kpis_df[pos_features].fillna(0).values
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.kmeans = KMeans(n_clusters=5, random_state=42, n_init=20)
        self.kpis_df["cluster"] = self.kmeans.fit_predict(X_scaled)
        self.kpis_df["position_group"] = self.kpis_df["cluster"].map(CLUSTER_LABELS)

        # Save fitted objects
        joblib.dump(self.scaler, MODELS_DIR / "scaler.pkl")
        joblib.dump(self.kmeans, MODELS_DIR / "kmeans.pkl")
        self.kpis_df.to_csv(MODELS_DIR / "kpis_with_positions.csv", index=False)

        self.is_fitted = True
        print(f"✅ KipajiModel fitted on {len(self.kpis_df)} players.")
        return self

  
    # 2. LOAD (if already fitted)
 
    def load(self) -> "KipajiModel":
        engine = create_engine(DB_URI)
        self.stats_df   = pd.read_sql_table("player_season_stats", engine)
        self.players_df = pd.read_sql_table("dim_players", engine)
        self.teams_df   = pd.read_sql_table("player_team_seasons", engine)
        self.drills_df  = pd.read_sql_table("drills", engine)
        self.scaler     = joblib.load(MODELS_DIR / "scaler.pkl")
        self.kmeans     = joblib.load(MODELS_DIR / "kmeans.pkl")
        self.kpis_df    = pd.read_csv(MODELS_DIR / "kpis_with_positions.csv")
        self.is_fitted  = True
        return self
    # 3. BENCHMARK: percentile within position group
  
    def _benchmark(self, player_kpi: dict, position_group: str) -> dict:
        """
        Return a dict of { metric_key: { value, percentile, label } }
        label ∈ { "Strength", "Average", "Weakness" }
        Benchmarked against players of the same position cluster.
        """
        peers = self.kpis_df[self.kpis_df["position_group"] == position_group]

        benchmarks = {}
        for display_name, col in BENCHMARK_METRICS.items():
            if col not in player_kpi or col not in peers.columns:
                continue
            val = player_kpi[col]
            peer_vals = peers[col].dropna()
            if len(peer_vals) < 3:
                peer_vals = self.kpis_df[col].dropna()  # fallback to league-wide

            pct = float(np.sum(peer_vals <= val) / len(peer_vals))

            # For lower-is-better metrics, invert
            if col in LOWER_IS_BETTER:
                pct = 1.0 - pct

            if pct >= 0.65:
                label = "Strength"
            elif pct <= 0.35:
                label = "Weakness"
            else:
                label = "Average"

            benchmarks[col] = {
                "display_name": display_name,
                "value":        round(val, 4),
                "percentile":   round(pct * 100, 1),
                "label":        label,
            }
        return benchmarks

    # 4. IDENTIFY WEAKNESSES
    def _identify_weaknesses(self, benchmarks: dict, position_group: str, top_n: int = 3) -> list:
        """Return top_n weakest metrics, adjusted by position relevance."""
        weights = POSITION_METRIC_WEIGHTS.get(position_group, {})

        scored = []
        for col, info in benchmarks.items():
            if info["label"] == "Weakness":
                # Deviation = how far below 35th percentile
                deviation = 35.0 - info["percentile"]
                # Boost deviation by position weight
                weight = weights.get(col, 1.0)
                score  = deviation * weight
                scored.append((col, score, info))

        scored.sort(key=lambda x: -x[1])
        return scored[:top_n]

   
    # 5. DRILL RECOMMENDATION
    def _recommend_drills(self, weak_metrics: list, position_group: str, n_per_weakness: int = 3) -> list:
        """Map each weakness to drill categories, then select best matching drills."""
        recommendations = []

        for (metric_col, score, metric_info) in weak_metrics:
            categories = WEAKNESS_DRILL_MAP.get(metric_col, [])
            if not categories:
                continue

            # Gather all keywords for these categories
            target_keywords = set()
            for cat in categories:
                target_keywords.update(DRILL_CATEGORY_KEYWORDS.get(cat, []))

            # Score each drill
            drill_scores = []
            for _, drill in self.drills_df.iterrows():
                drill_metrics_str = str(drill.get("target_metrics", "")).lower()
                positions_str     = str(drill.get("positions_targeted", "All")).upper()

                # Keyword match score
                match = sum(1 for kw in target_keywords if kw in drill_metrics_str)
                if match == 0:
                    continue

                # Position bonus
                pos_bonus = 0
                if positions_str == "ALL":
                    pos_bonus = 0.5
                else:
                    for abbr in ["PG","SG","SF","PF","C","G","F"]:
                        if abbr in positions_str and abbr in position_group.upper():
                            pos_bonus = 1.0
                            break

                drill_scores.append((match + pos_bonus, drill))

            drill_scores.sort(key=lambda x: -x[0])
            top_drills = [d for (_, d) in drill_scores[:n_per_weakness]]

            recommendations.append({
                "weakness_metric":    metric_col,
                "weakness_display":   metric_info["display_name"],
                "percentile":         metric_info["percentile"],
                "value":              metric_info["value"],
                "drills": [
                    {
                        "drill_id":    d.get("drill_id", ""),
                        "name":        d.get("drill_name", ""),
                        "skill":       d.get("improves_skill", ""),
                        "difficulty":  d.get("difficulty_level", ""),
                        "intensity":   d.get("intensity", ""),
                        "focus":       d.get("focus", ""),
                        "description": d.get("description", ""),
                    }
                    for d in top_drills
                ]
            })

        return recommendations

    # 6. ANALYZE PLAYER  (main entry point
    def analyze_player(self, player_id: int) -> dict:
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Call .fit() or .load() first.")

        row = self.kpis_df[self.kpis_df["player_id"] == player_id]
        if row.empty:
            raise ValueError(f"Player ID {player_id} not found in dataset.")

        row = row.iloc[0]
        position_group = row["position_group"]
        player_kpi     = row.to_dict()

        # Benchmark
        benchmarks = self._benchmark(player_kpi, position_group)

        # Strengths & weaknesses
        strengths  = {k: v for k, v in benchmarks.items() if v["label"] == "Strength"}
        averages   = {k: v for k, v in benchmarks.items() if v["label"] == "Average"}
        weaknesses = {k: v for k, v in benchmarks.items() if v["label"] == "Weakness"}

        # Top weaknesses with drill recs
        top_weaknesses = self._identify_weaknesses(benchmarks, position_group)
        drill_recs     = self._recommend_drills(top_weaknesses, position_group)

        return {
            "player_id":      player_id,
            "full_name":      row["full_name"],
            "team":           row.get("team_abbr", "N/A"),
            "games_played":   int(row["games_played"]),
            "position_group": position_group,
            "kpis":           {k: round(float(v), 4) for k, v in player_kpi.items()
                               if isinstance(v, (int, float, np.integer, np.floating))},
            "benchmarks":     benchmarks,
            "strengths":      strengths,
            "averages":       averages,
            "weaknesses":     weaknesses,
            "recommendations": drill_recs,
        }


    # 7. SEARCH PLAYERS
    def search_players(self, query: str, limit: int = 10) -> list:
        if not self.is_fitted:
            raise RuntimeError("Model not fitted.")
        q = query.lower().strip()
        matches = self.kpis_df[self.kpis_df["full_name"].str.lower().str.contains(q, na=False)]
        return matches[["player_id","full_name","team_abbr","position_group","games_played"]] \
               .head(limit).to_dict(orient="records")


    # 8. LEADERBOARD
    def leaderboard(self, metric: str = "pts_avg", position_group: Optional[str] = None,
                    top_n: int = 20, ascending: bool = False) -> list:
        df = self.kpis_df.copy()
        if position_group:
            df = df[df["position_group"] == position_group]
        if metric not in df.columns:
            raise ValueError(f"Unknown metric: {metric}")
        df = df.sort_values(metric, ascending=ascending).head(top_n)
        cols = ["player_id","full_name","team_abbr","position_group","games_played", metric]
        return df[cols].to_dict(orient="records")


# CLI entry point 
if __name__ == "__main__":
    import argparse, pprint

    parser = argparse.ArgumentParser(description="Kipaji Player Analyzer")
    parser.add_argument("--fit",    action="store_true", help="Fit and save the model")
    parser.add_argument("--player", type=int,            help="Analyze a player by ID")
    parser.add_argument("--search", type=str,            help="Search player by name")
    args = parser.parse_args()

    model = KipajiModel()

    if args.fit:
        model.fit()
    else:
        model.load()

    if args.search:
        results = model.search_players(args.search)
        print(json.dumps(results, indent=2))

    if args.player:
        result = model.analyze_player(args.player)
        pprint.pprint(result)
