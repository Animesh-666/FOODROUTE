/** Private-coordinate synthetic matrix for bounded multi-stop comparisons, never a road ETA. */
import {distanceMeters,type Point} from '../location/location-domain';
import {multiRiderRoad as optimize,type RoadMatrix} from './road-routing';
export type DispatchRoute={riderUid:string;orderIds:string[];seconds:number;meters:number};
export function syntheticRoadMatrix(points:Point[]):RoadMatrix {
 const distances=points.map((a,i)=>points.map((b,j)=>i===j?0:Math.max(1,Math.round(distanceMeters(a,b)*1.3))));
 return {distances,durations:distances.map(row=>row.map(m=>m===0?0:Math.max(1,Math.round(m/7.8))))};
}
export const multiRiderRoad=optimize;
