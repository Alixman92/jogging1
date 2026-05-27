import { useState, useEffect, useRef } from "react";

const T = {
  bg:      "#0A0A0A",
  surface: "#141414",
  card:    "#1E1E1E",
  border:  "#2A2A2A",
  green:   "#00E676",
  orange:  "#FF6D00",
  text:    "#F0F0F0",
  muted:   "#777",
};

const pad2 = n => String(n).padStart(2, "0");
const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_S = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const store = {
  async load() {
    try { const r = await window.storage.get("jogpals"); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async save(d) {
    try { await window.storage.set("jogpals", JSON.stringify(d)); } catch {}
  }
};

const INIT = {
  runs: {},
  goals: [],
  journal: [],
  timerCfg: { rounds: 6, work: 3, rest: 1 }
};

export default function App() {
  const [data, setData] = useState(INIT);
  const [tab, setTab] = useState("home");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.load().then(saved => {
      if (saved) setData(prev => ({ ...INIT, ...saved }));
      setReady(true);
    });
  }, []);

  const update = fn => setData(prev => {
    const next = fn(prev);
    store.save(next);
    return next;
  });

  if (!ready) return (
    <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", background:T.bg }}>
      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:44, color:T.green, letterSpacing:6 }}>JOGPALS</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", background:T.bg, minHeight:"100vh", color:T.text, maxWidth:480, margin:"0 auto", paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        button, input, textarea, select { font-family:'Outfit',sans-serif; }
        button { cursor:pointer; }
        input[type=range] { accent-color:${T.green}; width:100%; }
        textarea, input:not([type=range]) { cursor:text; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
        option { background:#1E1E1E; color:#F0F0F0; }
      `}</style>
      <div style={{ display:tab==="home"?"block":"none"     }}><HomeTab     data={data} setTab={setTab} /></div>
      <div style={{ display:tab==="timer"?"block":"none"    }}><TimerTab    data={data} update={update} /></div>
      <div style={{ display:tab==="calendar"?"block":"none" }}><CalendarTab data={data} update={update} /></div>
      <div style={{ display:tab==="goals"?"block":"none"    }}><GoalsTab    data={data} update={update} /></div>
      <div style={{ display:tab==="journal"?"block":"none"  }}><JournalTab  data={data} update={update} /></div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

const NAV = [
  { id:"home",     emoji:"⚡", label:"Home"    },
  { id:"timer",    emoji:"⏱", label:"Timer"   },
  { id:"calendar", emoji:"📍", label:"Log"     },
  { id:"goals",    emoji:"🎯", label:"Goals"   },
  { id:"journal",  emoji:"📓", label:"Journal" },
];

function BottomNav({ tab, setTab }) {
  return (
    <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0F0F0F", borderTop:`1px solid ${T.border}`, display:"flex", zIndex:99 }}>
      {NAV.map(n => (
        <button key={n.id} onClick={() => setTab(n.id)}
          style={{ flex:1, padding:"10px 0 8px", background:"none", border:"none", color:tab===n.id?T.green:T.muted, transition:"color .2s" }}>
          <div style={{ fontSize:20, lineHeight:1 }}>{n.emoji}</div>
          <div style={{ fontSize:10, fontWeight:tab===n.id?600:400, marginTop:3, letterSpacing:".04em" }}>{n.label}</div>
        </button>
      ))}
    </nav>
  );
}

/* ── Home ── */
function HomeTab({ data, setTab }) {
  const runEntries = Object.entries(data.runs).sort(([a],[b]) => b.localeCompare(a));
  const totalRuns  = runEntries.length;
  const totalKm    = runEntries.reduce((s,[,r]) => s + (r.km   || 0), 0);
  const totalMins  = runEntries.reduce((s,[,r]) => s + (r.mins || 0), 0);

  let streak = 0;
  const dt = new Date();
  for (let i = 0; i < 365; i++) {
    const k = dt.toISOString().slice(0,10);
    if (data.runs[k]) { streak++; dt.setDate(dt.getDate()-1); } else break;
  }

  const bestRun = runEntries.reduce((best,[,r]) => r.km > (best?.km||0) ? r : best, null);
  const activeGoals = data.goals.filter(g => !g.done);

  return (
    <div style={{ padding:"28px 20px 16px" }}>
      <div style={{ marginBottom:6 }}>
        <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:52, color:T.green, lineHeight:1, letterSpacing:".05em" }}>JOGPALS</div>
        <div style={{ color:T.muted, fontSize:13, marginTop:2 }}>
          {new Date().toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric" })}
        </div>
      </div>

      <div style={{ background:T.surface, borderLeft:`3px solid ${T.green}`, padding:"9px 14px", borderRadius:"0 8px 8px 0", margin:"20px 0", fontSize:13, color:"#AAA", fontStyle:"italic" }}>
        "The miracle isn't that I finished. The miracle is that I had the courage to start."
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
        {[
          { v:totalRuns,              label:"Runs"     },
          { v:`${totalKm.toFixed(1)}`, label:"km Total" },
          { v:`${streak}🔥`,          label:"Streak"   },
        ].map(s => (
          <div key={s.label} style={{ background:T.surface, borderRadius:14, padding:"14px 8px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:32, color:T.green, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:4, textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(totalRuns > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:20 }}>
          {[
            { v:`${totalMins}m`,                label:"Time Logged" },
            { v:bestRun?`${bestRun.km}km`:"—", label:"Best Run"    },
          ].map(s => (
            <div key={s.label} style={{ background:T.surface, borderRadius:12, padding:"12px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:24, color:"#AAA", lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
        <button onClick={()=>setTab("timer")} style={{ background:T.green, color:"#000", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14 }}>
          ⏱ Start Timer
        </button>
        <button onClick={()=>setTab("calendar")} style={{ background:T.surface, color:T.text, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px", fontWeight:600, fontSize:14 }}>
          📍 Log a Run
        </button>
      </div>

      {activeGoals.length > 0 && (
        <Section title="Active Goals" onMore={() => setTab("goals")}>
          {activeGoals.slice(0,2).map(g => {
            const pct = g.target > 0 ? Math.min(100, g.current/g.target*100) : 0;
            return (
              <div key={g.id} style={{ background:T.surface, borderRadius:10, padding:"10px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:500, marginBottom:6 }}>
                  <span>{g.title}</span>
                  <span style={{ color:T.green, fontWeight:700 }}>{pct.toFixed(0)}%</span>
                </div>
                <PBar v={pct} />
              </div>
            );
          })}
        </Section>
      )}

      {runEntries.length > 0 && (
        <Section title="Recent Runs" onMore={() => setTab("calendar")}>
          {runEntries.slice(0,3).map(([date, run]) => (
            <div key={date} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:T.surface, borderRadius:10, marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  {new Date(date+"T00:00:00").toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" })}
                </div>
                {run.notes && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{run.notes.slice(0,45)}{run.notes.length>45?"…":""}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                {run.km>0   && <div style={{ fontWeight:700, color:T.green }}>{run.km}km</div>}
                {run.mins>0 && <div style={{ fontSize:12, color:T.muted }}>{run.mins}m</div>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {totalRuns===0 && (
        <div style={{ textAlign:"center", padding:"32px 0", color:T.muted }}>
          <div style={{ fontSize:52 }}>👟</div>
          <div style={{ fontWeight:600, fontSize:16, color:T.text, marginTop:10, marginBottom:4 }}>Lace up, let's go!</div>
          <div style={{ fontSize:13 }}>Log your first run to start tracking</div>
        </div>
      )}
    </div>
  );
}

/* ── Timer ── */
function TimerTab({ data, update }) {
  const cfg = data.timerCfg;
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({ ...cfg });
  const [status,  setStatus]  = useState("idle");
  const [phase,   setPhase]   = useState("work");
  const [round,   setRound]   = useState(1);
  const [secs,    setSecs]    = useState(cfg.work * 60);

  const phaseRef = useRef("work");
  const roundRef = useRef(1);
  const secsRef  = useRef(cfg.work * 60);
  const cfgRef   = useRef(cfg);
  const ivRef    = useRef(null);

  phaseRef.current = phase;
  roundRef.current = round;
  secsRef.current  = secs;
  cfgRef.current   = cfg;

  const reset = c => {
    clearInterval(ivRef.current);
    const conf = c || cfg;
    setStatus("idle"); setPhase("work"); setRound(1); setSecs(conf.work * 60);
  };

  useEffect(() => {
    if (status !== "running") { clearInterval(ivRef.current); return; }
    ivRef.current = setInterval(() => {
      const cur = secsRef.current;
      const ph  = phaseRef.current;
      const r   = roundRef.current;
      const c   = cfgRef.current;
      if (cur > 1) {
        setSecs(cur - 1);
      } else if (ph === "work") {
        if (r >= c.rounds) { clearInterval(ivRef.current); setStatus("done"); }
        else { setPhase("rest"); setSecs(c.rest * 60); }
      } else {
        setRound(r + 1); setPhase("work"); setSecs(c.work * 60);
      }
    }, 1000);
    return () => clearInterval(ivRef.current);
  }, [status]);

  const saveConfig = () => {
    update(d => ({ ...d, timerCfg: draft }));
    reset(draft);
    setEditing(false);
  };

  const phaseColor = phase === "work" ? T.green : T.orange;
  const totalPhaseSecs = phase === "work" ? cfg.work*60 : cfg.rest*60;
  const R=90, CX=115, CY=115, circ=2*Math.PI*R;
  const dashOffset = status==="idle" ? 0 : circ * (1 - secs / totalPhaseSecs);
  const overallPct = Math.round(((round-1)*2+(phase==="work"?0:1))/(cfg.rounds*2)*100);

  return (
    <div style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <Title>INTERVAL TIMER</Title>
        {status==="idle" && (
          <button onClick={()=>{setEditing(e=>!e); setDraft({...cfg});}}
            style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"6px 14px", fontSize:13 }}>
            ⚙ Setup
          </button>
        )}
      </div>

      {editing && (
        <div style={{ background:T.surface, borderRadius:14, padding:16, marginBottom:20 }}>
          {[{k:"rounds",label:"Rounds",min:1,max:20},{k:"work",label:"Work (min)",min:1,max:60},{k:"rest",label:"Rest (min)",min:1,max:30}].map(({k,label,min,max}) => (
            <div key={k} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
                <span style={{ color:T.muted }}>{label}</span>
                <span style={{ color:T.green, fontWeight:700 }}>{draft[k]}</span>
              </div>
              <input type="range" min={min} max={max} value={draft[k]}
                onChange={e=>setDraft(d=>({...d,[k]:+e.target.value}))} />
            </div>
          ))}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveConfig} style={{ ...gBtn, flex:1 }}>Save</button>
            <button onClick={()=>setEditing(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
        <svg width={230} height={230} viewBox="0 0 230 230">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#282828" strokeWidth={14} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={phaseColor} strokeWidth={14}
            strokeDasharray={circ} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition:"stroke-dashoffset 0.85s linear, stroke 0.4s" }} />
          <text x={CX} y={CY-16} textAnchor="middle" fill={T.text} fontFamily="'Bebas Neue',cursive" fontSize={54}>
            {pad2(Math.floor(secs/60))}:{pad2(secs%60)}
          </text>
          <text x={CX} y={CY+14} textAnchor="middle" fill={phaseColor} fontFamily="Outfit,sans-serif" fontSize={15} fontWeight="600">
            {status==="done"?"DONE! 🎉":status==="idle"?"READY":phase.toUpperCase()}
          </text>
          <text x={CX} y={CY+36} textAnchor="middle" fill={T.muted} fontFamily="Outfit,sans-serif" fontSize={13}>
            Round {round} of {cfg.rounds}
          </text>
        </svg>

        <div style={{ width:200, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.muted, marginBottom:4 }}>
            <span>Overall progress</span><span>{overallPct}%</span>
          </div>
          <PBar v={overallPct} />
        </div>

        <div style={{ display:"flex", gap:24, marginBottom:24 }}>
          {[
            {label:"Rounds",v:cfg.rounds,         c:T.text   },
            {label:"Work",  v:`${cfg.work}m`,      c:T.green  },
            {label:"Rest",  v:`${cfg.rest}m`,      c:T.orange },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:12 }}>
          {status==="idle"    && <TimerBtn color={T.green}  textColor="#000" onClick={()=>setStatus("running")}>▶ START</TimerBtn>}
          {status==="running" && <TimerBtn color={T.surface} textColor={T.text} border onClick={()=>setStatus("paused")}>⏸ PAUSE</TimerBtn>}
          {status==="paused"  && <TimerBtn color={T.green}  textColor="#000" onClick={()=>setStatus("running")}>▶ RESUME</TimerBtn>}
          {(status==="paused"||status==="done") && (
            <TimerBtn color={T.surface} textColor={T.text} border onClick={()=>reset()}>↺ RESET</TimerBtn>
          )}
        </div>
      </div>
    </div>
  );
}

function TimerBtn({ children, color, textColor, border, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:color, color:textColor,
      border: border ? `1px solid ${T.border}` : "none",
      borderRadius:12, padding:"13px 30px",
      fontFamily:"'Bebas Neue',cursive", fontSize:20, letterSpacing:".06em"
    }}>{children}</button>
  );
}

/* ── Calendar ── */
function CalendarTab({ data, update }) {
  const now = new Date();
  const [yr, setYr] = useState(now.getFullYear());
  const [mo, setMo] = useState(now.getMonth());
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ km:"", mins:"", notes:"" });

  const firstDow = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo+1, 0).getDate();
  const todayKey = todayStr();

  const prevMo = () => { if (mo===0) { setMo(11); setYr(y=>y-1); } else setMo(m=>m-1); };
  const nextMo = () => { if (mo===11) { setMo(0); setYr(y=>y+1); } else setMo(m=>m+1); };

  const pick = day => {
    const k = `${yr}-${pad2(mo+1)}-${pad2(day)}`;
    if (sel===k) { setSel(null); return; }
    setSel(k);
    const ex = data.runs[k];
    setForm(ex ? {km:ex.km||"",mins:ex.mins||"",notes:ex.notes||""} : {km:"",mins:"",notes:""});
  };

  const saveRun = () => {
    if (!sel) return;
    update(d => ({ ...d, runs: { ...d.runs, [sel]: {km:+form.km||0, mins:+form.mins||0, notes:form.notes.trim()} } }));
  };

  const delRun = () => {
    update(d => { const r = {...d.runs}; delete r[sel]; return {...d, runs:r}; });
    setSel(null);
  };

  const monthRunCount = Object.keys(data.runs).filter(k => k.startsWith(`${yr}-${pad2(mo+1)}`)).length;

  return (
    <div style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <Title>RUN LOG</Title>
        {monthRunCount > 0 && (
          <div style={{ background:T.surface, borderRadius:8, padding:"5px 12px", fontSize:12, color:T.green, fontWeight:600 }}>
            {monthRunCount} run{monthRunCount>1?"s":""} this month
          </div>
        )}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"16px 0" }}>
        <button onClick={prevMo} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"8px 16px", fontSize:18 }}>‹</button>
        <div style={{ fontWeight:600, fontSize:16 }}>{MONTHS[mo]} {yr}</div>
        <button onClick={nextMo} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"8px 16px", fontSize:18 }}>›</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
        {DAYS_S.map(d => <div key={d} style={{ textAlign:"center", fontSize:11, color:T.muted, padding:"4px 0" }}>{d}</div>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {Array.from({length:firstDow}).map((_,i) => <div key={`g${i}`} />)}
        {Array.from({length:daysInMo},(_,i)=>i+1).map(day => {
          const k = `${yr}-${pad2(mo+1)}-${pad2(day)}`;
          const hasRun = !!data.runs[k];
          const isToday = k===todayKey;
          const isSel = k===sel;
          return (
            <button key={day} onClick={()=>pick(day)} style={{
              background: isSel?T.green : hasRun?"#182820" : T.surface,
              border: isToday ? `2px solid ${T.green}` : `1px solid ${T.border}`,
              borderRadius:8, aspectRatio:"1/1", color:isSel?"#000":T.text,
              fontSize:13, fontWeight:hasRun?700:400, position:"relative",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"
            }}>
              {day}
              {hasRun && !isSel && (
                <span style={{ position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:T.green }} />
              )}
            </button>
          );
        })}
      </div>

      {sel && (
        <div style={{ background:T.surface, borderRadius:14, padding:16, marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontWeight:600 }}>
              {new Date(sel+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
            </div>
            <button onClick={()=>setSel(null)} style={{ background:"none", border:"none", color:T.muted, fontSize:20 }}>×</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {[{k:"km",label:"Distance (km)",ph:"5.2"},{k:"mins",label:"Duration (min)",ph:"32"}].map(f => (
              <div key={f.k}>
                <Lbl>{f.label}</Lbl>
                <input type="number" value={form[f.k]} placeholder={f.ph}
                  onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))} style={iStyle} />
              </div>
            ))}
          </div>
          <Lbl>Notes</Lbl>
          <textarea rows={2} value={form.notes} placeholder="How did it feel?"
            onChange={e=>setForm(x=>({...x,notes:e.target.value}))}
            style={{ ...iStyle, resize:"none", width:"100%", marginBottom:12 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveRun} style={{ ...gBtn, flex:1 }}>Save Run</button>
            {data.runs[sel] && <button onClick={delRun} style={dangerBtn}>Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Goals ── */
const UNITS = ["km","runs","min","days","laps","times"];

function GoalsTab({ data, update }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title:"", target:"", unit:"km", deadline:"" });

  const add = () => {
    if (!form.title.trim()) return;
    update(d => ({ ...d, goals: [...d.goals, {id:uid(),...form,target:+form.target||0,current:0,done:false}] }));
    setForm({ title:"", target:"", unit:"km", deadline:"" });
    setOpen(false);
  };

  const toggle    = id => update(d => ({...d, goals: d.goals.map(g => g.id===id?{...g,done:!g.done}:g)}));
  const remove    = id => update(d => ({...d, goals: d.goals.filter(g => g.id!==id)}));
  const setProgress = (id,v) => update(d => ({...d, goals: d.goals.map(g => g.id===id?{...g,current:+v||0}:g)}));

  const active = data.goals.filter(g => !g.done);
  const done   = data.goals.filter(g =>  g.done);

  return (
    <div style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <Title>GOALS</Title>
        <button onClick={()=>setOpen(o=>!o)} style={gBtn}>+ Add</button>
      </div>

      {open && (
        <div style={{ background:T.surface, borderRadius:14, padding:16, marginBottom:20 }}>
          <Lbl>Goal title</Lbl>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
            placeholder="e.g. Run 5km without stopping" style={{ ...iStyle, width:"100%" }} />
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8 }}>
            <div><Lbl>Target</Lbl><input type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="0" style={{ ...iStyle, width:"100%" }} /></div>
            <div><Lbl>Unit</Lbl>
              <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} style={{ ...iStyle, padding:"9px 8px", width:"100%" }}>
                {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Lbl>Deadline (optional)</Lbl>
          <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={{ ...iStyle, width:"100%", marginBottom:12 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={add} style={{ ...gBtn, flex:1 }}>Save Goal</button>
            <button onClick={()=>setOpen(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      {active.length===0 && !open && <Empty emoji="🎯" title="Set a goal, chase it" sub="Goals keep you on track" />}
      {active.map(g => <GoalRow key={g.id} g={g} onToggle={toggle} onRemove={remove} onProgress={setProgress} />)}

      {done.length > 0 && <>
        <div style={{ fontSize:12, color:T.muted, textTransform:"uppercase", letterSpacing:".1em", margin:"16px 0 8px" }}>Completed ✓</div>
        {done.map(g => <GoalRow key={g.id} g={g} onToggle={toggle} onRemove={remove} onProgress={setProgress} />)}
      </>}
    </div>
  );
}

function GoalRow({ g, onToggle, onRemove, onProgress }) {
  const [expanded, setExpanded] = useState(false);
  const pct = g.target > 0 ? Math.min(100, g.current/g.target*100) : 0;
  return (
    <div style={{ background:T.surface, borderRadius:12, padding:14, marginBottom:10, opacity:g.done?0.55:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1, cursor:"pointer" }} onClick={()=>setExpanded(e=>!e)}>
          <div style={{ fontWeight:600, fontSize:14, textDecoration:g.done?"line-through":"none" }}>{g.title}</div>
          {g.deadline && <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>📅 {g.deadline}</div>}
        </div>
        <div style={{ display:"flex", gap:6, marginLeft:8 }}>
          <button onClick={()=>onToggle(g.id)} style={{ background:"none", border:`1px solid ${T.border}`, color:g.done?T.green:T.muted, borderRadius:6, padding:"3px 8px", fontSize:12 }}>
            {g.done?"↩":"✓"}
          </button>
          <button onClick={()=>onRemove(g.id)} style={{ background:"none", border:"none", color:T.muted, fontSize:18, padding:"0 2px" }}>×</button>
        </div>
      </div>
      {g.target > 0 && (
        <div style={{ marginTop:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.muted, marginBottom:4 }}>
            <span>Progress</span>
            <span style={{ color:g.done?T.muted:T.green }}>{g.current} / {g.target} {g.unit}</span>
          </div>
          <PBar v={pct} dim={g.done} />
        </div>
      )}
      {expanded && !g.done && g.target > 0 && (
        <div style={{ marginTop:10, display:"flex", gap:8, alignItems:"center" }}>
          <input type="number" value={g.current} onChange={e=>onProgress(g.id,e.target.value)}
            style={{ ...iStyle, flex:1, marginBottom:0 }} placeholder="Current" />
          <span style={{ fontSize:12, color:T.muted, whiteSpace:"nowrap" }}>{g.unit}</span>
        </div>
      )}
    </div>
  );
}

/* ── Journal ── */
const MOODS = ["💪","🔥","😊","😌","😤","😫","🤩","😴","🌧","⚡"];

function JournalTab({ data, update }) {
  const [open,    setOpen]    = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form,    setForm]    = useState({ title:"", body:"", mood:"💪", date:todayStr() });

  const add = () => {
    if (!form.title.trim() && !form.body.trim()) return;
    update(d => ({ ...d, journal: [{id:uid(),...form}, ...d.journal] }));
    setForm({ title:"", body:"", mood:"💪", date:todayStr() });
    setOpen(false);
  };

  const remove = id => update(d => ({...d, journal: d.journal.filter(e=>e.id!==id)}));

  return (
    <div style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <Title>JOURNAL</Title>
        <button onClick={()=>setOpen(o=>!o)} style={gBtn}>+ Entry</button>
      </div>

      {open && (
        <div style={{ background:T.surface, borderRadius:14, padding:16, marginBottom:20 }}>
          <Lbl>Title</Lbl>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
            placeholder="Today's run..." style={{ ...iStyle, width:"100%" }} />
          <Lbl>Mood</Lbl>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            {MOODS.map(m => (
              <button key={m} onClick={()=>setForm(f=>({...f,mood:m}))} style={{
                fontSize:22, background:form.mood===m?T.card:"none",
                border:form.mood===m?`2px solid ${T.green}`:"2px solid transparent",
                borderRadius:8, padding:"4px 6px"
              }}>{m}</button>
            ))}
          </div>
          <Lbl>Entry</Lbl>
          <textarea rows={4} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
            placeholder="Write about your run — what you felt, what you noticed, what you're proud of..."
            style={{ ...iStyle, resize:"vertical", width:"100%" }} />
          <Lbl>Date</Lbl>
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
            style={{ ...iStyle, width:"100%", marginBottom:12 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={add} style={{ ...gBtn, flex:1 }}>Save Entry</button>
            <button onClick={()=>setOpen(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      {data.journal.length===0 && !open && (
        <Empty emoji="📓" title="Your running story starts here" sub="Add your first journal entry" />
      )}

      {data.journal.map(e => (
        <div key={e.id} style={{ background:T.surface, borderRadius:12, padding:14, marginBottom:10, cursor:"pointer" }}
          onClick={()=>setViewing(v=>v===e.id?null:e.id)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ display:"flex", gap:10, flex:1 }}>
              <span style={{ fontSize:24, lineHeight:1, marginTop:2 }}>{e.mood}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{e.title||"Journal Entry"}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                  {new Date(e.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                </div>
              </div>
            </div>
            <button onClick={ev=>{ev.stopPropagation();remove(e.id);}}
              style={{ background:"none", border:"none", color:T.muted, fontSize:18, padding:"0 2px" }}>×</button>
          </div>
          {e.body && viewing!==e.id && (
            <div style={{ fontSize:13, color:"#999", marginTop:8, lineHeight:1.5 }}>
              {e.body.slice(0,90)}{e.body.length>90?"…":""}
            </div>
          )}
          {e.body && viewing===e.id && (
            <div style={{ fontSize:13, color:"#CCC", marginTop:10, lineHeight:1.7, whiteSpace:"pre-wrap", borderTop:`1px solid ${T.border}`, paddingTop:10 }}>
              {e.body}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Shared ── */
function Title({ children }) {
  return <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:36, letterSpacing:".05em" }}>{children}</div>;
}
function Section({ title, onMore, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".12em", color:T.muted }}>{title}</div>
        {onMore && <button onClick={onMore} style={{ background:"none", border:"none", color:T.green, fontSize:12 }}>See all →</button>}
      </div>
      {children}
    </div>
  );
}
function PBar({ v, dim }) {
  return (
    <div style={{ background:T.card, borderRadius:4, height:6, overflow:"hidden" }}>
      <div style={{ width:`${v}%`, height:"100%", background:dim?"#555":T.green, borderRadius:4, transition:"width .4s ease" }} />
    </div>
  );
}
function Empty({ emoji, title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"44px 20px", color:T.muted }}>
      <div style={{ fontSize:48 }}>{emoji}</div>
      <div style={{ fontWeight:600, fontSize:15, color:T.text, marginTop:10, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:13 }}>{sub}</div>
    </div>
  );
}
function Lbl({ children }) {
  return <div style={{ fontSize:11, color:T.muted, marginBottom:4, fontWeight:500 }}>{children}</div>;
}

const gBtn      = { background:T.green,   color:"#000",    border:"none",                          borderRadius:8, padding:"10px 18px", fontWeight:700, fontSize:14 };
const ghostBtn  = { background:T.surface, color:T.muted,   border:`1px solid ${T.border}`,         borderRadius:8, padding:"10px 16px", fontSize:14 };
const dangerBtn = { background:"#2A1515", color:"#FF6B6B", border:`1px solid #3A2020`,             borderRadius:8, padding:"10px 16px", fontSize:14 };
const iStyle    = { background:T.card,    color:T.text,    border:`1px solid ${T.border}`,         borderRadius:8, padding:"10px 12px", fontSize:14, marginBottom:10, display:"block" };
