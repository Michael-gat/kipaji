import pandas as pd
import numpy as np
import random
import uuid
import os

# ==========================================
# PART 1: DATA GENERATION
# ==========================================
print("--- Generating Kipaji Synthetic Data ---")
np.random.seed(42)
random.seed(42)

def generate_player_data(num_players=100):
    first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas", "Christopher", "Daniel", "Paul", "Mark", "Donald", "George", "Kenneth", "Steven", "Edward", "Brian", "Ronald", "Anthony", "Kevin", "Jason", "Matthew", "Gary", "Timothy", "Jose", "Larry", "Jeffrey", "Frank", "Scott", "Eric", "Stephen", "Andrew", "Raymond", "Gregory", "Joshua", "Jerry", "Dennis"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"]
    
    positions = ['PG', 'SG', 'SF', 'PF', 'C']
    data = []
    
    for _ in range(num_players):
        player_id = str(uuid.uuid4())[:8]
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        position = random.choice(positions)
        
        # Base stats dependent on position
        if position == 'PG':
            height = np.random.normal(73, 2)
            weight = np.random.normal(185, 10)
            pts = max(5, np.random.normal(14, 4))
            ast = max(2, np.random.normal(6, 2))
            trb = max(1, np.random.normal(3, 1))
            fg_pct = min(0.60, max(0.35, np.random.normal(0.43, 0.05)))
            fg3_pct = min(0.45, max(0.25, np.random.normal(0.35, 0.05)))
            ft_pct = min(0.95, max(0.65, np.random.normal(0.80, 0.08)))
        elif position == 'SG':
            height = np.random.normal(76, 2)
            weight = np.random.normal(200, 10)
            pts = max(8, np.random.normal(16, 5))
            ast = max(1, np.random.normal(3, 1.5))
            trb = max(2, np.random.normal(4, 1.5))
            fg_pct = min(0.60, max(0.35, np.random.normal(0.44, 0.05)))
            fg3_pct = min(0.45, max(0.25, np.random.normal(0.37, 0.05)))
            ft_pct = min(0.95, max(0.65, np.random.normal(0.78, 0.08)))
        elif position == 'SF':
            height = np.random.normal(79, 2)
            weight = np.random.normal(220, 15)
            pts = max(6, np.random.normal(13, 4))
            ast = max(1, np.random.normal(2.5, 1))
            trb = max(3, np.random.normal(5.5, 1.5))
            fg_pct = min(0.65, max(0.38, np.random.normal(0.46, 0.05)))
            fg3_pct = min(0.42, max(0.20, np.random.normal(0.33, 0.06)))
            ft_pct = min(0.90, max(0.60, np.random.normal(0.75, 0.08)))
        elif position == 'PF':
            height = np.random.normal(81, 2)
            weight = np.random.normal(240, 15)
            pts = max(5, np.random.normal(12, 4))
            ast = max(0.5, np.random.normal(1.5, 0.8))
            trb = max(5, np.random.normal(8, 2))
            fg_pct = min(0.70, max(0.40, np.random.normal(0.50, 0.06)))
            fg3_pct = min(0.38, max(0.10, np.random.normal(0.28, 0.08)))
            ft_pct = min(0.85, max(0.50, np.random.normal(0.70, 0.10)))
        else: # Center
            height = np.random.normal(83, 2)
            weight = np.random.normal(255, 15)
            pts = max(4, np.random.normal(10, 4))
            ast = max(0.5, np.random.normal(1, 0.5))
            trb = max(6, np.random.normal(10, 2.5))
            fg_pct = min(0.75, max(0.45, np.random.normal(0.55, 0.06)))
            fg3_pct = min(0.30, max(0.0, np.random.normal(0.15, 0.10)))
            ft_pct = min(0.80, max(0.40, np.random.normal(0.65, 0.12)))

        fga = pts / (fg_pct * 2 + 0.1) 
        fta = pts * 0.25 / ft_pct if ft_pct > 0 else 0
        ts_pct = pts / (2 * (fga + 0.44 * fta)) if (fga + 0.44 * fta) > 0 else 0
        
        tov = ast * np.random.normal(0.4, 0.1) if position in ['PG', 'SG'] else ast * np.random.normal(0.8, 0.2)
        tov = max(0.5, tov)
        ast_to_tov = ast / tov if tov > 0 else ast

        data.append({
            'Player_ID': player_id, 'Name': name, 'Position': position,
            'Height_Inches': round(height), 'Weight_lbs': round(weight),
            'PTS': round(pts, 1), 'AST': round(ast, 1), 'TRB': round(trb, 1),
            'TOV': round(tov, 1), 'FG_Pct': round(fg_pct, 3), 'FG3_Pct': round(fg3_pct, 3),
            'FT_Pct': round(ft_pct, 3), 'TS_Pct': round(ts_pct, 3), 'AST_TO_Ratio': round(ast_to_tov, 2)
        })
        
    return pd.DataFrame(data)

