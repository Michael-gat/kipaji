import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // API State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  
  // Roster State (Now fetched from Python!)
  const [rosterData, setRosterData] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Mock Team Data for the Dashboard (Red/Green Theme)
  const teamPerformanceData = [
    { month: 'Oct', Offense: 85, Defense: 70 },
    { month: 'Nov', Offense: 90, Defense: 75 },
    { month: 'Dec', Offense: 88, Defense: 85 },
    { month: 'Jan', Offense: 95, Defense: 82 },
    { month: 'Feb', Offense: 102, Defense: 90 },
    { month: 'Mar', Offense: 105, Defense: 95 },
  ];

  const teamRadarData = [
    { subject: 'Shooting', A: 85, B: 65, fullMark: 100 },
    { subject: 'Playmaking', A: 70, B: 75, fullMark: 100 },
    { subject: 'Rebounding', A: 90, B: 60, fullMark: 100 },
    { subject: 'Defense', A: 80, B: 70, fullMark: 100 },
    { subject: 'Conditioning', A: 95, B: 80, fullMark: 100 },
  ];

  // Trigger AI Evaluation
  const runAIEvaluation = async (playerNameOverride = null) => {
    const targetName = playerNameOverride || searchQuery;
    if (!targetName.trim()) {
      setError("Please enter a player name.");
      return;
    }
    
    setSearchQuery(targetName);
    setLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      const response = await fetch(`http://localhost:5000/api/coach/evaluate/${encodeURIComponent(targetName)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch evaluation.");
      
      // Dynamic Radar Chart Data based on Python's gap analysis
      const chartData = [
        { subject: 'Shooting (TS%)', A: Math.round(data.player_info.current_ts * 100), B: Math.round(data.player_info.current_ts * 100) + (data.ai_analysis.primary_weakness.includes('TS') ? data.ai_analysis.gap_percentage : 0), fullMark: 100 },
        { subject: 'Playmaking (AST)', A: 75, B: data.ai_analysis.primary_weakness === 'AST' ? 90 : 70, fullMark: 100 },
        { subject: 'Rebounding (TRB)', A: 60, B: data.ai_analysis.primary_weakness === 'TRB' ? 80 : 55, fullMark: 100 },
        { subject: 'Ball Security (TOV)', A: 80, B: data.ai_analysis.primary_weakness === 'TOV' ? 60 : 75, fullMark: 100 },
        { subject: 'Efficiency (FG%)', A: 65, B: data.ai_analysis.primary_weakness === 'FG_Pct' ? 85 : 60, fullMark: 100 },
      ];
      
      setEvaluation({ ...data, chartData });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Full Roster from Python API!
  const loadRoster = async () => {
    setActiveTab('roster');
    if (rosterData.length > 0) return; // Don't fetch if we already have it
    
    setRosterLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/coach/roster`);
      const data = await response.json();
      setRosterData(data.players || []);
    } catch (err) {
      console.error("Failed to load roster", err);
    } finally {
      setRosterLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1120] font-sans text-slate-300 overflow-hidden selection:bg-red-600/30 selection:text-white">
      
      {/* SIDEBAR (Dark Premium Theme) */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800/50 flex flex-col z-20 shadow-2xl flex-shrink-0">
        <div className="p-8 border-b border-slate-800/50">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <div>
              <span className="text-[#dc2626]">KI</span>
              <span className="text-[#16a34a]">PA</span>
              <span className="text-white">JI</span>
            </div>
          </h1>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.3em] font-bold">Elite Coaching</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-[#1f2937] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Team Overview
          </button>
          <button onClick={() => setActiveTab('players')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'players' ? 'bg-[#1f2937] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Player Evaluation
          </button>
          <button onClick={loadRoster} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'roster' ? 'bg-[#1f2937] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Live Roster
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-[#111827]/80 backdrop-blur-md border-b border-slate-800/50 px-10 py-6 flex justify-between items-center z-10 sticky top-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'dashboard' && 'Team Analytics'}
              {activeTab === 'players' && 'AI Scouting Report'}
              {activeTab === 'roster' && 'Database Explorer'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Kipaji Engine v1.0.4</p>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-[#1f2937] border border-slate-700/50 rounded-full shadow-inner">
             <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse shadow-[0_0_10px_rgba(22,163,74,0.8)]"></div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Server Connected</span>
          </div>
        </header>

        <div className="p-8 xl:p-10 w-full max-w-[1600px] mx-auto">
          
          {/* =========================================
              TAB 1: TEAM OVERVIEW (REDESIGNED)
             ========================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in w-full">
              
              {/* TOP STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-6 flex flex-col justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Team True Shooting</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-4xl font-black text-white">54.2<span className="text-xl text-slate-500">%</span></h3>
                    <span className="text-sm font-bold text-[#16a34a] bg-green-900/30 px-2 py-1 rounded-md flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                      1.2%
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-6 flex flex-col justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active AI Weaknesses</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-4xl font-black text-white">14</h3>
                    <span className="text-sm font-bold text-[#dc2626] bg-red-900/30 px-2 py-1 rounded-md">High Alert</span>
                  </div>
                </div>

                <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-6 flex flex-col justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Drills Assigned</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-4xl font-black text-white">28</h3>
                    <span className="text-sm font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-md">This Week</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#16a34a]/20 to-[#1f2937] rounded-2xl border border-[#16a34a]/30 p-6 flex flex-col justify-between">
                  <p className="text-xs font-bold text-[#16a34a] uppercase tracking-widest mb-4">Win Probability</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-4xl font-black text-white">68<span className="text-xl text-[#16a34a]">%</span></h3>
                    <svg className="w-8 h-8 text-[#16a34a] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                </div>
              </div>

              {/* WIDE CHARTS ROW */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* LARGE PERFORMANCE CHART */}
                <div className="xl:col-span-2 bg-[#1f2937] rounded-2xl border border-slate-700/50 p-6 h-96 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-white tracking-wide">Season Performance Trajectory</h3>
                    <div className="flex gap-4">
                      <span className="flex items-center text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-[#16a34a] mr-2"></div>Offense Rating</span>
                      <span className="flex items-center text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-[#dc2626] mr-2"></div>Defense Rating</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={teamPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOffense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDefense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#475569" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc'}} itemStyle={{color: '#f8fafc'}}/>
                        <Area type="monotone" dataKey="Offense" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorOffense)" />
                        <Area type="monotone" dataKey="Defense" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorDefense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* TEAM RADAR CHART */}
                <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-6 h-96 flex flex-col">
                  <h3 className="text-base font-bold text-white tracking-wide mb-2">Team vs League Average</h3>
                  <div className="flex-1 w-full min-h-0 -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={teamRadarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="My Team" dataKey="A" stroke="#16a34a" strokeWidth={2} fill="#16a34a" fillOpacity={0.4} />
                        <Radar name="League Avg" dataKey="B" stroke="#64748b" strokeWidth={2} fill="#64748b" fillOpacity={0.2} />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB 2: PLAYER EVALUATION (REDESIGNED)
             ========================================= */}
          {activeTab === 'players' && (
            <div className="w-full space-y-6 animate-fade-in">
              
              {/* Search Bar - Full Width */}
              <div className="bg-[#1f2937] rounded-2xl shadow-lg border border-slate-700/50 p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                  <span className="w-2 h-6 bg-[#dc2626] rounded-full"></span>
                  Execute Scouting Report
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                       <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && runAIEvaluation()}
                      placeholder="Search player database (e.g., 'James Smith')" 
                      className="w-full pl-14 pr-4 py-4 bg-[#0f172a] border border-slate-700/80 rounded-xl text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] transition-all placeholder-slate-600 shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={() => runAIEvaluation()}
                    disabled={loading}
                    className="bg-[#dc2626] text-white px-10 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  >
                    {loading ? "Analyzing..." : "Analyze Player"}
                  </button>
                </div>
                {error && <div className="mt-5 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{error}</div>}
              </div>

              {/* DYNAMIC REPORT - TWO COLUMN WIDE LAYOUT */}
              {evaluation && !loading && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up items-start">
                  
                  {/* LEFT COLUMN: Player Identity & Chart */}
                  <div className="xl:col-span-1 flex flex-col gap-6">
                    
                    {/* Player Profile Card */}
                    <div className="bg-gradient-to-b from-[#1f2937] to-[#0f172a] rounded-2xl border border-slate-700/50 p-8 flex flex-col items-center text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc2626] via-[#16a34a] to-black"></div>
                      
                      <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-5xl shadow-2xl border-4 border-[#1f2937] mb-6">
                        {evaluation.player_info.name.charAt(0)}
                      </div>
                      
                      <h2 className="text-3xl font-black text-white tracking-tight mb-1">{evaluation.player_info.name}</h2>
                      <p className="text-[#16a34a] font-bold tracking-widest uppercase text-sm mb-6 flex items-center justify-center gap-2">
                        <span className="px-2 py-0.5 bg-green-900/30 rounded border border-green-500/20">{evaluation.player_info.position}</span>
                      </p>

                      <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-6">
                        <div className="bg-[#111827] rounded-xl p-3 border border-slate-700/30">
                           <p className="text-xs text-slate-500 font-bold uppercase mb-1">True Shooting</p>
                           <p className="text-2xl font-black text-white">{evaluation.player_info.current_ts}</p>
                        </div>
                        <div className="bg-[#111827] rounded-xl p-3 border border-slate-700/30">
                           <p className="text-xs text-slate-500 font-bold uppercase mb-1">Status</p>
                           <p className="text-sm font-black text-[#dc2626] mt-2">NEEDS DRILLS</p>
                        </div>
                      </div>
                    </div>

                    {/* Radar Chart Card */}
                    <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-6 h-80 flex flex-col">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Metrics vs Positional Avg</h4>
                       <div className="flex-1 w-full min-h-0 -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={evaluation.chartData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 10}} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Player" dataKey="A" stroke="#dc2626" strokeWidth={2} fill="#dc2626" fillOpacity={0.4} />
                            <Radar name="Pos. Avg" dataKey="B" stroke="#64748b" strokeWidth={1} fill="#64748b" fillOpacity={0.1} />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}}/>
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: AI Analysis & Drills */}
                  <div className="xl:col-span-2 flex flex-col gap-6">
                    
                    {/* The AI Diagnosis */}
                    <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-[#dc2626]/10 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
                      
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Engine Diagnosis
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-full sm:w-1/3 text-center sm:text-left border-b sm:border-b-0 sm:border-r border-slate-700/50 pb-6 sm:pb-0 sm:pr-6">
                          <p className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-2">Identified Flaw</p>
                          <p className="text-3xl font-black text-white">{evaluation.ai_analysis.primary_weakness}</p>
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-slate-300">Performance Gap</span>
                            <span className="text-lg font-black text-[#dc2626]">{evaluation.ai_analysis.gap_percentage}% Below</span>
                          </div>
                          <div className="w-full bg-[#0f172a] rounded-full h-3 overflow-hidden shadow-inner">
                            <div className="bg-gradient-to-r from-[#dc2626] to-red-400 h-full rounded-full relative" style={{ width: `${Math.min(100, 100 - evaluation.ai_analysis.gap_percentage)}%` }}></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed">
                            The AI model has detected a severe statistical deviation from the acceptable baseline for a college-level {evaluation.player_info.position}. Immediate drill intervention is recommended.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prescribed Drills List */}
                    <div className="bg-[#1f2937] rounded-2xl border border-slate-700/50 p-8 flex-1">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Prescribed Training Regimen</h4>
                      
                      {evaluation.recommended_drills.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {evaluation.recommended_drills.map((drill, idx) => (
                            <div key={idx} className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6 hover:border-[#16a34a]/50 transition-all group flex flex-col h-full">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="font-bold text-white text-lg leading-tight pr-2">{drill.Drill_Name}</h5>
                                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-700 flex-shrink-0">{drill.Difficulty_Level}</span>
                              </div>
                              <p className="text-[#16a34a] text-xs font-bold uppercase tracking-wider mb-3">Target: {drill.Improves_Skill}</p>
                              <p className="text-slate-400 text-sm leading-relaxed flex-1">{drill.Description}</p>
                              <button className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">Assign to Schedule</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 bg-[#0f172a] border border-slate-800 rounded-xl text-center">
                          <p className="text-slate-500 font-medium">No specific drills found for this metric.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FULL ROSTER TABLE (NOW CONNECTED TO PYTHON) */}
          {activeTab === 'roster' && (
            <div className="bg-[#1f2937] rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden animate-fade-in w-full">
              <div className="p-6 md:p-8 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827]">
                <div>
                  <h3 className="text-xl font-bold text-white">Database Explorer</h3>
                  <p className="text-sm text-slate-500 mt-1">Live data from Python generation engine</p>
                </div>
                <button className="text-sm font-bold text-white bg-[#16a34a] hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-900/20">
                  Export Data
                </button>
              </div>
              
              {rosterLoading ? (
                <div className="p-32 text-center flex flex-col items-center justify-center">
                  <svg className="animate-spin h-10 w-10 text-[#dc2626] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="text-slate-400 font-bold uppercase tracking-widest">Querying Python Database...</p>
                </div>
              ) : rosterData.length === 0 ? (
                <div className="p-20 text-center text-red-400 font-medium">Failed to connect to Python backend. Ensure servers are running.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-widest border-b border-slate-700/50">
                        <th className="p-5 font-bold">Player Identity</th>
                        <th className="p-5 font-bold text-center">Pos</th>
                        <th className="p-5 font-bold text-center">Efficiency (TS%)</th>
                        <th className="p-5 font-bold text-right">Action Engine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                      {/* We only render the first 15 for UI performance in this prototype, but you can remove .slice(0,15) to see all 100! */}
                      {rosterData.slice(0, 15).map((player, idx) => (
                        <tr key={idx} className="hover:bg-[#111827] transition-colors">
                          <td className="p-5 font-bold text-white flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-black text-sm border border-slate-700 shadow-inner">
                              {player.Name.charAt(0)}
                            </div>
                            {player.Name}
                          </td>
                          <td className="p-5 text-center">
                            <span className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-black text-[10px] uppercase border border-slate-700">
                              {player.Position}
                            </span>
                          </td>
                          <td className="p-5 text-center">
                             <span className="font-black text-lg text-[#16a34a]">{(player.TS_Pct * 100).toFixed(1)}%</span>
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => runAIEvaluation(player.Name)}
                              className="text-white bg-[#dc2626] hover:bg-red-700 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20"
                            >
                              Scan Player
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rosterData.length > 15 && (
                    <div className="p-4 bg-[#0f172a] text-center border-t border-slate-700/50">
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Showing 15 of {rosterData.length} records</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;