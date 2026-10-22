import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {dispatchCall} from '../dispatch/dispatch.service';
import {RoadMap} from './RoadMap';
import type {PlanName,RoadResponse,SampleStop,GeometryResponse} from './route-types';
import './road-planner.css';
import './live-route-preview.css';

type Eligible={orderId:string;restaurantId:string;restaurantName:string;city:string;updatedAt:string|null;status:'ready_for_pickup'};
type EligibleReply={orders:Eligible[];queriedAt:string;limited:boolean};
type LiveReply=RoadResponse&{restaurantId:string;restaurantName:string;orderIds:string[];destinations:{index:number;orderId:string;city:string}[];previewFingerprint:string;verifiedAt:string;readOnly:true;dispatchReady:false;locationSource:string;warning:string};
type LatLng={lat:number;lng:number};
const kitchen:LatLng={lat:24.1032,lng:88.2517};
const DEMO_STOPS:LatLng[]=[{lat:24.1181,lng:88.2654},{lat:24.0961,lng:88.2741},{lat:24.0889,lng:88.2421},{lat:24.1115,lng:88.2295},{lat:24.1231,lng:88.2514},{lat:24.0922,lng:88.2263},{lat:24.0824,lng:88.2621}];
const LABELS:Record<PlanName,string>={greedy:'Greedy',twoOpt:'Greedy + 2-opt',exact:'Held–Karp',fleet:'Multi-rider'};
const formatSeconds=(seconds:number)=>seconds>=3600?`${(seconds/3600).toFixed(2)} hr`:`${(seconds/60).toFixed(1)} min`;
const short=(id:string)=>id.length>13?`${id.slice(0,7)}…${id.slice(-6)}`:id;
const errorMessage=(err:unknown)=>err instanceof Error?err.message:'Something went wrong.';

