# PART 2: AI ENGINE PROTOTYPE
print("--- Initializing Kipaji AI Engine ---\n")

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
    if matching_drills.empty: return None
    return matching_drills[['Drill_Name', 'Improves_Skill', 'Difficulty_Level', 'Description']].to_dict('records')

def evaluate_player(player_name, players_df, drills_df):

    print(f"KIPAJI AI EVALUATION: {player_name}")
    
    player_row = players_df[players_df['Name'] == player_name]
    if player_row.empty: return
    
    player_stats = player_row.iloc[0].to_dict()
    position = player_stats['Position']
    
    print(f"Position: {position}")
    print(f"Current Core Stats: {player_stats['PTS']} PTS | {player_stats['AST']} AST | {player_stats['TRB']} TRB")
    print(f"Current Efficiencies: TS%: {player_stats['TS_Pct']:.3f} | TOV: {player_stats['TOV']}")
    
    averages = calculate_position_averages(players_df, position)
    weak_metric, gap = identify_weakness(player_stats, averages)
    
    print(f"\n[AI ANALYSIS]")
    print(f"-> Primary Weakness Identified: {weak_metric}")
    print(f"-> They are {abs(gap)*100:.1f}% worse than the average {position} in this category.")
    
    recommendations = recommend_drills(weak_metric, drills_df)
    
    print("\n[RECOMMENDED DRILLS]")
    if recommendations:
        for i, drill in enumerate(recommendations, 1):
            print(f"  {i}. {drill['Drill_Name']} ({drill['Difficulty_Level']})")
            print(f"     Focus: {drill['Improves_Skill']}")
            print(f"     Details: {drill['Description']}\n")
    else:
        print(f"  No specific drills found in the database to target {weak_metric} yet.\n")


# Run a test evaluation on 3 random players!
sample_players = df_players['Name'].sample(3).tolist()
for player in sample_players:
    evaluate_player(player, df_players, df_drills)