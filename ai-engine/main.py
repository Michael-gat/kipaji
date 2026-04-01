from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

# --- 1. Load Data ---
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, '..', 'data')

try:
    players_df = pd.read_csv(os.path.join(data_dir, 'synthetic_players.csv'))
    drills_df = pd.read_csv(os.path.join(data_dir, 'drill_database.csv'))
except FileNotFoundError:
    print("Warning: CSV files not found. Ensure generate_data.py has been run.")
    players_df = pd.DataFrame()
    drills_df = pd.DataFrame()

# 2. Initialize FastAPI App 
app = FastAPI(title="Kipaji AI Engine API")

# Allow the Node.js backend to make requests to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. AI Logic Functions (Same as before!) 
def calculate_position_averages(df, position):
    pos_df = df[df['Position'] == position]
    if pos_df.empty: return None
    metrics = ['PTS', 'AST', 'TRB', 'TOV', 'FG_Pct', 'FG3_Pct', 'FT_Pct', 'TS_Pct', 'AST_TO_Ratio']
    return pos_df[metrics].mean().to_dict()

def identify_weakness(player_stats, averages):
    gaps = {}
    higher_is_better = ['PTS', 'AST', 'TRB', 'FG_Pct', 'FG3_Pct', 'FT_Pct', 'TS_Pct', 'AST_TO_Ratio']
    for metric in higher_is_better:
        if averages[metric] > 0:
            gaps[metric] = (player_stats[metric] - averages[metric]) / averages[metric]
    
    if averages['TOV'] > 0:
         gaps['TOV'] = (averages['TOV'] - player_stats['TOV']) / averages['TOV']

    weakest_metric = min(gaps, key=gaps.get)
    return weakest_metric, gaps[weakest_metric]

def recommend_drills(weak_metric, drills_df):
    matching_drills = drills_df[drills_df['Target_Metrics'].str.contains(weak_metric, na=False)]
    if matching_drills.empty: return []
    return matching_drills[['Drill_Name', 'Improves_Skill', 'Difficulty_Level', 'Description']].to_dict('records')

#  4. API Endpoints (The new part!) 
@app.get("/")
def read_root():
    return {"message": "Kipaji AI Engine is running."}

@app.get("/api/players")
def get_all_players():
    """Returns a list of all players in the database for the frontend roster table."""
    if players_df.empty:
        return {"players": []}
    
    simplified_roster = players_df[['Name', 'Position', 'TS_Pct']].to_dict('records')
    return {"players": simplified_roster}

@app.get("/api/evaluate/{player_name}")
def evaluate_player_endpoint(player_name: str):
    """The main AI endpoint. Takes a player name in the URL and returns JSON recommendations."""
    if players_df.empty:
        raise HTTPException(status_code=500, detail="Database not initialized.")

    # Find player (case insensitive)
    player_row = players_df[players_df['Name'].str.lower() == player_name.lower()]
    if player_row.empty:
        raise HTTPException(status_code=404, detail="Player not found in the dataset.")
    
    player_stats = player_row.iloc[0].to_dict()
    position = player_stats['Position']
    averages = calculate_position_averages(players_df, position)
    
    weak_metric, gap = identify_weakness(player_stats, averages)
    recommendations = recommend_drills(weak_metric, drills_df)

    # Return structured JSON instead of print statements!
    return {
        "player_info": {
            "name": player_stats['Name'],
            "position": position,
            "current_ts": round(player_stats['TS_Pct'], 3)
        },
        "ai_analysis": {
            "primary_weakness": weak_metric,
            "gap_percentage": round(abs(gap) * 100, 1)
        },
        "recommended_drills": recommendations
    }