import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg:        "#0d0f0e",
  surface:   "#141816",
  card:      "#181c1a",
  border:    "#252b27",
  borderHi:  "#2e3830",
  red:       "#D10000",
  redDim:    "#7a0000",
  redGlow:   "rgba(209,0,0,0.15)",
  green:     "#00882B",
  greenBr:   "#00C13A",
  greenDim:  "#004015",
  greenGlow: "rgba(0,136,43,0.18)",
  white:     "#F0F0F0",
  muted:     "#8a9490",
  mutedLo:   "#4a534e",
  text:      "#e8edea",
};

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

const gs = document.createElement("style");
gs.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: ${COLORS.bg}; color: ${COLORS.text}; }
  body { font-family: 'Outfit', sans-serif; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${COLORS.surface}; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes scan   { 0%{transform:translateY(-200%)} 100%{transform:translateY(400%)} }
  .fu  { animation: fadeUp 0.4s ease both; }
  .fu1 { animation: fadeUp 0.4s 0.05s ease both; }
  .fu2 { animation: fadeUp 0.4s 0.10s ease both; }
  .fu3 { animation: fadeUp 0.4s 0.15s ease both; }
  .fu4 { animation: fadeUp 0.4s 0.20s ease both; }
  .fu5 { animation: fadeUp 0.4s 0.25s ease both; }
  @media (max-width: 768px) {
    .main-content { margin-left: 0 !important; }
    .ham-btn { display: flex !important; }
    .sidebar { transform: translateX(-100%) !important; }
    .sidebar.open { transform: translateX(0) !important; box-shadow: 8px 0 32px rgba(0,0,0,0.6) !important; }
    .charts-row { grid-template-columns: 1fr !important; }
    .scout-grid { grid-template-columns: 1fr !important; }
    .stat-grid4 { grid-template-columns: repeat(2,1fr) !important; }
    .roster-table { overflow-x: auto; }
  }
`;
document.head.appendChild(gs);

const PLAYERS = [
  { id:201939, name:"Stephen Curry",    pos:"PG", team:"GSW", ts:64.8, fg:0.453, fg3:0.427, ft:0.923, ast:6.1, reb:4.4, stl:1.2, blk:0.3, tov:2.8, pf:1.9, pts:26.4, games:70,  posGroup:"G",    status:"elite" },
  { id:2544,   name:"LeBron James",     pos:"SF", team:"LAL", ts:62.3, fg:0.511, fg3:0.349, ft:0.751, ast:8.2, reb:7.8, stl:1.0, blk:0.6, tov:3.7, pf:1.4, pts:24.4, games:70,  posGroup:"G",    status:"strong" },
  { id:203507, name:"Giannis A.",        pos:"PF", team:"MIL", ts:61.5, fg:0.612, fg3:0.274, ft:0.657, ast:6.5, reb:11.4,stl:1.2, blk:1.1, tov:3.2, pf:3.1, pts:30.4, games:73,  posGroup:"C/PF", status:"strong" },
  { id:203954, name:"Joel Embiid",       pos:"C",  team:"PHI", ts:61.1, fg:0.425, fg3:0.332, ft:0.839, ast:4.5, reb:8.2, stl:0.7, blk:1.1, tov:3.3, pf:2.8, pts:22.0, games:19,  posGroup:"C/PF", status:"needs-drills" },
  { id:1629029,name:"Shai Gilgeous-A",   pos:"SG", team:"OKC", ts:68.4, fg:0.535, fg3:0.377, ft:0.888, ast:6.4, reb:5.5, stl:2.0, blk:0.9, tov:2.4, pf:1.8, pts:32.7, games:75,  posGroup:"G",    status:"elite" },
  { id:1628369,name:"Jayson Tatum",      pos:"SF", team:"BOS", ts:60.2, fg:0.472, fg3:0.374, ft:0.832, ast:4.6, reb:8.3, stl:1.0, blk:0.5, tov:2.9, pf:2.3, pts:26.9, games:74,  posGroup:"G/F",  status:"strong" },
  { id:203076, name:"Anthony Davis",     pos:"C",  team:"LAL", ts:65.0, fg:0.558, fg3:0.275, ft:0.794, ast:3.5, reb:12.6,stl:1.3, blk:2.4, tov:2.1, pf:2.0, pts:24.7, games:76,  posGroup:"C/PF", status:"elite" },
  { id:1628378,name:"Donovan Mitchell",  pos:"SG", team:"CLE", ts:58.8, fg:0.469, fg3:0.382, ft:0.845, ast:6.1, reb:4.3, stl:1.5, blk:0.4, tov:2.6, pf:2.5, pts:26.6, games:55,  posGroup:"G",    status:"strong" },
];

const TRAJECTORY = [
  {month:"Oct",off:82,def:68},{month:"Nov",off:85,def:71},{month:"Dec",off:87,def:74},
  {month:"Jan",off:89,def:76},{month:"Feb",off:92,def:80},{month:"Mar",off:96,def:85},
];

const DRILLS = {
  tov: [{id:"D003",name:"2-Ball Dribbling",        skill:"Ball Handling, Vision",        diff:"Intermediate"},
        {id:"D028",name:"Passing Out of Doubles",   skill:"Decision Making",              diff:"Advanced"},
        {id:"D024",name:"Full-Court Pressure Drib.",skill:"Ball Handling Under Pressure", diff:"Advanced"}],
  fg:  [{id:"D002",name:"Form Shooting Series",     skill:"Shooting Mechanics",           diff:"Beginner"},
        {id:"D020",name:"Pull-Up Jumper Series",    skill:"Mid-Range, Pull-Up",           diff:"Intermediate"},
        {id:"D034",name:"One-Dribble Pull-Up",      skill:"Ball Handling, Shooting",      diff:"Intermediate"}],
  fg3: [{id:"D005",name:"Spot-Up Shooting 5 Spots", skill:"Catch and Shoot",              diff:"Intermediate"},
        {id:"D030",name:"Corner 3 Shooting Series", skill:"Catch-and-Shoot 3PT",         diff:"Intermediate"},
        {id:"D016",name:"Transition Shooting",      skill:"Speed, Conditioning",          diff:"Advanced"}],
  reb: [{id:"D004",name:"Superman Rebounding",      skill:"Rebounding, Conditioning",     diff:"Intermediate"},
        {id:"D012",name:"Box Out & Secure Drill",   skill:"Rebounding, Physicality",     diff:"Intermediate"},
        {id:"D026",name:"Tipping Drills",           skill:"Offensive Rebounding",         diff:"Intermediate"}],
  def: [{id:"D011",name:"Defensive Slide Drill",    skill:"Defensive Footwork",           diff:"Beginner"},
        {id:"D017",name:"Shell Drill",              skill:"Team Defense & Help",          diff:"Advanced"},
        {id:"D033",name:"Pick & Roll Coverage",     skill:"Pick and Roll Defense",        diff:"Advanced"}],
};

// ── Radar ──────────────────────────────────────────────────────────
function RadarChart({data, size=200, color=COLORS.green, showComp=false}) {
  const cx=size/2, cy=size/2, r=size*0.36, n=data.length;
  const ang = i => (Math.PI*2*i)/n - Math.PI/2;
  const pt  = (v,i) => ({ x: cx+r*v*Math.cos(ang(i)), y: cy+r*v*Math.sin(ang(i)) });
  const poly = f => Array.from({length:n},(_,i)=>pt(f,i)).map(p=>`${p.x},${p.y}`).join(" ");
  const pPts = data.map((d,i)=>pt(Math.min(1,Math.max(0,d.value)),i));
  const aPts = data.map((d,i)=>pt(Math.min(1,Math.max(0,d.avg??0.5)),i));
  const pathD = pts => pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";
  const gid = `rg${color.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.03"/>
        </radialGradient>
      </defs>
      {[0.25,0.5,0.75,1].map(f=>(
        <polygon key={f} points={poly(f)} fill="none" stroke={COLORS.border} strokeWidth="0.7"/>
      ))}
      {Array.from({length:n},(_,i)=>{const p=pt(1,i);return(
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS.border} strokeWidth="0.7"/>
      )})}
      {showComp && (
        <polygon points={aPts.map(p=>`${p.x},${p.y}`).join(" ")}
          fill={`${COLORS.red}18`} stroke={COLORS.red} strokeWidth="1" strokeDasharray="3,3"/>
      )}
      <polygon points={pPts.map(p=>`${p.x},${p.y}`).join(" ")}
        fill={`url(#${gid})`} stroke={color} strokeWidth="1.6"/>
      {pPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color}/>)}
      {data.map((d,i)=>{
        const a=ang(i), lx=cx+(r+18)*Math.cos(a), ly=cy+(r+18)*Math.sin(a);
        return(
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontFamily="'DM Mono',monospace" fill={COLORS.muted} letterSpacing="0.5">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Area Chart ─────────────────────────────────────────────────────
function AreaChart({data, height=190}) {
  const [w, setW] = useState(560);
  const ref = useRef();
  useEffect(()=>{
    const ro = new ResizeObserver(e=>setW(e[0].contentRect.width));
    if(ref.current) ro.observe(ref.current);
    return ()=>ro.disconnect();
  },[]);
  const pad={l:34,r:10,t:10,b:28};
  const W=w-pad.l-pad.r, H=height-pad.t-pad.b;
  const all=data.flatMap(d=>[d.off,d.def]);
  const mn=Math.min(...all)-5, mx=Math.max(...all)+5;
  const xOf = i => pad.l+(i/(data.length-1))*W;
  const yOf = v => pad.t+H-((v-mn)/(mx-mn))*H;
  const line = k => data.map((d,i)=>`${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(d[k]).toFixed(1)}`).join(" ");
  const area = k => line(k)+` L${xOf(data.length-1).toFixed(1)},${(pad.t+H).toFixed(1)} L${pad.l.toFixed(1)},${(pad.t+H).toFixed(1)} Z`;
  const ticks=[60,75,90,105,120].filter(v=>v>=mn&&v<=mx);
  return (
    <div ref={ref} style={{width:"100%"}}>
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="offGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={COLORS.green}  stopOpacity="0.45"/>
            <stop offset="100%" stopColor={COLORS.green}  stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={COLORS.red}    stopOpacity="0.4"/>
            <stop offset="100%" stopColor={COLORS.red}    stopOpacity="0"/>
          </linearGradient>
        </defs>
        {ticks.map(v=>(
          <g key={v}>
            <line x1={pad.l} y1={yOf(v)} x2={pad.l+W} y2={yOf(v)}
              stroke={COLORS.border} strokeWidth="0.7" strokeDasharray="4,4"/>
            <text x={pad.l-5} y={yOf(v)} textAnchor="end" dominantBaseline="middle"
              fontSize="9" fontFamily="'DM Mono',monospace" fill={COLORS.mutedLo}>{v}</text>
          </g>
        ))}
        {data.map((d,i)=>(
          <text key={i} x={xOf(i)} y={pad.t+H+16} textAnchor="middle"
            fontSize="9" fontFamily="'DM Mono',monospace" fill={COLORS.mutedLo}>{d.month}</text>
        ))}
        <path d={area("off")} fill="url(#offGrad)"/>
        <path d={area("def")} fill="url(#defGrad)"/>
        <path d={line("off")} fill="none" stroke={COLORS.greenBr} strokeWidth="2" strokeLinecap="round"/>
        <path d={line("def")} fill="none" stroke={COLORS.red}     strokeWidth="2" strokeLinecap="round"/>
        {data.map((d,i)=>(
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(d.off)} r="3" fill={COLORS.greenBr}/>
            <circle cx={xOf(i)} cy={yOf(d.def)} r="3" fill={COLORS.red}/>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({label, value, sub, accent, trend, cls=""}) {
  const ac = accent==="green"?COLORS.greenBr : accent==="red"?COLORS.red : COLORS.white;
  return (
    <div className={cls} style={{
      background:COLORS.card, border:`1px solid ${COLORS.border}`,
      borderRadius:12, padding:"20px 22px", position:"relative", overflow:"hidden",
      transition:"border-color 0.18s",
    }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=COLORS.borderHi}
      onMouseLeave={e=>e.currentTarget.style.borderColor=COLORS.border}
    >
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,${ac}66,transparent)`}}/>
      <p style={{fontSize:10,letterSpacing:"0.12em",color:COLORS.muted,
        fontFamily:"'DM Mono',monospace",textTransform:"uppercase",marginBottom:10}}>{label}</p>
      <div style={{display:"flex",alignItems:"baseline",gap:10}}>
        <span style={{fontSize:32,fontWeight:700,fontFamily:"'Syne',sans-serif",
          color:COLORS.text,lineHeight:1}}>{value}</span>
        {trend&&<span style={{fontSize:12,color:trend.startsWith("+")? COLORS.greenBr:COLORS.red,
          fontFamily:"'DM Mono',monospace"}}>{trend}</span>}
      </div>
      {sub&&<p style={{fontSize:11,color:COLORS.mutedLo,marginTop:6,
        fontFamily:"'DM Mono',monospace"}}>{sub}</p>}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────
function Sidebar({active, setActive, open, setOpen}) {
  const items=[
    {id:"overview",  icon:"⬡", label:"Team Overview"},
    {id:"evaluation",icon:"◈", label:"Player Evaluation"},
    {id:"roster",    icon:"◧", label:"Live Roster"},
  ];
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{
        position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:99,
      }}/>}
      <nav className={`sidebar${open?" open":""}`} style={{
        width:210,minHeight:"100vh",background:COLORS.surface,
        borderRight:`1px solid ${COLORS.border}`,
        display:"flex",flexDirection:"column",padding:"0 0 24px",
        position:"fixed",top:0,left:0,bottom:0,zIndex:100,
        transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Logo */}
        <div style={{padding:"24px 20px 20px",borderBottom:`1px solid ${COLORS.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:7,overflow:"hidden",
              display:"flex",flexDirection:"column",border:`1px solid ${COLORS.border}`,flexShrink:0}}>
              <div style={{flex:1,background:"#111"}}/>
              <div style={{flex:1,background:COLORS.red}}/>
              <div style={{flex:1,background:COLORS.green}}/>
            </div>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,
                letterSpacing:"0.06em",color:COLORS.text}}>
                KIP<span style={{color:COLORS.red}}>A</span>JI
              </div>
              <div style={{fontSize:9,letterSpacing:"0.18em",color:COLORS.mutedLo,
                fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>Elite Coaching</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <div style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:3}}>
          {items.map(item=>{
            const ia=active===item.id;
            return(
              <button key={item.id} onClick={()=>{setActive(item.id);setOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:11,padding:"10px 13px",
                  borderRadius:8,background:ia?`${COLORS.green}18`:"transparent",
                  border:`1px solid ${ia?COLORS.green+"44":"transparent"}`,
                  color:ia?COLORS.greenBr:COLORS.muted,cursor:"pointer",textAlign:"left",
                  width:"100%",transition:"all 0.15s",fontSize:13.5,
                  fontFamily:"'Outfit',sans-serif",fontWeight:ia?500:400}}>
                <span style={{fontSize:15,opacity:0.85}}>{item.icon}</span>
                {item.label}
                {ia&&<div style={{marginLeft:"auto",width:5,height:5,borderRadius:"50%",
                  background:COLORS.greenBr}}/>}
              </button>
            );
          })}
        </div>
        <div style={{padding:"0 18px"}}>
          <div style={{background:COLORS.bg,border:`1px solid ${COLORS.border}`,
            borderRadius:8,padding:"8px 12px"}}>
            <p style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
              letterSpacing:"0.08em"}}>KIPAJI ENGINE v1.0.4</p>
            <p style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:COLORS.greenBr,
              letterSpacing:"0.06em",marginTop:2}}>● ONLINE</p>
          </div>
        </div>
      </nav>
    </>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────
function TopBar({title,sub,open,setOpen}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"18px 26px",borderBottom:`1px solid ${COLORS.border}`,
      background:COLORS.surface,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button className="ham-btn" onClick={()=>setOpen(!open)}
          style={{background:"none",border:"none",cursor:"pointer",
            color:COLORS.muted,fontSize:20,display:"none",padding:"2px 4px"}}>☰</button>
        <div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,
            fontSize:"clamp(16px,2.2vw,22px)",color:COLORS.text,letterSpacing:"0.01em"}}>{title}</h1>
          <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
            letterSpacing:"0.14em",textTransform:"uppercase",marginTop:2}}>{sub}</p>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,
        background:`${COLORS.green}12`,border:`1px solid ${COLORS.green}38`,
        borderRadius:20,padding:"5px 14px"}}>
        <div style={{width:7,height:7,borderRadius:"50%",
          background:COLORS.greenBr,animation:"pulse 2.2s infinite"}}/>
        <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",
          color:COLORS.greenBr,letterSpacing:"0.1em"}}>SERVER CONNECTED</span>
      </div>
    </div>
  );
}

