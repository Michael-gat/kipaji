/*const express = require('express');
const cors = require('cors');
const axios = require('axios'); // We added Axios to talk to Python!
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 1. Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kipaji backend is running' });
});

// 2. NEW PROXY ROUTE: Talk to Python AI Engine
app.get('/api/coach/evaluate/:playerName', async (req, res) => {
  try {
    const playerName = req.params.playerName;
    
    // Node.js reaches out to the Python server running on port 8000
    console.log(`Node.js asking Python to evaluate: ${playerName}`);
    const pythonResponse = await axios.get(`http://localhost:8000/api/evaluate/${playerName}`);
    
    // Send Python's exact JSON answer back to the React frontend
    res.json(pythonResponse.data);
    
  } catch (error) {
    console.error("Error communicating with AI Engine:", error.message);
    
    // If Python sends a 404 (Player Not Found), Node passes that 404 back cleanly
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Player not found in database." });
    }
    
    // Otherwise, it's a general server error
    res.status(500).json({ error: "AI Engine is currently unavailable." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Node.js Bridge Server running on http://localhost:${PORT}`);
});
*/

// new code beginnings
const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kipaji backend is running' });
});

// NEW: Fetch all players for the Roster table!
app.get('/api/coach/roster', async (req, res) => {
  try {
    const pythonResponse = await axios.get(`http://localhost:8000/players/search?q=&limit=100`);
    res.json({ players: pythonResponse.data });
  } catch (error) {
    console.error("Error fetching roster:", error.message);
    res.status(500).json({ error: "Could not load roster." });
  }
});

app.get('/api/coach/evaluate/:playerName', async (req, res) => {
  try {
    const playerName = req.params.playerName;
    console.log(`Node.js asking Python to evaluate: ${playerName}`);

    // First, search for the player ID
    const searchResponse = await axios.get(`http://localhost:8000/players/search?q=${playerName}`);
    const players = searchResponse.data;

    if (!players || players.length === 0) {
      return res.status(404).json({ error: "Player not found in database." });
    }

    const playerId = players[0].player_id;

    // Then fetch the analysis
    const pythonResponse = await axios.get(`http://localhost:8000/players/${playerId}/analysis`);

    // Transform new AI logic back to the format expected by the frontend
    const analysis = pythonResponse.data;

    // Determine primary weakness (most critical weakness)
    const weaknessKeys = Object.keys(analysis.weaknesses);
    let primaryWeakness = "None";
    let gapPercentage = 0;

    if (weaknessKeys.length > 0) {
       // Just pick the first weakness for this demo
       primaryWeakness = weaknessKeys[0];
       // Estimate gap from percentile (if percentile is 20, gap is 80%)
       gapPercentage = 100 - analysis.weaknesses[primaryWeakness].percentile;
    }

    const transformedResponse = {
        player_info: {
            name: analysis.full_name,
            position: analysis.position_group,
            current_ts: analysis.kpis.ts_pct || analysis.kpis.fg_pct // fallback if TS not directly there
        },
        ai_analysis: {
            primary_weakness: primaryWeakness,
            gap_percentage: gapPercentage
        },
        // We will just return the drills from the first recommendation for simplicity
        recommended_drills: analysis.recommendations.length > 0 ? analysis.recommendations[0].drills : []
    };

    res.json(transformedResponse);
  } catch (error) {
    console.error("Error communicating with AI Engine:", error.message);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Player not found in database." });
    }
    res.status(500).json({ error: "AI Engine is currently unavailable." });
  }
});

app.listen(PORT, () => {
  console.log(`Node.js Bridge Server running on http://localhost:${PORT}`);
});