# WEEK 10 - Proof of Project Completion Report

**APT SWE: KIPAJI AI SPORTS ANALYTICS PLATFORM**

---

## 1. Figma Designs (with System Time)
*Note: As this is a backend/code environment without a GUI or Figma integration, physical screenshots cannot be generated here. Please take screenshots of your Figma file on your local machine, ensuring your system clock is visible.*

**Screenshots to capture:**
- **Landing Page design (initial view):** Show the initial page the user sees.
- **Navigation flow:** Show the navigation menu, buttons, and transitions.
- **Key feature pages:** Show the Coach Dashboard, Player Search, and Player Analytics/Drill Recommendations pages.

---

## 2. Landing Page → System Design Flow
*Note: Again, capture these on your actual frontend environment. Ensure the system clock is visible.*

**Screenshots to capture sequentially:**
- **Step 1: Landing Page** - The initial application load.
- **Step 2: Login/Signup** - Assuming you have authentication implemented.
- **Step 3: Dashboard** - The main dashboard showing the roster (`/api/coach/roster`).
- **Step 4: Feature modules** - The player evaluation screen showing the AI analysis and weaknesses (`/api/coach/evaluate/:playerName`).
- **Step 5: Settings** - Any user settings or configuration pages.

*Highlight interactive elements like the "Search Player" button, "Evaluate" button, and links to recommended drills.*

---

## 3. Database/Dataset Linked to UML/Schema

This section contains data extracted directly from the Kipaji AI project database.

### Database ERD/Schema Diagram
*Please generate a visual ERD using a tool like pgAdmin, DBeaver, or Lucidchart using the following schema details:*

**Core Tables:**
- `users`: id (UUID), email, full_name, role.
- `dim_players`: player_id (PK), full_name, first_name, last_name.
- `dim_teams`: team_id (PK), team_name, abbreviation.
- `fact_player_games`: game_id, player_id (FK), game_date, fgm, fga, pts, reb, ast, etc.
- `player_season_stats`: id, player_id (FK), season, pts_avg, reb_avg, ast_avg, etc.
- `drills`: drill_id (PK), drill_name, improves_skill, target_metrics.

### Dataset Previews & Queries

**Query 1: Player Roster (`dim_players`)**
```sql
SELECT player_id, full_name FROM dim_players LIMIT 3;
```
| player_id | full_name |
| :--- | :--- |
| 1630173 | Precious Achiuwa |
| 203500 | Steven Adams |
| 1628389 | Bam Adebayo |

**Query 2: Recommended Drills Repository (`drills`)**
```sql
SELECT drill_id, drill_name, improves_skill FROM drills LIMIT 3;
```
| drill_id | drill_name | improves_skill |
| :--- | :--- | :--- |
| D001 | Mikan Drill | Finishing, Weak Hand |
| D002 | Form Shooting Series | Shooting Mechanics |
| D003 | 2-Ball Dribbling | Ball Handling, Vision |

**Query 3: Player Season Stats Linkage (`player_season_stats`)**
```sql
SELECT player_id, season, games_played, pts_avg, reb_avg, ast_avg FROM player_season_stats LIMIT 3;
```
| player_id | season | games_played | pts_avg | reb_avg | ast_avg |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2544 | 2024-25 | 70 | 9.300 | 8.214 | 1.000 |
| 101108 | 2024-25 | 82 | 3.037 | 7.378 | 1.256 |
| 200768 | 2024-25 | 35 | 1.171 | 2.743 | 0.943 |

*These queries demonstrate the linkage between the player dimension table, their statistical season performance facts, and the drills recommended by the AI engine based on those statistics.*
