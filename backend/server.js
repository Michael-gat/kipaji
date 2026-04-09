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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "kipaji",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Middleware for authentication
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kipaji backend is running' });
});

// ── Auth Endpoints ─────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role",
      [email, passwordHash, full_name]
    );
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, email, full_name, role, created_at FROM users WHERE id = $1", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Database (Player) Endpoints ─────────────────────────────────

app.get('/api/players', async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    let query = "SELECT p.player_id, p.full_name, t.primary_team_abbr as team_abbr, s.pts_avg as ts_pct FROM dim_players p LEFT JOIN player_team_seasons t ON p.player_id = t.player_id LEFT JOIN player_season_stats s ON p.player_id = s.player_id";
    const values = [];
    if (search) {
      query += " WHERE p.full_name ILIKE $1";
      values.push(`%${search}%`);
    }
    query += ` LIMIT $${values.length + 1}`;
    values.push(limit);

    const { rows } = await pool.query(query, values);

    // Map to frontend expectation (temporary logic)
    const players = rows.map(p => ({
        Name: p.full_name,
        Position: 'G', // Not directly in DB without ML mapping, mock for now
        TS_Pct: p.ts_pct ? (p.ts_pct / 20) : 0.5
    }));

    res.json({ players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ML Proxy Endpoints ────────────────────────────────────────

app.get('/api/ml/*', authMiddleware, async (req, res) => {
  try {
    // Forward path
    const targetPath = req.path.replace('/api/ml', '');
    const url = `${ML_API_URL}${targetPath}?${new URLSearchParams(req.query).toString()}`;

    const response = await axios.get(url, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    console.error("ML Proxy Error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "ML Service Unavailable" });
    }
  }
});


// ── Legacy UI Endpoints (Mocked for current Frontend) ────────

app.get('/api/coach/roster', async (req, res) => {
  try {
    // Generate mock token to bypass if needed, or rely on bypassed ML endpoint
    const token = jwt.sign({ user: 'test' }, process.env.JWT_SECRET || 'secret');
    const response = await axios.get(`${ML_API_URL}/players/search?q=&limit=100`, {
       headers: { Authorization: `Bearer ${token}` }
    });
    res.json({ players: response.data });
  } catch (error) {
    console.error("Error fetching roster:", error.message);
    res.status(500).json({ error: "Could not load roster." });
  }
});

app.get('/api/coach/evaluate/:playerName', async (req, res) => {
  try {
    const playerName = req.params.playerName;
    const token = jwt.sign({ user: 'test' }, process.env.JWT_SECRET || 'secret');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const searchResponse = await axios.get(`${ML_API_URL}/players/search?q=${playerName}`, authHeaders);
    const players = searchResponse.data;

    if (!players || players.length === 0) {
      return res.status(404).json({ error: "Player not found in database." });
    }

    const playerId = players[0].player_id;
    const pythonResponse = await axios.get(`${ML_API_URL}/players/${playerId}/analysis`, authHeaders);
    const analysis = pythonResponse.data;

    const weaknessKeys = Object.keys(analysis.weaknesses);
    let primaryWeakness = "None";
    let gapPercentage = 0;

    if (weaknessKeys.length > 0) {
       primaryWeakness = weaknessKeys[0];
       gapPercentage = 100 - analysis.weaknesses[primaryWeakness].percentile;
    }

    const transformedResponse = {
        player_info: {
            name: analysis.full_name,
            position: analysis.position_group,
            current_ts: analysis.kpis.ts_pct || analysis.kpis.fg_pct
        },
        ai_analysis: {
            primary_weakness: primaryWeakness,
            gap_percentage: gapPercentage
        },
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
  console.log(`Node.js Bridge Server running on port ${PORT}`);
});