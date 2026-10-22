import type { ReactNode } from 'react';
import { DashboardIcon } from './DashboardIcon';
export function StatCard({label,value,detail,icon}: {label:string;value:string|number;detail:string;icon:string}) {
 return <article className="frd-stat"><div className="frd-stat-head"><span>{label}</span><span className="frd-stat-icon"><DashboardIcon name={icon} size={19}/></span></div><strong>{value}</strong><small>{detail}</small></article>;
}
export function Panel({title,subtitle,children,action}:{title:string;subtitle?:string;children:ReactNode;action?:ReactNode}){
 return <section className="frd-panel"><header className="frd-panel-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</header><div className="frd-panel-body">{children}</div></section>;
}
export function StatusPill({status}:{status:string}){
 const type = ['delivered','active','available','approved'].includes(status)?'ok':['rejected','suspended','failed'].includes(status)?'bad':['preparing','ready_for_pickup','accepted','picked_up'].includes(status)?'warm':'neutral';
 return <span className={`frd-pill frd-pill-${type}`}>{status.replaceAll('_',' ')}</span>;
}
export function EmptyState({title,detail,action}:{title:string;detail:string;action?:ReactNode}){
 return <div className="frd-empty"><div className="frd-empty-glyph"><DashboardIcon name="bag" size={25}/></div><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
export function LoadStatus(){return <div role="status" className="frd-skeleton"><span/><span/><span/></div>}
export function ErrorStatus({message}:{message:string}){return <p className="frd-error" role="alert"><DashboardIcon name="alert" size={18}/>{message}</p>}
