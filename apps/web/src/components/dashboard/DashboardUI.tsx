import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DashboardIcon } from './DashboardIcon';
import type { DashboardIconName } from './dashboard.config';

type StatusTone = 'good' | 'warning' | 'neutral' | 'danger';
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`frd-status frd-status--${tone}`}>{children}</span>;
}
export function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`frd-card ${className}`.trim()}>{children}</section>;
}
export function StatCard({ label, value, detail, icon, busy = false }: { label: string; value: string | number; detail: string; icon: DashboardIconName; busy?: boolean }) {
  return <DashboardCard className="frd-stat">
    <div className="frd-stat-top"><span>{label}</span><span className="frd-stat-icon"><DashboardIcon name={icon} size={19}/></span></div>
    {busy ? <span className="frd-skeleton" role="status" aria-label={`Loading ${label}`} /> : <strong className="frd-stat-value">{value}</strong>}
    <span className="frd-stat-detail">{detail}</span>
  </DashboardCard>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; to: string } }) {
  return <div className="frd-empty"><DashboardIcon name="sparkles" size={23}/><h3>{title}</h3><p>{description}</p>{action && <Link className="frd-primary" to={action.to}>{action.label} <DashboardIcon name="arrow" size={15}/></Link>}</div>;
}
export function DashboardTable<Row extends { id: string }>({ rows, columns, emptyLabel }: {
  rows: Row[];
  columns: { heading: string; render: (row: Row) => ReactNode }[];
  emptyLabel?: string;
}) {
  if (!rows.length) return <p className="frd-table-empty">{emptyLabel ?? 'No records to show.'}</p>;
  return <div className="frd-table-scroll"><table className="frd-table"><thead><tr>{columns.map(c=><th key={c.heading} scope="col">{c.heading}</th>)}</tr></thead>
    <tbody>{rows.map(r=><tr key={r.id}>{columns.map(c=><td key={c.heading}>{c.render(r)}</td>)}</tr>)}</tbody></table></div>;
}