// ── PAGE: Team Overview ────────────────────────────────────────────
function TeamOverview() {
  const radarData=[
    {label:"Shooting",   value:0.78,avg:0.60},
    {label:"Playmaking", value:0.65,avg:0.58},
    {label:"Rebounding", value:0.60,avg:0.55},
    {label:"Defense",    value:0.70,avg:0.62},
    {label:"Cond.",      value:0.72,avg:0.64},
  ];
  return (
    <div style={{padding:"26px",display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}
        className="stat-grid4">
        <StatCard cls="fu"  label="Team True Shooting" value="54.2%" trend="+1.2%" accent="green"/>
        <StatCard cls="fu1" label="Active AI Weaknesses" value="14"   sub="High Alert"  accent="red"/>
        <StatCard cls="fu2" label="Drills Assigned"      value="28"   sub="This Week"   accent="white"/>
        <StatCard cls="fu3" label="Win Probability"      value="68%"  trend="+3.1%"     accent="green"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)",gap:14}}
        className="charts-row">
        {/* Trajectory */}
        <div className="fu4" style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,
          borderRadius:12,padding:"22px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            marginBottom:18,flexWrap:"wrap",gap:10}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:15,
              color:COLORS.text}}>Season Performance Trajectory</h2>
            <div style={{display:"flex",gap:14}}>
              {[{c:COLORS.greenBr,l:"Offense Rating"},{c:COLORS.red,l:"Defense Rating"}].map(x=>(
                <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/>
                  <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",
                    color:COLORS.muted,letterSpacing:"0.06em"}}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <AreaChart data={TRAJECTORY} height={190}/>
        </div>
        {/* Radar */}
        <div className="fu5" style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,
          borderRadius:12,padding:"22px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:15,
            color:COLORS.text,marginBottom:8,width:"100%"}}>Team vs League Average</h2>
          <div style={{display:"flex",gap:14,marginBottom:12,width:"100%",flexWrap:"wrap"}}>
            {[{c:COLORS.greenBr,l:"Team"},{c:COLORS.red+"99",l:"League avg"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/>
                <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",
                  color:COLORS.muted}}>{x.l}</span>
              </div>
            ))}
          </div>
          <RadarChart data={radarData} size={200} color={COLORS.green}
            showComp={true}/>
        </div>
      </div>
    </div>
  );
}