def generate_drill_data():
    drills = [
        {'Drill_ID': 'D001', 'Drill_Name': 'Mikan Drill', 'Improves_Skill': 'Finishing, Weak Hand', 'Target_Metrics': 'FG_Pct, TS_Pct', 'Difficulty_Level': 'Beginner', 'Positions_Targeted': 'All', 'Description': 'Continuous layups focusing on footwork and using both hands right under the basket.'},
        {'Drill_ID': 'D002', 'Drill_Name': 'Form Shooting Series', 'Improves_Skill': 'Shooting Mechanics', 'Target_Metrics': 'FG_Pct, FG3_Pct, FT_Pct, TS_Pct', 'Difficulty_Level': 'Beginner', 'Positions_Targeted': 'All', 'Description': 'One-handed shooting close to the basket to build muscle memory and correct form.'},
        {'Drill_ID': 'D003', 'Drill_Name': '2-Ball Dribbling', 'Improves_Skill': 'Ball Handling, Vision', 'Target_Metrics': 'TOV, AST_TO_Ratio', 'Difficulty_Level': 'Intermediate', 'Positions_Targeted': 'PG, SG', 'Description': 'Dribbling two basketballs simultaneously while keeping eyes up.'},
        {'Drill_ID': 'D004', 'Drill_Name': 'Superman Rebounding', 'Improves_Skill': 'Rebounding, Conditioning', 'Target_Metrics': 'TRB', 'Difficulty_Level': 'Intermediate', 'Positions_Targeted': 'PF, C, SF', 'Description': 'Tapping the ball off the backboard continuously from one side of the rim to the other without landing.'},
        {'Drill_ID': 'D005', 'Drill_Name': 'Spot-Up Shooting (5 Spots)', 'Improves_Skill': 'Catch and Shoot', 'Target_Metrics': 'FG3_Pct, TS_Pct', 'Difficulty_Level': 'Intermediate', 'Positions_Targeted': 'PG, SG, SF', 'Description': 'Receiving passes and shooting 3-pointers from 5 different spots on the perimeter.'},
        {'Drill_ID': 'D006', 'Drill_Name': 'Post Moves (Drop Step & Hook)', 'Improves_Skill': 'Post Scoring', 'Target_Metrics': 'FG_Pct, PTS', 'Difficulty_Level': 'Advanced', 'Positions_Targeted': 'PF, C', 'Description': 'Practicing standard post moves from the low block against a pad or defender.'},
        {'Drill_ID': 'D007', 'Drill_Name': 'Pick and Roll Reads', 'Improves_Skill': 'Playmaking, Decision Making', 'Target_Metrics': 'AST, AST_TO_Ratio', 'Difficulty_Level': 'Advanced', 'Positions_Targeted': 'PG, SG', 'Description': 'Running pick and rolls against a defense and practicing reads (pass to roller, kick out, or score).'}
    ]
    return pd.DataFrame(drills)

# Generate and save locally in the data folder
df_players = generate_player_data(100)
df_players.to_csv('data/synthetic_players.csv', index=False)

df_drills = generate_drill_data()
df_drills.to_csv('data/drill_database.csv', index=False)

print("-> Data generated and saved successfully to the data/ folder!\n")


