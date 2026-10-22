import {useEffect,useRef} from 'react';
import L from 'leaflet';import 'leaflet/dist/leaflet.css';import type {Point} from './location.types';
export function PinMap({point,radiusMeters,onPick}:{point:Point;radiusMeters?:number;onPick:(p:Point)=>void}){
 const el=useRef<HTMLDivElement>(null),callback=useRef(onPick);callback.current=onPick;
 useEffect(()=>{if(!el.current)return;const map=L.map(el.current,{scrollWheelZoom:false}).setView([point.lat,point.lng],14);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
 L.circleMarker([point.lat,point.lng],{radius:8,color:'#d84b23',fillOpacity:1}).addTo(map);
 if(radiusMeters&&radiusMeters>=100&&radiusMeters<=30000){const circle=L.circle([point.lat,point.lng],{radius:radiusMeters,color:'#58784c',fillOpacity:.12}).addTo(map);map.fitBounds(circle.getBounds());}
 map.on('click',(e:L.LeafletMouseEvent)=>callback.current({lat:e.latlng.lat,lng:e.latlng.lng}));return()=>{map.remove()};
 },[point.lat,point.lng,radiusMeters]);
 return <><div ref={el} className="location-map" role="region" aria-label="Location preview map"/><p className="restaurant-note">Click to adjust the entrance pin, or edit the coordinate fields using your keyboard. Circle shows straight-line radius, not road reachability.</p></>;
}
