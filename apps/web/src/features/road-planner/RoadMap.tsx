import { useEffect,useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RoadPlan, SampleStop } from './route-types';

type Props={points:SampleStop[];plan:RoadPlan;roadGeometry:Record<number,number[][]>;mode:'simulation'|'road'};
const ROUTE_COLORS=['#d94a24','#315f4b','#e6a02b'];
export function RoadMap({points,plan,roadGeometry,mode}:Props){
 const container=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  const el=container.current;if(!el)return;
  const map=L.map(el,{zoomControl:true,scrollWheelZoom:false});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
   attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:18
  }).addTo(map);
  const bound=L.latLngBounds([]);
  points.forEach((p,i)=>{
   const point=L.latLng(p.lat,p.lng);bound.extend(point);
   L.circleMarker(point,{radius:i===0?10:8,color:'#fff',weight:2,fillColor:i===0?'#243328':'#dc4c25',fillOpacity:1})
    .bindTooltip(`${i===0?'Depot':`Stop ${i}`} — ${p.label}`,{permanent:false,direction:'top'}).addTo(map);
  });
  plan.routes.forEach((route,rider)=>{
   const road=roadGeometry[rider];
   const validRoad=mode==='road'&&Array.isArray(road)&&road.length>=2;
   const coords=validRoad?road.map(([lng,lat])=>[lat,lng] as [number,number]):route.indices.map(i=>[points[i].lat,points[i].lng] as [number,number]);
   if(coords.length>=2)L.polyline(coords,{color:ROUTE_COLORS[rider%ROUTE_COLORS.length],weight:4,opacity:.88,
    dashArray:validRoad?undefined:'7 9'}).bindTooltip(`Rider ${rider+1} · ${validRoad?'OSRM road geometry':'Straight-line connectors, not roads'}`).addTo(map);
  });
  if(bound.isValid())map.fitBounds(bound.pad(.28),{maxZoom:14});
  return () => {
   map.remove();
  };
 },[points,plan,roadGeometry,mode]);
 return <div ref={container} className="road-map" role="region" aria-label="Interactive OpenStreetMap route planner"/>;
}
