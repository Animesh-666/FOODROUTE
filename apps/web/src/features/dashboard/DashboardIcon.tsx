import type { SVGProps } from 'react';
const paths:Record<string,string> = {
  home:'M3 10.5 12 3l9 7.5V21h-7v-7h-4v7H3z',
  store:'M4 10 5 4h14l1 6M4 10v10h16V10M8 20v-6h8v6',
  receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6M9 12h6',
  bag:'M4 8h16l-1 13H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3-6 8-6s8 2 8 6',
  route:'M5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM19 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8',
  map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
  layers:'m12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 18l9 5 9-5',
  chart:'M4 20V10m6 10V4m6 16v-8m5 8H2',
  menu:'M4 6h16M4 12h16M4 18h16',
  close:'M5 5l14 14M19 5 5 19',
  arrow:'M5 12h14m-6-6 6 6-6 6',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9ZM10 21h4',
  logout:'M10 4H4v16h6m5-4 4-4-4-4m4 4H9',
  clock:'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4v5l4 2',
  check:'M4 12l5 5L20 6',
  alert:'M12 3 2 21h20L12 3Zm0 6v5m0 3v1',
  refresh:'M20 8V4l-3 3a8 8 0 1 0 2.2 10M20 4h-6',
  heart:'M20 5a5 5 0 0 0-7 0l-1 1-1-1a5 5 0 0 0-7 7l8 9 8-9a5 5 0 0 0 0-7',
};
export function DashboardIcon({name,size=19,...props}:{name:string;size?:number}&SVGProps<SVGSVGElement>){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]??paths.home}/></svg>;
}
