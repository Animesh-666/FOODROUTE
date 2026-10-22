import type { Timestamp } from 'firebase/firestore';
export type LiveLine={itemId:string;quantity:number};
export type Address={line1:string;city:string;postalCode:string;note:string};
export type OrderRequest={restaurantId:string;lines:LiveLine[];address:Address;paymentMethod:'cod'};
export type ItemSnapshot={itemId:string;name:string;category:string;quantity:number;unitPricePaise:number;lineTotalPaise:number};
export type Quote={quoteId: string;restaurantId:string;items:ItemSnapshot[];subtotalPaise:number;deliveryFeePaise:number;totalPaise:number;currency:'INR';pricingMode:'demo-no-delivery-fee'};
export type Status='placed'|'accepted'|'preparing'|'ready_for_pickup'|'rejected'|'picked_up'|'delivered';
export type Order=Quote&{id:string;customerUid:string;status:Status;address:Address;payment:{method:'cod';status:'unpaid'};createdAt?:Timestamp;updatedAt?:Timestamp;assignedRiderUid?:string;activeRouteId?:string;assignmentStatus?:string};
export const nextStatuses:Partial<Record<Status,Status[]>>={placed:['accepted','rejected'],accepted:['preparing','rejected'],preparing:['ready_for_pickup']};
