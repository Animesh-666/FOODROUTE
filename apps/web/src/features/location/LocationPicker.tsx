import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {dispatchCall} from '../dispatch/dispatch.service';
import type {ConfirmedPoint,Point} from './location.types';
import './location.css';
const PinMap=lazy(()=>import('./PinMap').then(m=>({default:m.PinMap})));
type Candidate=Point&{label:string;precision:string};
export function LocationPicker({query,onChange,initial,radiusMeters}:{query:string;onChange:(p:ConfirmedPoint|null)=>void;initial?:Point;radiusMeters?:number}){
 const [lat,setLat]=useState(initial?String(initial.lat):''),[lng,setLng]=useState(initial?String(initial.lng):'');
 const [confirmed,setConfirmed]=useState(false),[consent,setConsent]=useState(false),[mapConsent,setMapConsent]=useState(false),[results,setResults]=useState<Candidate[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useRef(0);useEffect(()=>()=>{request.current++},[]);
 const valid=lat.trim()!==''&&lng.trim()!==''&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&Math.abs(Number(lat))<=85&&Math.abs(Number(lng))<=180;
 const p=valid?{lat:Number(lat),lng:Number(lng)}:null;
 function edit(a:string,b:string){setLat(a);setLng(b);setConfirmed(false);onChange(null)}
 async function search(){const turn=++request.current;setBusy(true);setError('');setResults([]);try{const data=await dispatchCall<{results:Candidate[]}>('location/search',{query,externalConsent:consent});if(turn===request.current){setResults(data.results);if(!data.results.length)setError('No matches. Refine the street/city/PIN or enter coordinates manually.')}}catch(e){if(turn===request.current)setError(e instanceof Error?e.message:'Address search failed.')}finally{if(turn===request.current)setBusy(false)}}
 return <section className="location-picker" aria-label="Confirm geographic location"><h3>Confirm the entrance location</h3><p className="restaurant-note">Enter latitude and longitude from a trusted source. A search suggestion is not proof that the address is correct.</p>
 <div className="order-fields"><label>Latitude<input aria-label="Latitude" type="number" min={-85} max={85} step="any" value={lat} onChange={e=>edit(e.target.value,lng)}/></label><label>Longitude<input aria-label="Longitude" type="number" min={-180} max={180} step="any" value={lng} onChange={e=>edit(lat,e.target.value)}/></label></div>
 <label className="location-check"><input type="checkbox" checked={confirmed} disabled={!valid} onChange={e=>{setConfirmed(e.target.checked);onChange(e.target.checked&&p?{...p,confirmed:true}:null)}}/> I checked these coordinates against the entrance address.</label>
 <details><summary>Optional address search</summary><p className="restaurant-note">Only the address text below is sent to Geoapify when you press Search. Do not include a name, phone number or delivery note. Manual entry needs no provider key.</p><p className="location-query">{query||'Enter your address first.'}</p><label className="location-check"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);request.current++;setResults([]);setBusy(false)}}/> Send this address to Geoapify for this search.</label><button type="button" className="restaurant-secondary" disabled={busy||!consent||query.trim().length<8} onClick={()=>void search()}>{busy?'Searching…':'Search address'}</button>
 {error&&<p className="restaurant-error" role="alert">{error}</p>}<ul className="location-results">{results.map((r,i)=><li key={i}><button type="button" className="restaurant-secondary" onClick={()=>edit(String(r.lat),String(r.lng))}>{r.label}<small>Match type: {r.precision} · {r.lat.toFixed(5)}, {r.lng.toFixed(5)} — select, then confirm</small></button></li>)}</ul>{results.length>0&&<p className="restaurant-note">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · OpenStreetMap contributors</p>}</details>
 {p&&<><label className="location-check"><input type="checkbox" checked={mapConsent} onChange={e=>setMapConsent(e.target.checked)}/> Show OpenStreetMap tiles. This shares the map viewport with its tile server.</label>{mapConsent&&<Suspense fallback={<p>Loading map…</p>}><PinMap point={p} radiusMeters={radiusMeters} onPick={v=>edit(String(v.lat.toFixed(6)),String(v.lng.toFixed(6)))}/></Suspense>}</>}
 </section>;
}
