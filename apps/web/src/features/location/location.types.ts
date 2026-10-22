export type Point={lat:number;lng:number};
export type ConfirmedPoint=Point&{confirmed:true};
export type LocationConfig={point:Point;radiusMeters:number;version:number;confirmation:'operator-confirmed'};
export type DeliveryLocation={pickup:Point;dropoff:Point;distanceMeters:number;radiusMeters:number;locationVersion:number;source:'haversine-service-area';confirmation:'customer-confirmed'};
