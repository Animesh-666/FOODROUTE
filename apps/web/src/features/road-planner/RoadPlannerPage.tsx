import { useState,type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { dispatchCall } from '../dispatch/dispatch.service';
import { RoadMap } from './RoadMap';
import type { PlanName,RoadResponse,SampleStop,GeometryResponse } from './route-types';
import './road-planner.css';

// Illustrative coordinates around Berhampore. Not verified customer addresses.
const preset:SampleStop[]=[
 {id:'depot',label:'Sample shared kitchen',lat:24.1032,lng:88.2517},
 {id:'a',label:'Sample stop A',lat:24.1181,lng:88.2654},
 {id:'b',label:'Sample stop B',lat:24.0961,lng:88.2741},
 {id:'c',label:'Sample stop C',lat:24.0889,lng:88.2421},
 {id:'d',label:'Sample stop D',lat:24.1115,lng:88.2295},
];
const names:Record<PlanName,string>={greedy:'Greedy',twoOpt:'Greedy + 2-opt',exact:'Held–Karp (exact)',fleet:'Multi-rider heuristic'};
const modes:{value:'simulation'|'road',label:string}[]=[{value:'simulation',label:'Offline simulation'}, {value:'road',label:'Road network · OSRM demo'}];
const asDuration=(s:number)=>s>=3600?`${(s/3600).toFixed(1)} h`:`${(s/60).toFixed(1)} min`;
const asDistance=(m:number)=>`${(m/1000).toFixed(2)} km`;
export function RoadPlannerPage(){
 const [stops,setStops]=useState<SampleStop[]>(preset),[mode,setMode]=useState<'road'|'simulation'>('simulation');
 const [riders,setRiders]=useState(2),[capacity,setCapacity]=useState(3),[consent,setConsent]=useState(false);
 const [selection,setSelection]=useState<PlanName>('fleet'),[result,setResult]=useState<RoadResponse|null>(null);
 const [working,setWorking]=useState(false),[fetchingGeometry,setFetchingGeometry]=useState(false);
 const [error,setError]=useState(''),[mapVisible,setMapVisible]=useState(false);
 const [geometry,setGeometry]=useState<Record<number,number[][]>>({});
 const current=result?.plans[selection];
 function resetResult(){setResult(null);setMapVisible(false);setGeometry({});setError('')}
 function edit(i:number,key:'lat'|'lng'|'label',value:string){setStops(old=>old.map((p,j)=>i===j?{...p,[key]:key==='label'?value:Number(value)}:p));resetResult()}
 function addStop(){if(stops.length>=8)return;const i=stops.length;setStops(old=>[...old,{id:`stop${i}`,label:`Sample stop ${i}`,lat:24.10+i*.0041,lng:88.24+i*.0051}]);resetResult()}
 function handleMode(e:ChangeEvent<HTMLSelectElement>){setMode(e.target.value as 'simulation'|'road');resetResult()}
 async function calculate(){
  setError('');setWorking(true);setMapVisible(false);setGeometry({});
  try{const response=await dispatchCall<RoadResponse>('roads/plan',{points:stops,mode,riders,capacity,externalConsent:consent});setResult(response);setSelection(riders>1?'fleet':'twoOpt')}
  catch(e){setResult(null);setError(e instanceof Error?e.message:'Unable to calculate route.')}finally{setWorking(false)}
 }
 async function loadMap(){
  if(!consent){setError('Consent is required before contacting external map tile services.');return}
  setError('');setMapVisible(true);
  if(mode==='road'&&result&&current){setFetchingGeometry(true);const routes:Record<number,number[][]>={};
   for(let i=0;i<current.routes.length;i++){
    try{const route=current.routes[i];if(route.indices.length>2){const reply=await dispatchCall<GeometryResponse>('roads/geometry',{points:result.points,indices:route.indices,externalConsent:consent});routes[i]=reply.coordinates}}
    catch(e){setError(`One or more road paths could not load. Dashed lines indicate straight-line connectors. ${e instanceof Error?e.message:''}`)}
   }
   setGeometry(routes);setFetchingGeometry(false);
  }
 }
 function changeChoice(v:PlanName){setSelection(v);setGeometry({});setMapVisible(false)}
 const single=result?.plans.greedy;
 const difference=single&&current&&single.totalSeconds>0?100*(single.totalSeconds-current.totalSeconds)/single.totalSeconds:0;
 return <div className="restaurant-page road-planner-page">
  <div className="restaurant-top"><Link className="restaurant-brand" to="/">f↗ foodroute<span>.</span></Link><nav><Link to="/admin/dispatch">Dispatch desk</Link><Link to="/admin/live-route-preview">Live order preview</Link><Link to="/algorithm-lab">Academic Lab</Link><Link to="/account">Account</Link></nav></div>
  <main className="restaurant-container dispatch-page road-content">
   <header className="restaurant-intro"><p className="eyebrow"><span/> PHASE 5B · ADVANCED ROUTING SANDBOX</p><h1>The smarter <em>way.</em></h1><p>Explore multi-stop road travel and DAA algorithms in a private, manual-coordinate sandbox. This planner never assigns real orders or tracks riders.</p></header>
   <div className="road-layout">
    <section className="restaurant-panel road-settings">
     <div className="road-section-head"><h2>01 · Your route</h2><span className="road-pill">{stops.length-1} sample deliveries</span></div>
     <label>Travel data source<select value={mode} onChange={handleMode}>{modes.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
     <p className="road-help">{mode==='simulation'?'Simulated travel time: great-circle distance × 1.3 at an assumed 28 km/h. Not a road route.':'Road times and distances come from OSRM’s public driving demo when you request a plan. No traffic or motorcycle-specific model.'}</p>
     <div className="road-fields">
      <label>Riders<select value={riders} onChange={e=>{setRiders(Number(e.target.value));resetResult()}}>{[1,2,3].map(v=><option value={v} key={v}>{v}</option>)}</select></label>
      <label>Max stops / rider<select value={capacity} onChange={e=>{setCapacity(Number(e.target.value));resetResult()}}>{[1,2,3,4,5,6,7].map(v=><option value={v} key={v}>{v}</option>)}</select></label>
     </div>
     <div className="road-section-head"><h3>Sample coordinates</h3><button type="button" className="road-text-action" onClick={()=>{setStops(preset);resetResult()}}>Restore samples</button></div>
     <p className="road-help">Use non-sensitive demonstration coordinates. Stop zero is the shared kitchen. This page does not geocode customer addresses.</p>
     {stops.map((p,i)=><div className="road-stop" key={p.id}>
      <div className="road-stop-head"><strong><span className="road-stop-index">{i===0?'K':i}</span>{i===0?'Depot / kitchen':`Delivery stop ${i}`}</strong>{i>0&&<button className="road-text-action" type="button" onClick={()=>{setStops(s=>s.filter((_,j)=>i!==j));resetResult()}}>Remove</button>}</div>
      <label className="road-label">Label<input value={p.label} maxLength={38} onChange={e=>edit(i,'label',e.target.value)}/></label>
      <div className="road-fields"><label>Latitude<input type="number" step="0.000001" value={p.lat} onChange={e=>edit(i,'lat',e.target.value)}/></label><label>Longitude<input type="number" step="0.000001" value={p.lng} onChange={e=>edit(i,'lng',e.target.value)}/></label></div>
     </div>)}
     <div className="restaurant-actions"><button type="button" className="restaurant-secondary" onClick={addStop} disabled={stops.length>=8}>+ Add sample stop</button></div>
     <label className="road-consent"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);resetResult()}}/><span>I understand that requesting road routes or opening the map sends these coordinates to external OSRM / OpenStreetMap services. I am using only non-sensitive sample locations.</span></label>
     <button className="restaurant-button road-main-action" disabled={working||riders*capacity<stops.length-1||(mode==='road'&&!consent)} onClick={()=>void calculate()}>{working?'Calculating…':'Calculate route comparisons →'}</button>
     {riders*capacity<stops.length-1&&<p className="restaurant-error">The selected rider capacity cannot cover every stop.</p>}
    </section>
    <section className="road-results">
     <div className="restaurant-panel road-visual">
      <div className="road-section-head"><h2>02 · Route explorer</h2>{result&&<span className="road-pill">{result.mode==='road'?'Road-distance matrix':'Simulation'}</span>}</div>
      {result&&current?<>
       <div className="road-plan-controls" role="group" aria-label="Select route algorithm">{(Object.keys(names) as PlanName[]).map(key=><button type="button" key={key} className={selection===key?'selected':''} onClick={()=>changeChoice(key)}>{names[key]}</button>)}</div>
       <div className="road-illustration"><svg viewBox="0 0 660 330" role="img" aria-label="Diagram connecting the selected simulated or road-matrix stops" preserveAspectRatio="xMidYMid meet"><defs><pattern id="roadGrid" width="33" height="33" patternUnits="userSpaceOnUse"><path d="M33 0H0V33" fill="none" stroke="#e2d9ca" strokeWidth="1"/></pattern></defs><rect width="660" height="330" fill="url(#roadGrid)" rx="14"/>
        {(()=>{const lon=result.points.map(p=>p.lng),lat=result.points.map(p=>p.lat),xmin=Math.min(...lon),xmax=Math.max(...lon),ymin=Math.min(...lat),ymax=Math.max(...lat);const get=(i:number)=>({x:40+(result.points[i].lng-xmin)/Math.max(.005,xmax-xmin)*580,y:300-(result.points[i].lat-ymin)/Math.max(.005,ymax-ymin)*270});return <>{current.routes.map((route,k)=><polyline key={k} points={route.indices.map(i=>{const p=get(i);return `${p.x},${p.y}`}).join(' ')} fill="none" stroke={['#db4b28','#326a55','#dba02b'][k%3]} strokeWidth="4" strokeDasharray="9 9" strokeLinecap="round"/>) }{result.points.map((node,i)=>{const p=get(i);return <g key={node.id}><circle cx={p.x} cy={p.y} r="14" fill={i===0?'#273628':'#df512c'} stroke="white" strokeWidth="2"/><text x={p.x} y={p.y+4} fontSize="11" fontWeight="750" textAnchor="middle" fill="white">{i===0?'K':i}</text></g>})}</>})()}
       </svg><p>Connectors show stop order only, not streets. Open the map for tiles and optional road geometry.</p></div>
       <div className="road-summary"><div><span>Total routed travel</span><strong>{asDuration(current.totalSeconds)}</strong></div><div><span>Route distance</span><strong>{asDistance(current.totalMeters)}</strong></div><div><span>Difference vs Greedy</span><strong>{difference.toFixed(1)}%</strong></div></div>
       <div className="road-section-head"><h3>Interactive map</h3><button className="restaurant-secondary" disabled={!consent||fetchingGeometry} onClick={()=>void loadMap()}>{fetchingGeometry?'Loading road paths…':mapVisible?'Refresh map / road lines':'Show interactive map'}</button></div>
       {mapVisible&&<><RoadMap points={result.points} plan={current} roadGeometry={geometry} mode={result.mode}/><p className="road-help">Dashed map lines are straight connectors, not roads. Solid lines are OSRM road geometry. © OpenStreetMap contributors.</p></>}
      </>:<div className="road-empty"><div className="road-empty-icon">↗</div><h3>Every great delivery starts with a route.</h3><p>Choose your demo locations, then calculate to see Greedy, exact DP and a limited multi-rider plan.</p></div>}
      {error&&<p className="restaurant-error" role="alert">{error}</p>}
     </div>
     {result&&current&&<div className="restaurant-panel road-analysis"><div className="road-section-head"><h2>03 · Algorithm analysis</h2><span className="road-pill">Read-only</span></div>
      <div className="road-table"><div className="road-table-head"><span>Algorithm</span><span>Travel time</span><span>Distance</span></div>{(Object.keys(names) as PlanName[]).map(k=><button key={k} className={selection===k?'road-table-selected':''} onClick={()=>changeChoice(k)}><span>{names[k]}</span><strong>{asDuration(result.plans[k].totalSeconds)}</strong><span>{asDistance(result.plans[k].totalMeters)}</span></button>)}</div>
      <div className="road-itinerary">{current.routes.map((r,i)=><div key={i}><strong>Rider {i+1}</strong><span>{r.indices.length===2?'No assigned stops':r.indices.map(k=>result.points[k].label).join(' → ')}</span><small>{asDuration(r.seconds)} · {asDistance(r.meters)}</small></div>)}</div>
      <p className="road-help"><strong>Matrix source:</strong> {result.source}. Each route returns to its original depot. The fleet heuristic minimizes approximate total travel time, not rider fairness or a guaranteed optimum. Held–Karp is optimal only for a single tour of these small samples.</p>
     </div>}
    </section>
   </div>
   <div className="road-disclaimer"><strong>Development sandbox only.</strong> No live customer geocoding, traffic feeds, location tracking, real rider navigation, address storage, time windows, pickup precedence, order batching, or dispatch writes are performed here. The rider dashboard and existing single-order assignment system remain separate.</div>
  </main>
 </div>
}
