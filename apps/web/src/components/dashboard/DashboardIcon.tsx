import type { DashboardIconName } from './dashboard.config';

const icons: Record<DashboardIconName, string[]> = {
  grid:['M3 3h8v8H3z','M13 3h8v8h-8z','M3 13h8v8H3z','M13 13h8v8h-8z'],
  utensils:['M4 3v8a4 4 0 0 0 8 0V3','M8 3v18','M20 3v18','M16 3c0 5 0 8 4 8'],
  bag:['M4 8h16l-1 13H5L4 8Z','M9 9V6a3 3 0 0 1 6 0v3'],
  user:['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M4 21v-2a8 8 0 0 1 16 0v2'],
  store:['M3 10 5 3h14l2 7','M4 10v11h16V10','M2 10c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0','M9 21v-7h6v7'],
  chef:['M7 14a4 4 0 0 1-3-7 4 4 0 0 1 6-4 4 4 0 0 1 6 0 4 4 0 0 1 4 7 4 4 0 0 1-3 4','M7 14v6h10v-6'],
  bike:['M5 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M19 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M5 13l5-8 4 8h5','M10 5h3','M14 13l3-7'],
  route:['M5 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z','M19 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z','M5 6v5a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4','M15 3h3a3 3 0 0 1 0 6h-6'],
  map:['M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z','M9 3v15','M15 6v15'],
  check:['M20 6 9 17l-5-5'],
  users:['M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M2 21v-2a7 7 0 0 1 14 0v2','M16 4a4 4 0 0 1 0 8','M18 15a6 6 0 0 1 4 6'],
  sparkles:['M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z'],
  chart:['M4 20V5','M4 20h17','M8 16l4-5 4 3 4-7'],
  arrow:['M5 12h14','m13 6 6 6-6 6'],
  settings:['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z','M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2'],
  menu:['M4 6h16','M4 12h16','M4 18h16'],
  close:['M5 5l14 14','M19 5 5 19'],
  logout:['M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5','M15 16l4-4-4-4','M19 12H9'],
  shield:['M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-4Z','m9 12 2 2 4-4'],
  clock:['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z','M12 6v6l4 2'],
  bell:['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9','M10 21h4'],
  search:['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z','m17 17 5 5'],
};
export function DashboardIcon({ name, size = 20 }: { name: DashboardIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {icons[name].map((d, i) => <path key={`${name}-${i}`} d={d} />)}
  </svg>;
}
