export type SampleStop={id:string;label:string;lat:number;lng:number};
export type RoadRoute={indices:number[];seconds:number;meters:number};
export type RoadPlan={method:string;routes:RoadRoute[];totalSeconds:number;totalMeters:number};
export type PlanName='greedy'|'twoOpt'|'exact'|'fleet';
export type RoadResponse={mode:'road'|'simulation';points:SampleStop[];source:string;objective:string;caveat:string;createdAt:string;plans:Record<PlanName,RoadPlan>};
export type GeometryResponse={coordinates:number[][];source:string;distanceMeters:number;durationSeconds:number};