export function LiveOrderRoutePage(){
 const [orders,setOrders]=useState<Eligible[]>([]),[restaurantId,setRestaurantId]=useState(''),[selected,setSelected]=useState<string[]>([]);
 const [depot,setDepot]=useState<LatLng>(kitchen),[stopPositions,setStopPositions]=useState<Record<string,LatLng>>({});
 const [mode,setMode]=useState<'simulation'|'road'>('simulation'),[riders,setRiders]=useState(2),[capacity,setCapacity]=useState(3);
 const [confirmed,setConfirmed]=useState(false),[consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [result,setResult]=useState<LiveReply|null>(null),[algorithm,setAlgorithm]=useState<PlanName>('fleet');
 const [showMap,setShowMap]=useState(false),[geometry,setGeometry]=useState<Record<number,number[][]>>({}),[geometryBusy,setGeometryBusy]=useState(false);
 const restaurants=[...new Map(orders.map(o=>[o.restaurantId,o.restaurantName])).entries()];
 const eligible=orders.filter(o=>o.restaurantId===restaurantId);
 const plan=result?.plans[algorithm];
 function reset(){setResult(null);setShowMap(false);setGeometry({});setMessage('');}
 async function refresh(){
  setLoading(true);setError('');reset();setSelected([]);
  try{
   const reply=await dispatchCall<EligibleReply>('roads/eligible-orders',{});
   setOrders(reply.orders);setRestaurantId(old=>reply.orders.some(x=>x.restaurantId===old)?old:(reply.orders[0]?.restaurantId??''));
  }catch(e){setError(errorMessage(e))}finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[]);
 function selectRestaurant(id:string){setRestaurantId(id);setSelected([]);setStopPositions({});reset()}
 function toggleOrder(id:string,checked:boolean){
  if(checked&&selected.length>=7)return;
  if(checked){setStopPositions(p=>({...p,[id]:p[id]??DEMO_STOPS[selected.length]}));setSelected(ids=>[...ids,id])}
  else setSelected(ids=>ids.filter(x=>x!==id));
  reset();
 }
 function editPoint(id:string,key:'lat'|'lng',v:string){const n=Number(v);
  if(id==='depot')setDepot(p=>({...p,[key]:n}));else setStopPositions(p=>({...p,[id]:{...(p[id]??DEMO_STOPS[0]),[key]:n}}));
  reset();
 }
 const points:SampleStop[]=[{id:'depot',label:'Illustrative kitchen',...depot},...selected.map((id,i)=>({id:`stop${i+1}`,label:`Illustrative order ${i+1}`,...(stopPositions[id]??DEMO_STOPS[i])}))];
 async function preview(){setBusy(true);setError('');reset();
  try{
   const reply=await dispatchCall<LiveReply>('roads/live-preview',{restaurantId,orderIds:selected,points,riders,capacity,mode,
     sampleLocationsConfirmed:confirmed,externalConsent:consent});
   setResult(reply);setAlgorithm(riders>1?'fleet':'greedy');setMessage(`Preview verified at ${new Date(reply.verifiedAt).toLocaleTimeString()}. No dispatch was committed.`);
  }catch(e){setError(errorMessage(e))}finally{setBusy(false)}
 }
 async function displayMap(){if(!result||!plan)return;if(!consent){setError('Map tiles require external-coordinate disclosure consent.');return}
  setError('');setShowMap(true);setGeometry({});
  if(result.mode!=='road')return;
  setGeometryBusy(true);const found:Record<number,number[][]>={};
  for(let i=0;i<plan.routes.length;i++){
   try{if(plan.routes[i].indices.length>2){const reply=await dispatchCall<GeometryResponse>('roads/geometry',{points:result.points,indices:plan.routes[i].indices,externalConsent:true});found[i]=reply.coordinates}}
   catch(e){setError(`Some OSRM road geometry was unavailable: ${errorMessage(e)}. Dashed lines are straight connectors.`)}
  }
  setGeometry(found);setGeometryBusy(false);
 }
 return <div className="restaurant-page road-planner-page live-route-page">
  <div className="restaurant-top"><Link className="restaurant-brand" to="/">f↗ foodroute<span>.</span></Link><nav><Link to="/admin/route-planner">Sample planner</Link><Link to="/admin/dispatch">Dispatch desk</Link><Link to="/account">Account</Link></nav></div>
  <main className="restaurant-container dispatch-page road-content">
   <header className="restaurant-intro"><p className="eyebrow"><span/> PHASE 5C · LIVE ORDER AWARENESS</p><h1>Order-aware <em>routes.</em></h1>
    <p>Match real ready-for-pickup order IDs to <strong>illustrative</strong> map stops. Compare route candidates without using private customer coordinates or changing rider assignments.</p></header>
   <div className="live-banner" role="note"><strong>Read-only preview.</strong> Real order IDs, synthetic locations. The stop pins do not represent actual customer addresses. This page never dispatches, reserves a rider, or changes an order.</div>
   <div className="road-layout">
    <section className="restaurant-panel road-settings">
     <div className="road-section-head"><h2>01 · Ready orders</h2><button className="restaurant-secondary" type="button" disabled={loading} onClick={()=>void refresh()}>{loading?'Refreshing…':'Refresh orders'}</button></div>
     <p className="road-help">Only unassigned, ready-for-pickup orders from approved restaurants are listed. New orders might appear after refresh.</p>
     <label>Restaurant<select value={restaurantId} onChange={e=>selectRestaurant(e.target.value)} disabled={!restaurants.length}><option value="">{loading?'Loading…':'Select restaurant'}</option>{restaurants.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
     {!loading&&orders.length===0&&<div className="live-empty">No unassigned ready orders. Create a test checkout, then mark it ready for pickup in the restaurant dashboard.</div>}
     {eligible.map(o=><label className="live-order-option" key={o.orderId}>
      <input type="checkbox" checked={selected.includes(o.orderId)} disabled={!selected.includes(o.orderId)&&selected.length>=7} onChange={e=>toggleOrder(o.orderId,e.target.checked)}/>
      <span><strong>{short(o.orderId)}</strong><small>{o.city} · Ready / unassigned</small></span>
     </label>)}
     <div className="road-section-head"><h2>02 · Illustrative stops</h2><span className="road-pill">{selected.length} selected</span></div>
     <p className="road-help">Sample pins start near Berhampore. Edit them only with non-sensitive demonstration coordinates. They are never derived from customer street addresses.</p>
     {selected.length>0&&<>
       <div className="road-stop"><strong>Illustrative kitchen</strong><div className="road-fields"><label>Latitude<input type="number" step="0.000001" value={depot.lat} onChange={e=>editPoint('depot','lat',e.target.value)}/></label><label>Longitude<input type="number" step="0.000001" value={depot.lng} onChange={e=>editPoint('depot','lng',e.target.value)}/></label></div></div>
       {selected.map((id,i)=><div className="road-stop" key={id}><strong>Illustrative stop {i+1} · {short(id)}</strong><div className="road-fields"><label>Latitude<input type="number" step="0.000001" value={(stopPositions[id]??DEMO_STOPS[i]).lat} onChange={e=>editPoint(id,'lat',e.target.value)}/></label><label>Longitude<input type="number" step="0.000001" value={(stopPositions[id]??DEMO_STOPS[i]).lng} onChange={e=>editPoint(id,'lng',e.target.value)}/></label></div></div>)}
     </>}
     <div className="road-fields"><label>Travel source<select value={mode} onChange={e=>{setMode(e.target.value as 'simulation'|'road');reset()}}><option value="simulation">Offline simulation</option><option value="road">OSRM demo roads</option></select></label><label>Riders<select value={riders} onChange={e=>{setRiders(Number(e.target.value));reset()}}>{[1,2,3].map(x=><option key={x} value={x}>{x}</option>)}</select></label></div>
     <label>Max stops per rider<select value={capacity} onChange={e=>{setCapacity(Number(e.target.value));reset()}}>{[1,2,3,4,5,6,7].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
     <label className="road-consent"><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);reset()}}/> <span>I confirm that these are non-sensitive, fictitious example coordinates, not actual customer locations.</span></label>
     <label className="road-consent"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);reset()}}/> <span>I understand that OSRM road requests or opening the map will send these coordinates to external routing/map services.</span></label>
     <button className="restaurant-button road-main-action" type="button" disabled={busy||loading||!restaurantId||selected.length===0||!confirmed||(mode==='road'&&!consent)||riders*capacity<selected.length} onClick={()=>void preview()}>{busy?'Verifying live orders…':'Verify & preview routes →'}</button>
     {riders*capacity<selected.length&&<p className="restaurant-error">Add riders or increase stops per rider to cover selected orders.</p>}
     {error&&<p className="restaurant-error" role="alert">{error}</p>}{message&&<p className="live-message" role="status">{message}</p>}
    </section>
    <section className="road-results">
     <div className="restaurant-panel road-visual"><div className="road-section-head"><h2>03 · Verified route preview</h2>{result&&<span className="road-pill">{result.mode==='simulation'?'Simulation':'OSRM demo'}</span>}</div>
      {!result&&<div className="road-empty"><span className="road-empty-icon">↗</span><h3>Live orders, safer experiments.</h3><p>Select test orders on the left, map them to illustrative sample pins, and generate a read-only routing comparison.</p></div>}
      {result&&plan&&<>
       <p className="road-help">Restaurant: <strong>{result.restaurantName}</strong> · {result.orderIds.length} ready orders checked at {new Date(result.verifiedAt).toLocaleString()}.</p>
       <div className="road-plan-controls" role="group" aria-label="Select algorithm">{(Object.keys(LABELS) as PlanName[]).map(k=><button key={k} className={algorithm===k?'selected':''} onClick={()=>{setAlgorithm(k);setShowMap(false);setGeometry({})}}>{LABELS[k]}</button>)}</div>
       <div className="road-summary"><div><span>Estimated total travel</span><strong>{formatSeconds(plan.totalSeconds)}</strong></div><div><span>Estimated distance</span><strong>{(plan.totalMeters/1000).toFixed(2)} km</strong></div><div><span>Assigned sample orders</span><strong>{plan.routes.reduce((a,r)=>a+r.indices.length-2,0)}</strong></div></div>
       <div className="road-itinerary">{plan.routes.map((route,i)=><div key={i}><strong>Illustrative rider {i+1}</strong><span>{route.indices.map(index=>index===0?'Demo kitchen':`Order ${short(result.orderIds[index-1]??'?')}`).join(' → ')}</span><small>{formatSeconds(route.seconds)} · {(route.meters/1000).toFixed(2)} km</small></div>)}</div>
       <div className="road-section-head live-map-actions"><h3>Interactive map</h3><button className="restaurant-secondary" disabled={!consent||geometryBusy} onClick={()=>void displayMap()}>{geometryBusy?'Fetching roads…':'Show map (external tiles)'}</button></div>
       {showMap&&<RoadMap points={result.points} plan={plan} roadGeometry={geometry} mode={result.mode}/>}
       <p className="road-help"><strong>Checked snapshot:</strong> {result.previewFingerprint} · This is not a dispatch token. Refresh and recheck live order status before any separate dispatch action.</p>
      </>}
     </div>
     <div className="restaurant-panel live-explainer"><h2>04 · What this proves</h2><p>Order records are checked server-side for restaurant match, readiness, and no existing assignment. Routing uses intentionally illustrative positions; no customer address is geocoded, shared with OSRM, or stored as a GPS coordinate.</p><p><strong>Future:</strong> verified, consented delivery pins; time-window and vehicle constraints; versioned optimization preview & trusted transaction commit. Current live dispatch remains single-order.</p></div>
    </section>
   </div>
  </main>
 </div>
}
