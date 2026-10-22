import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LiveLine } from './order.types';
export type CartState={restaurantId:string;restaurantName:string;lines:LiveLine[]};
type CartContextValue={cart:CartState|null;add:(restaurantId:string,restaurantName:string,itemId:string)=>void;setQuantity:(itemId:string,quantity:number)=>void;clear:()=>void};
const STORAGE_KEY='foodroute:live-cart:v1';
const Context=createContext<CartContextValue|null>(null);
export function parseCart(value:unknown):CartState|null {
 if(!value||typeof value!=='object')return null;
 const v=value as Partial<CartState>;
 if(typeof v.restaurantId!=='string'||!/^rest_[\w-]+$/.test(v.restaurantId)||typeof v.restaurantName!=='string'||!Array.isArray(v.lines))return null;
 const seen=new Set<string>();let lines:LiveLine[]=[];
 for(const line of v.lines.slice(0,20)){
  if(!line||typeof line.itemId!=='string'||!/^[\w-]+$/.test(line.itemId)||seen.has(line.itemId)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10)return null;
  seen.add(line.itemId);lines.push({itemId:line.itemId,quantity:line.quantity});
 }
 if(!lines.length)return null;
 return {restaurantId:v.restaurantId,restaurantName:v.restaurantName.slice(0,90),lines};
}
function initial():CartState|null {try{return parseCart(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}catch{return null}}
export function LiveCartProvider({children}:{children:ReactNode}){
 const [cart,setCart]=useState<CartState|null>(initial);
 function persist(next:CartState|null){setCart(next);try{next?localStorage.setItem(STORAGE_KEY,JSON.stringify(next)):localStorage.removeItem(STORAGE_KEY)}catch{/* storage disabled */}}
 function add(restaurantId:string,restaurantName:string,itemId:string){
  if(cart&&cart.restaurantId!==restaurantId&&!window.confirm(`Your bag contains dishes from ${cart.restaurantName}. Clear it and switch to ${restaurantName}?`))return;
  const current=cart?.restaurantId===restaurantId?cart.lines:[];
  const found=current.find(x=>x.itemId===itemId);
  if(found?.quantity===10){window.alert('Maximum 10 of each dish.');return;}
  if(!found&&current.length>=20){window.alert('Maximum 20 different dishes.');return;}
  persist({restaurantId,restaurantName,lines:found?current.map(x=>x.itemId===itemId?{...x,quantity:x.quantity+1}:x):[...current,{itemId,quantity:1}]});
 }
 function setQuantity(itemId:string,quantity:number){if(!cart)return;const lines=cart.lines.flatMap(x=>x.itemId!==itemId?[x]:quantity<1?[]:[{...x,quantity:Math.min(10,Math.floor(quantity))}]);persist(lines.length?{...cart,lines}:null)}
 const value=useMemo(()=>({cart,add,setQuantity,clear:()=>persist(null)}),[cart]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLiveCart(){const v=useContext(Context);if(!v)throw new Error('Live cart provider is missing.');return v}
