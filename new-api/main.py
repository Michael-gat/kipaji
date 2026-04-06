"""
Kipaji FastAPI Service
======================
Exposes ML model endpoints consumed by the Node/Express backend.
Run:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations
import os
from functools import lru_cache
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt

from model import KipajiModel

# ── App setup ─────────────────────────────────────────────
app = FastAPI(
    title="Kipaji ML API",
    description="Player analysis and drill recommendation engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],  # Node backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth (validates JWT issued by Node/Express) ────────────
JWT_SECRET  = os.getenv("JWT_SECRET", "change_me_in_production")
JWT_ALGO    = "HS256"
bearer_scheme = HTTPBearer()

def verify_token(creds: HTTPAuthorizationCredentials = Security(bearer_scheme)) -> dict:
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Load model once at startup ─────────────────────────────
@lru_cache(maxsize=1)
def get_model() -> KipajiModel:
    model = KipajiModel()
    try:
        model.load()
    except FileNotFoundError:
        model.fit()
    return model

@app.on_event("startup")
async def startup():
    get_model()   # warm up

# ── Request / Response schemas ─────────────────────────────
class AnalysisResponse(BaseModel):
    player_id:      int
    full_name:      str
    team:           str
    games_played:   int
    position_group: str
    kpis:           dict
    benchmarks:     dict
    strengths:      dict
    averages:       dict
    weaknesses:     dict
    recommendations: list

class PlayerSummary(BaseModel):
    player_id:      int
    full_name:      str
    team_abbr:      Optional[str]
    position_group: Optional[str]
    games_played:   int

class LeaderboardEntry(BaseModel):
    player_id:      int
    full_name:      str
    team_abbr:      Optional[str]
    position_group: Optional[str]
    games_played:   int

# ── Endpoints ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "kipaji-ml"}


@app.get("/players/search", response_model=List[PlayerSummary])
def search_players(
    q: str,
    limit: int = 10,
    _user: dict = Depends(verify_token),
    model: KipajiModel = Depends(get_model),
):
    """Search players by name (partial match)."""
    results = model.search_players(q, limit=limit)
    return results


@app.get("/players/{player_id}/analysis", response_model=AnalysisResponse)
def analyze_player(
    player_id: int,
    _user: dict = Depends(verify_token),
    model: KipajiModel = Depends(get_model),
):
    """
    Full player analysis:
    KPIs → benchmarks → strengths/weaknesses → drill recommendations.
    """
    try:
        result = model.analyze_player(player_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


@app.get("/leaderboard")
def leaderboard(
    metric:         str = "pts_avg",
    position_group: Optional[str] = None,
    top_n:          int = 20,
    ascending:      bool = False,
    _user: dict = Depends(verify_token),
    model: KipajiModel = Depends(get_model),
):
    """Return top players by any KPI metric."""
    try:
        return model.leaderboard(metric=metric, position_group=position_group,
                                 top_n=top_n, ascending=ascending)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/players/{player_id}/peers")
def player_peers(
    player_id: int,
    top_n: int = 5,
    _user: dict = Depends(verify_token),
    model: KipajiModel = Depends(get_model),
):
    """Return similar players by position group and stats profile."""
    try:
        row = model.kpis_df[model.kpis_df["player_id"] == player_id]
        if row.empty:
            raise HTTPException(status_code=404, detail="Player not found")
        pos = row.iloc[0]["position_group"]
        peers = model.kpis_df[
            (model.kpis_df["position_group"] == pos) &
            (model.kpis_df["player_id"] != player_id)
        ][["player_id","full_name","team_abbr","position_group","games_played","pts_avg","ast_avg","reb_avg"]]\
         .sort_values("pts_avg", ascending=False).head(top_n)
        return peers.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/model/retrain")
def retrain_model(
    _user: dict = Depends(verify_token),
):
    """Re-fit the model (admin only)."""
    if _user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    get_model.cache_clear()
    m = KipajiModel().fit()
    get_model.cache_clear()
    return {"status": "retrained", "players": len(m.kpis_df)}
