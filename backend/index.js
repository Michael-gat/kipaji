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
    const pythonResponse = await axios.get(`http://localhost:8000/api/players`);
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("Error fetching roster:", error.message);
    res.status(500).json({ error: "Could not load roster." });
  }
});

app.get('/api/coach/evaluate/:playerName', async (req, res) => {
  try {
    const playerName = req.params.playerName;
    console.log(`Node.js asking Python to evaluate: ${playerName}`);
    const pythonResponse = await axios.get(`http://localhost:8000/api/evaluate/${playerName}`);
    res.json(pythonResponse.data);
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