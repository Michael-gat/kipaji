import pandas as pd
import os

# --- 1. Load Data from CSV ---
# (This points to the data folder outside of the ai-engine folder)
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, '..', 'data')

try:
    players_df = pd.read_csv(os.path.join(data_dir, 'synthetic_players.csv'))
    drills_df = pd.read_csv(os.path.join(data_dir, 'drill_database.csv'))
    print("Data successfully loaded!")
except FileNotFoundError:
    print("Error: Could not find the CSV files in the data directory.")
    print("Please make sure you have run 'generate_data.py' first!")
    exit(1)

# --- 2. AI Logic Functions ---
def calculate_position_averages(df, position):
    """Calculates the average stats for all players of a specific position."""
    pos_df = df[df['Position'] == position]
    if pos_df.empty:
        return None
    metrics = ['PTS', 'AST', 'TRB', 'TOV', 'FG_Pct', 'FG3_Pct', 'FT_Pct', 'TS_Pct', 'AST_TO_Ratio']
    return pos_df[metrics].mean().to_dict()

def identify_weakness(player_stats, averages):
    """Compares a player's stats to positional averages to find the biggest negative gap."""
    gaps = {}
    
    higher_is_better = ['PTS', 'AST', 'TRB', 'FG_Pct', 'FG3_Pct', 'FT_Pct', 'TS_Pct', 'AST_TO_Ratio']
    for metric in higher_is_better:
        if averages[metric] > 0:
            gaps[metric] = (player_stats[metric] - averages[metric]) / averages[metric]
    
    if averages['TOV'] > 0:
         gaps['TOV'] = (averages['TOV'] - player_stats['TOV']) / averages['TOV']

    weakest_metric = min(gaps, key=gaps.get)
    weakest_gap_value = gaps[weakest_metric]

    return weakest_metric, weakest_gap_value

def recommend_drills(weak_metric, drills_df):
    """Searches the drill database for drills that target the weak metric."""
    matching_drills = drills_df[drills_df['Target_Metrics'].str.contains(weak_metric, na=False)]
    
    if matching_drills.empty:
        return None
    
    return matching_drills[['Drill_Name', 'Improves_Skill', 'Difficulty_Level', 'Description']].to_dict('records')

def evaluate_player(player_name):
    """The main recommendation pipeline for a single player."""
    print(f"\n--- Kipaji AI Evaluation: {player_name} ---")
    
    player_row = players_df[players_df['Name'] == player_name]
    if player_row.empty:
        print(f"Player '{player_name}' not found in database.")
        return
    
    player_stats = player_row.iloc[0].to_dict()
    position = player_stats['Position']
    
    print(f"Position: {position}")
    print(f"Current Stats: {player_stats['PTS']} PTS | {player_stats['AST']} AST | {player_stats['TRB']} TRB | TS%: {player_stats['TS_Pct']:.3f} | TOV: {player_stats['TOV']}")
    
    averages = calculate_position_averages(players_df, position)
    if not averages:
        print(f"Could not calculate averages for position {position}.")
        return
    
    weak_metric, gap = identify_weakness(player_stats, averages)
    
    if gap >= 0:
        print(f"Result: {player_name} is performing above average across all tracked metrics for a {position}. Recommend advanced progression.")
        return
    
    print(f"\nAI Analysis:")
    print(f"-> Primary Weakness Identified: {weak_metric}")
    print(f"-> They are {abs(gap)*100:.1f}% worse than the average {position} in this category.")
    
    recommendations = recommend_drills(weak_metric, drills_df)
    
    if not recommendations:
        print(f"\nNo specific drills found in the database to target {weak_metric} yet.")
        return
        
    print("\nRecommended Drills:")
    for i, drill in enumerate(recommendations, 1):
        print(f"  {i}. {drill['Drill_Name']} ({drill['Difficulty_Level']})")
        print(f"     Focus: {drill['Improves_Skill']}")
        print(f"     Details: {drill['Description']}")
        print("-" * 40)

# --- 3. Test the Engine ---
if __name__ == "__main__":
    print("--- Initializing Kipaji AI Engine ---")
    
    # We use players_df here because that is the name of the variable 
    # we created on line 10 when we loaded the CSV!
    sample_players = players_df['Name'].sample(3).tolist()
    
    for player in sample_players:
        evaluate_player(player)