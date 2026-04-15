# PROJECT DOCUMENTATION: KIPAJI AI

## CHAPTER ONE

**1.1 Introduction**
The Kipaji AI project is an advanced sports analytics platform designed to evaluate basketball players' performance using machine learning. By analyzing vast amounts of game data and player season stats, Kipaji AI provides objective, data-driven insights to coaches and players, aiming to revolutionize talent identification and skill development.

**1.2 Background Information**
Traditional sports coaching often relies on subjective evaluations and manual observation. With the increasing availability of granular sports data, there is a growing opportunity to apply artificial intelligence to identify player strengths, weaknesses, and potential. The Kipaji AI platform integrates a robust PostgreSQL data warehouse, a Python-based FastAPI machine learning engine, a Node.js middleware bridge, and a React frontend to deliver actionable insights in real time.

**1.3 Emerging issues**
- The sheer volume of sports data makes it difficult for coaches to manually extract meaningful insights quickly.
- Subjectivity in player evaluation can lead to overlooked talent or inefficient training focuses.
- There is a lack of integrated tools that directly link statistical weaknesses to specific, targeted training recommendations.

**1.4 Problem Statement**
While data is abundant in modern sports, coaches and trainers often lack accessible tools to translate complex statistics into targeted training plans. Existing solutions typically provide raw data dashboards but fail to synthesize this data into actionable, personalized drill recommendations. This gap leaves players with generic training regimens rather than data-driven, individualized improvement plans. Kipaji AI solves this by deploying a machine learning model that analyzes key performance indicators (KPIs) to identify critical weaknesses and automatically recommends tailored training drills, enhancing player development efficiency.

**1.5 Main Objective**
To develop an AI-driven sports analytics platform that evaluates player performance and generates targeted training recommendations based on statistical analysis.

**1.6 Specific Objectives**
1. To develop a robust machine learning model capable of analyzing player KPIs to identify precise strengths and weaknesses.
2. To integrate a PostgreSQL data warehouse to securely store and manage comprehensive player statistics, game facts, and drill repositories.
3. To facilitate seamless communication and data transformation between a frontend user interface and the Python ML engine via a Node.js backend proxy.
4. To streamline the coaching process by automatically mapping identified player weaknesses to specific, actionable training drills.

**1.8 Justification**
The integration of AI into sports training offers a significant competitive advantage. Kipaji AI justifies its implementation by transforming raw, unstructured game data into direct, personalized coaching actions. This system saves coaches time, reduces human bias in player evaluation, and provides athletes with clear, data-backed pathways to improve their specific weaknesses, ultimately elevating the standard of training and overall performance.

---

## CHAPTER TWO

**2.1 Literature Review**
Globally, systems like Synergy Sports and Hudl dominate the sports analytics space, providing extensive video analysis and statistical breakdowns for elite teams. In Africa and Kenya specifically, the adoption of advanced AI analytics in grassroots and professional sports is still emerging, often limited by resource constraints and a reliance on traditional coaching methods.

Existing systems are excellent at aggregating data, but they often require coaches to manually interpret the statistics to formulate training plans. The demerit of these systems is the high cognitive load placed on the coaching staff.

The unique solution Kipaji AI implements is its closed-loop recommendation engine. Unlike platforms that only highlight a player's low field-goal percentage, Kipaji AI automatically cross-references this statistical weakness with a relational database of drills and outputs actionable solutions (e.g., specific finishing drills like the Mikan Drill). This enhances better service delivery and efficiency by immediately bridging the gap between identifying a problem and providing a targeted coaching solution.

---

## CHAPTER THREE

**3.0 Methodology**
The development of Kipaji AI followed an Agile methodology, allowing for iterative testing and refinement of the machine learning models and user interfaces.

**Resources & Technology Stack:**
- **Database:** PostgreSQL was utilized to build a relational data warehouse, structuring complex schemas (`dim_players`, `fact_player_games`, `player_season_stats`, and `drills`).
- **AI Engine:** Python, utilizing FastAPI and data analysis libraries, was used to build the `KipajiModel` for player analysis, KPI benchmarking, and peer comparison.
- **Backend Middleware:** A Node.js (Express) server acts as a bridge, handling CORS and API routing between the frontend and the AI engine, ensuring secure and transformed data delivery.
- **Frontend:** React (bootstrapped with Create React App) was used to build a dynamic, user-friendly dashboard for coaches.

**Process Requirements:**
1. **Data Ingestion:** Processing historical CSV data into the PostgreSQL warehouse to establish a baseline of player statistics.
2. **Model Training & Logic:** The AI engine accesses the database to calculate KPIs, determine percentiles, and identify a player's primary weaknesses based on statistical gaps.
3. **API Integration:** Establishing RESTful endpoints (e.g., `/api/coach/evaluate/:playerName`) in Node.js that request analysis from the Python service, format the response, and serve it to the frontend.
4. **UI Design:** Creating intuitive interfaces for coaches to search the roster, view AI-generated analysis, and immediately access recommended drills to address player gaps.

---

## CHAPTER FIVE

**5.0 Coding**
The coding phase involved a full-stack implementation:
- **Database (SQL):** Engineered complex schemas and relationships mapping dimension tables (players, teams) to fact tables (game logs, season stats) and a proprietary training drills table.
- **AI Service (Python/FastAPI):** Implemented the `KipajiModel` logic to ingest data, calculate statistical gaps (e.g., converting percentiles into gap percentages), and map identified weaknesses to the drills table.
- **Backend Proxy (Node.js/Express):** Developed endpoints utilizing Axios to fetch data from the Python service. The Node server transforms complex ML outputs into a streamlined JSON format (extracting primary weakness, gap percentage, and specific drills) expected by the frontend.
- **Frontend (React):** Authored reusable components to visualize player KPIs, strengths, weaknesses, and dynamically list the recommended drills returned by the backend bridge.

---

## CHAPTER SIX

**6.0 Conclusions**
Kipaji AI successfully demonstrates the potential of integrating machine learning with sports data to create actionable coaching tools. By automating the identification of player weaknesses and directly recommending relevant drills, the system bridges the gap between raw statistics and practical on-court improvement. The multi-tiered architecture (React, Node, Python, Postgres) proved effective, scalable, and capable of delivering fast, data-driven insights.

**6.2 Recommendation**
For future iterations and to enhance service delivery further, it is recommended to:
1. Integrate real-time game data APIs to automatically update player statistics, removing the reliance on manual CSV data uploads.
2. Expand the drill repository and introduce multimedia elements, such as video demonstrations, for each recommended drill.
3. Incorporate advanced player tracking data (e.g., spatial coordinates on the court) to provide deeper, context-aware analysis of defensive and offensive movements.
4. Implement a feedback loop system where coaches can rate the effectiveness of the recommended drills, allowing the AI model to learn and optimize future recommendations automatically.