// ── PAGE: Player Evaluation ────────────────────────────────────────
function PlayerEvaluation({initId}) {
  const [selId,setSelId]=useState(initId||null);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const filtered=PLAYERS.filter(p=>
    p.name.toLowerCase().includes(query.toLowerCase())||
    p.team.toLowerCase().includes(query.toLowerCase())
  );
  const player=PLAYERS.find(p=>p.id===selId);
  const stColor=s=> s==="elite"?COLORS.greenBr:s==="strong"?"#7ec850":s==="needs-drills"?COLORS.red:COLORS.muted;
  const stLabel=s=> s==="elite"?"ELITE":s==="strong"?"STRONG":"NEEDS DRILLS";
  const getWeaknesses=p=>{
    const w=[];
    if(p.tov>3.0)          w.push({key:"tov",label:"Turnovers",   pct:Math.round((1-Math.min(p.tov/5,1))*100)});
    if(p.fg<0.44)          w.push({key:"fg", label:"Field Goal %", pct:Math.round(p.fg*100)});
    if(p.fg3<0.34)         w.push({key:"fg3",label:"3-Point %",    pct:Math.round(p.fg3*100)});
    if(p.reb<5)            w.push({key:"reb",label:"Rebounding",   pct:Math.round(p.reb/15*100)});
    if(p.stl+p.blk<1.5)   w.push({key:"def",label:"Defense",      pct:Math.round((p.stl+p.blk)/4*100)});
    return w.slice(0,3);
  };
  const getRadar=p=>[
    {label:"Shooting",   value:p.fg,                            avg:0.46},
    {label:"Playmaking", value:Math.min(p.ast/10,1),            avg:0.40},
    {label:"Rebounding", value:Math.min(p.reb/15,1),            avg:0.45},
    {label:"Defense",    value:Math.min((p.stl+p.blk)/5,1),    avg:0.30},
    {label:"Ball Sec.",  value:Math.max(1-p.tov/6,0),          avg:0.55},
  ];
  const doScan=id=>{setLoading(true);setTimeout(()=>{setSelId(id);setLoading(false);},600);};

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      height:"60vh",flexDirection:"column",gap:16}}>
      <div style={{width:38,height:38,border:`2px solid ${COLORS.green}`,
        borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <p style={{fontFamily:"'DM Mono',monospace",color:COLORS.muted,fontSize:11,letterSpacing:"0.12em"}}>
        SCANNING PLAYER...
      </p>
    </div>
  );

  if(player) {
    const weaknesses=getWeaknesses(player);
    const pw=weaknesses[0];
    const drills=pw?(DRILLS[pw.key]||[]):[];
    const gap=pw?(100-pw.pct):0;
    const rColor=player.status==="needs-drills"?COLORS.red:COLORS.green;
    return(
      <div style={{padding:26}}>
        <button onClick={()=>setSelId(null)} style={{
          background:"none",border:`1px solid ${COLORS.border}`,color:COLORS.muted,
          borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,
          fontFamily:"'Outfit',sans-serif",marginBottom:20,
          transition:"all 0.18s",display:"flex",alignItems:"center",gap:6,
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.green;e.currentTarget.style.color=COLORS.greenBr;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.border;e.currentTarget.style.color=COLORS.muted;}}
        >← Back to roster</button>

        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.65fr)",gap:14}}
          className="scout-grid">
          {/* Left card */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="fu" style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,
              borderRadius:14,padding:"28px 24px",display:"flex",flexDirection:"column",
              alignItems:"center",position:"relative",overflow:"hidden"}}>
              {/* Top gradient bar */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,
                background:`linear-gradient(90deg,${COLORS.green},${COLORS.red})`}}/>
              {/* Scan line */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,${COLORS.greenBr}66,transparent)`,
                animation:"scan 3.5s linear infinite"}}/>
              <div style={{width:68,height:68,borderRadius:"50%",
                background:`linear-gradient(135deg,${COLORS.greenDim},${COLORS.redDim})`,
                border:`2px solid ${COLORS.borderHi}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,
                color:COLORS.text,marginBottom:14}}>{player.name.charAt(0)}</div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,
                color:COLORS.text,marginBottom:6,textAlign:"center"}}>{player.name}</h2>
              <div style={{display:"flex",gap:6,marginBottom:18}}>
                <span style={{fontSize:10,padding:"3px 10px",borderRadius:20,
                  background:`${COLORS.green}20`,border:`1px solid ${COLORS.green}40`,
                  color:COLORS.greenBr,fontFamily:"'DM Mono',monospace"}}>{player.pos}</span>
                <span style={{fontSize:10,padding:"3px 10px",borderRadius:20,
                  background:COLORS.bg,border:`1px solid ${COLORS.border}`,
                  color:COLORS.muted,fontFamily:"'DM Mono',monospace"}}>{player.team}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,
                width:"100%",textAlign:"center",marginBottom:20}}>
                {[
                  {l:"True Shooting", v:`${player.ts.toFixed(1)}%`},
                  {l:"Status",        v:stLabel(player.status), c:stColor(player.status)},
                  {l:"Games Played",  v:player.games},
                  {l:"Position Group",v:player.posGroup},
                ].map(x=>(
                  <div key={x.l}>
                    <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
                      letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{x.l}</p>
                    <p style={{fontSize:15,fontWeight:600,fontFamily:"'Syne',sans-serif",
                      color:x.c||COLORS.text}}>{x.v}</p>
                  </div>
                ))}
              </div>
              <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
                letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,textAlign:"center"}}>
                Metrics vs Positional Avg
              </p>
              <RadarChart data={getRadar(player)} size={190} color={rColor} showComp={true}/>
            </div>
          </div>

          {/* Right col */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Diagnosis */}
            {pw&&(
              <div className="fu1" style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,
                borderRadius:14,padding:"22px 24px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                  <div style={{width:20,height:20,borderRadius:4,
                    background:`${COLORS.red}22`,border:`1px solid ${COLORS.red}44`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>⚡</div>
                  <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",
                    letterSpacing:"0.14em",color:COLORS.muted,textTransform:"uppercase"}}>Engine Diagnosis</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div>
                    <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
                      letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Identified Flaw</p>
                    <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:26,
                      color:COLORS.text,lineHeight:1.1}}>{pw.label.toUpperCase()}</p>
                  </div>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                      <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",
                        color:COLORS.mutedLo,letterSpacing:"0.08em"}}>Performance Gap</p>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,
                        color:COLORS.red,fontWeight:500}}>{gap}% Below</span>
                    </div>
                    <div style={{height:7,background:COLORS.bg,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:4,
                        width:`${Math.min(gap,100)}%`,
                        background:`linear-gradient(90deg,${COLORS.red},${COLORS.redDim})`,
                        transition:"width 1s ease"}}/>
                    </div>
                    <p style={{fontSize:11,color:COLORS.mutedLo,marginTop:9,lineHeight:1.55,
                      fontFamily:"'Outfit',sans-serif"}}>
                      AI model detected a statistical deviation from the positional baseline.
                      Drill intervention recommended.
                    </p>
                  </div>
                </div>
                {weaknesses.length>1&&(
                  <div style={{marginTop:16,borderTop:`1px solid ${COLORS.border}`,
                    paddingTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
                    {weaknesses.map(w=>(
                      <div key={w.key} style={{display:"flex",alignItems:"center",gap:7,
                        background:`${COLORS.red}12`,border:`1px solid ${COLORS.red}30`,
                        borderRadius:8,padding:"5px 12px"}}>
                        <span style={{fontSize:11,color:COLORS.red,
                          fontFamily:"'DM Mono',monospace"}}>{w.label}</span>
                        <span style={{fontSize:11,color:COLORS.mutedLo,
                          fontFamily:"'DM Mono',monospace"}}>{w.pct}th pct</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats grid */}
            <div className="fu2" style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,
              borderRadius:14,padding:"22px 24px"}}>
              <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
                letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14}}>Season Averages</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9}}>
                {[["PTS",player.pts.toFixed(1)],["AST",player.ast.toFixed(1)],
                  ["REB",player.reb.toFixed(1)],["TOV",player.tov.toFixed(1)],
                  ["FG%",`${(player.fg*100).toFixed(1)}%`],["3P%",`${(player.fg3*100).toFixed(1)}%`],
                  ["STL",player.stl.toFixed(1)],["BLK",player.blk.toFixed(1)]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center",background:COLORS.bg,
                    borderRadius:8,padding:"10px 4px",border:`1px solid ${COLORS.border}`}}>
                    <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
                      letterSpacing:"0.1em",marginBottom:4}}>{l}</p>
                    <p style={{fontSize:16,fontWeight:600,fontFamily:"'Syne',sans-serif",
                      color:COLORS.text}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drills */}
            {drills.length>0&&(
              <div className="fu3" style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,
                borderRadius:14,padding:"22px 24px"}}>
                <p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:COLORS.mutedLo,
                  letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14}}>
                  Prescribed Training Regimen
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {drills.map((d,i)=>(
                    <div key={d.id} style={{background:COLORS.bg,
                      border:`1px solid ${COLORS.border}`,
                      borderLeft:`3px solid ${i===0?COLORS.green:COLORS.border}`,
                      borderRadius:10,padding:"14px 16px",transition:"border-left-color 0.18s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderLeftColor=COLORS.greenBr}
                      onMouseLeave={e=>e.currentTarget.style.borderLeftColor=i===0?COLORS.green:COLORS.border}
                    >
                      <div style={{display:"flex",justifyContent:"space-between",
                        alignItems:"flex-start",marginBottom:5}}>
                        <p style={{fontSize:14,fontWeight:500,fontFamily:"'Outfit',sans-serif",
                          color:COLORS.text}}>{d.name}</p>
                        <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,
                          background:`${COLORS.green}15`,color:COLORS.greenBr,
                          fontFamily:"'DM Mono',monospace",border:`1px solid ${COLORS.green}30`,
                          marginLeft:8,whiteSpace:"nowrap"}}>{d.diff.toUpperCase()}</span>
                      </div>
                      <p style={{fontSize:10,color:COLORS.mutedLo,fontFamily:"'DM Mono',monospace",
                        letterSpacing:"0.06em",marginBottom:10}}>
                        TARGET: {d.skill.toUpperCase()}
                      </p>
                      <button style={{width:"100%",padding:"8px",borderRadius:7,
                        background:"transparent",border:`1px solid ${COLORS.border}`,
                        color:COLORS.muted,fontSize:12,fontFamily:"'Outfit',sans-serif",
                        cursor:"pointer",transition:"all 0.18s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.green;e.currentTarget.style.color=COLORS.greenBr;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.border;e.currentTarget.style.color=COLORS.muted;}}
                      >Assign to Schedule</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:26}}>
      <div className="fu" style={{marginBottom:18}}>
        <p style={{fontSize:14,color:COLORS.muted,marginBottom:14,
          fontFamily:"'Outfit',sans-serif"}}>
          Select a player to generate their AI scouting report and drill recommendations.
        </p>
        <div style={{position:"relative",maxWidth:400}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",
            color:COLORS.mutedLo,fontSize:15}}>◎</span>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search by name or team..."
            style={{width:"100%",padding:"10px 13px 10px 38px",
              background:COLORS.card,border:`1px solid ${COLORS.border}`,
              borderRadius:9,color:COLORS.text,fontSize:13,
              fontFamily:"'Outfit',sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=COLORS.green}
            onBlur={e=>e.target.style.borderColor=COLORS.border}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
        {filtered.map((p,i)=>(
          <div key={p.id} className={`fu${Math.min(i+1,5)}`} style={{
            background:COLORS.card,border:`1px solid ${COLORS.border}`,
            borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all 0.18s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.green+"55";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.border;e.currentTarget.style.transform="translateY(0)";}}
            onClick={()=>doScan(p.id)}
          >
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",
                background:`linear-gradient(135deg,${COLORS.greenDim},${COLORS.redDim})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:COLORS.text,
                flexShrink:0}}>{p.name.charAt(0)}</div>
              <div style={{minWidth:0}}>
                <p style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:14,
                  color:COLORS.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                <div style={{display:"flex",gap:5,marginTop:2}}>
                  <span style={{fontSize:10,color:COLORS.greenBr,fontFamily:"'DM Mono',monospace"}}>{p.pos}</span>
                  <span style={{fontSize:10,color:COLORS.mutedLo,fontFamily:"'DM Mono',monospace"}}>· {p.team}</span>
                </div>
              </div>
              <span style={{marginLeft:"auto",fontSize:10,padding:"3px 8px",borderRadius:20,
                background:`${stColor(p.status)}18`,border:`1px solid ${stColor(p.status)}40`,
                color:stColor(p.status),fontFamily:"'DM Mono',monospace",
                whiteSpace:"nowrap",flexShrink:0}}>{stLabel(p.status)}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,
              borderTop:`1px solid ${COLORS.border}`,paddingTop:11,marginBottom:11}}>
              {[["PTS",p.pts.toFixed(1)],["AST",p.ast.toFixed(1)],["REB",p.reb.toFixed(1)],["TS%",p.ts.toFixed(1)]].map(([l,v])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <p style={{fontSize:9,color:COLORS.mutedLo,fontFamily:"'DM Mono',monospace",marginBottom:2}}>{l}</p>
                  <p style={{fontSize:13,fontWeight:600,fontFamily:"'Syne',sans-serif",color:COLORS.text}}>{v}</p>
                </div>
              ))}
            </div>
            <button style={{width:"100%",padding:"8px",
              background:`${COLORS.red}15`,border:`1px solid ${COLORS.red}40`,
              borderRadius:8,color:COLORS.red,fontSize:11,
              fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em",cursor:"pointer",
              transition:"all 0.18s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=COLORS.red;e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${COLORS.red}15`;e.currentTarget.style.color=COLORS.red;}}
            >▶ SCAN PLAYER</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PAGE: Live Roster ──────────────────────────────────────────────
function LiveRoster({setActive,setRosterId}) {
  const [sort,setSort]=useState("pts");
  const [dir,setDir]=useState("desc");
  const [filter,setFilter]=useState("");
  const sorted=[...PLAYERS]
    .filter(p=>p.name.toLowerCase().includes(filter.toLowerCase())||p.team.toLowerCase().includes(filter.toLowerCase()))
    .sort((a,b)=>{
      const av=a[sort],bv=b[sort];
      if(typeof av==="string") return dir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
      return dir==="asc"?av-bv:bv-av;
    });
  const toggleSort=k=>{if(sort===k)setDir(d=>d==="asc"?"desc":"asc");else{setSort(k);setDir("desc");}};
  const tsColor=ts=>ts>=62?COLORS.greenBr:ts>=54?"#c8e850":COLORS.red;
  const SortHdr=({k,lbl,flex=1})=>(
    <div style={{flex,cursor:"pointer",userSelect:"none"}} onClick={()=>toggleSort(k)}>
      <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",
        textTransform:"uppercase",color:sort===k?COLORS.greenBr:COLORS.mutedLo}}>
        {lbl}{sort===k?(dir==="asc"?" ↑":" ↓"):""}
      </span>
    </div>
  );
  return(
    <div style={{padding:26}}>
      <div className="fu" style={{display:"flex",justifyContent:"space-between",
        alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,color:COLORS.text}}>
            Database Explorer
          </h2>
          <p style={{fontSize:11,color:COLORS.mutedLo,fontFamily:"'DM Mono',monospace",marginTop:2}}>
            Live data from Python generation engine
          </p>
        </div>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
          <input value={filter} onChange={e=>setFilter(e.target.value)}
            placeholder="Filter players..."
            style={{padding:"8px 13px",background:COLORS.card,border:`1px solid ${COLORS.border}`,
              borderRadius:8,color:COLORS.text,fontSize:12,fontFamily:"'Outfit',sans-serif",
              outline:"none",width:170}}
            onFocus={e=>e.target.style.borderColor=COLORS.green}
            onBlur={e=>e.target.style.borderColor=COLORS.border}/>
          <button style={{padding:"8px 18px",background:COLORS.green,border:"none",
            borderRadius:8,color:"#fff",fontSize:12,fontFamily:"'DM Mono',monospace",
            cursor:"pointer",letterSpacing:"0.06em",transition:"background 0.18s"}}
            onMouseEnter={e=>e.currentTarget.style.background=COLORS.greenBr}
            onMouseLeave={e=>e.currentTarget.style.background=COLORS.green}
          >EXPORT DATA</button>
        </div>
      </div>

      <div className="fu1 roster-table" style={{background:COLORS.card,
        border:`1px solid ${COLORS.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"flex",padding:"13px 18px",
          borderBottom:`1px solid ${COLORS.border}`,background:COLORS.surface,minWidth:620}}>
          <SortHdr k="name" lbl="Player Identity" flex={2.4}/>
          <SortHdr k="pos"  lbl="POS"  flex={0.7}/>
          <SortHdr k="ts"   lbl="Efficiency (TS%)" flex={1.3}/>
          <SortHdr k="pts"  lbl="PTS"  flex={0.8}/>
          <SortHdr k="ast"  lbl="AST"  flex={0.8}/>
          <SortHdr k="reb"  lbl="REB"  flex={0.8}/>
          <div style={{flex:1.2}}>
            <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",
              textTransform:"uppercase",color:COLORS.mutedLo}}>Action Engine</span>
          </div>
        </div>
        {sorted.map((p,i)=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",
            padding:"13px 18px",minWidth:620,
            borderBottom:i<sorted.length-1?`1px solid ${COLORS.border}`:"none",
            transition:"background 0.14s"}}
            onMouseEnter={e=>e.currentTarget.style.background=`${COLORS.surface}99`}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <div style={{flex:2.4,display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:31,height:31,borderRadius:"50%",
                background:`linear-gradient(135deg,${COLORS.greenDim},${COLORS.bg})`,
                border:`1px solid ${COLORS.border}`,display:"flex",alignItems:"center",
                justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:700,
                fontSize:13,color:COLORS.muted,flexShrink:0}}>{p.name.charAt(0)}</div>
              <div style={{minWidth:0}}>
                <p style={{fontSize:13,fontWeight:500,color:COLORS.text,
                  fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",
                  whiteSpace:"nowrap"}}>{p.name}</p>
                <p style={{fontSize:10,color:COLORS.mutedLo,fontFamily:"'DM Mono',monospace"}}>{p.team}</p>
              </div>
            </div>
            <div style={{flex:0.7}}>
              <span style={{fontSize:11,padding:"3px 8px",borderRadius:5,
                background:`${COLORS.green}15`,color:COLORS.greenBr,
                fontFamily:"'DM Mono',monospace",border:`1px solid ${COLORS.green}25`}}>{p.pos}</span>
            </div>
            <div style={{flex:1.3,display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,
                color:tsColor(p.ts)}}>{p.ts.toFixed(1)}%</span>
              <div style={{flex:1,height:4,background:COLORS.bg,borderRadius:2,overflow:"hidden",maxWidth:70}}>
                <div style={{height:"100%",borderRadius:2,
                  width:`${Math.min((p.ts/72)*100,100)}%`,background:tsColor(p.ts)}}/>
              </div>
            </div>
            {["pts","ast","reb"].map(k=>(
              <div key={k} style={{flex:0.8}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:COLORS.text}}>
                  {p[k].toFixed(1)}
                </span>
              </div>
            ))}
            <div style={{flex:1.2}}>
              <button onClick={()=>{setRosterId(p.id);setActive("evaluation");}}
                style={{padding:"6px 14px",background:`${COLORS.red}18`,
                  border:`1px solid ${COLORS.red}50`,borderRadius:7,color:COLORS.red,
                  fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace",
                  letterSpacing:"0.08em",transition:"all 0.18s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=COLORS.red;e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${COLORS.red}18`;e.currentTarget.style.color=COLORS.red;}}
              >SCAN PLAYER</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────
export default function KipajiApp() {
  const [active,setActive]=useState("overview");
  const [open,setOpen]=useState(false);
  const [rosterId,setRosterId]=useState(null);
  const pages={
    overview:   {title:"Team Analytics",    sub:"Kipaji Engine v1.0.4"},
    evaluation: {title:"AI Scouting Report",sub:"Kipaji Engine v1.0.4"},
    roster:     {title:"Database Explorer", sub:"Kipaji Engine v1.0.4"},
  };
  return(
    <div style={{display:"flex",minHeight:"100vh"}}>
      <Sidebar active={active} setActive={v=>{setActive(v);if(v!=="evaluation")setRosterId(null);}}
        open={open} setOpen={setOpen}/>
      <div className="main-content" style={{marginLeft:210,flex:1,display:"flex",
        flexDirection:"column",minHeight:"100vh"}}>
        <TopBar title={pages[active].title} sub={pages[active].sub} open={open} setOpen={setOpen}/>
        <div style={{flex:1,overflowY:"auto"}}>
          {active==="overview"   &&<TeamOverview key="ov"/>}
          {active==="evaluation" &&<PlayerEvaluation key="ev" initId={rosterId}/>}
          {active==="roster"     &&<LiveRoster key="ro" setActive={setActive} setRosterId={setRosterId}/>}
        </div>
      </div>
    </div>
  );
}
