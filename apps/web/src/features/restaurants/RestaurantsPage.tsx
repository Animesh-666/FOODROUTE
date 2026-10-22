import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeApprovedRestaurants } from './restaurant.service';
import type { Restaurant } from './restaurant.types';
import './restaurants.css';
export function RestaurantsPage() {
  const [list,setList]=useState<Restaurant[]>([]);
  const [search,setSearch]=useState('');
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>subscribeApprovedRestaurants(data=>{setList(data);setBusy(false)},err=>{setError(err.message);setBusy(false)}),[]);
  const visible=list.filter(x=>`${x.name} ${x.city} ${x.cuisine}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="restaurant-page">
    <div className="restaurant-top"><Link to="/" className="restaurant-brand">f↗ foodroute<span>.</span></Link><nav><Link to="/">Home</Link><Link to="/account">My account</Link><Link to="/restaurant/apply">List your restaurant</Link><Link to="/rider/apply">Deliver with us</Link><Link to="/algorithm-lab">DAA Lab</Link></nav></div>
    <main className="restaurant-container">
      <div className="restaurant-intro"><p className="eyebrow"><span/> THE LOCAL GOOD STUFF</p><h1>Find your next <em>favourite.</em></h1><p>Discover approved FOODROUTE kitchens and explore their freshly published menus.</p></div>
      <label className="restaurant-field">Search restaurants<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by restaurant, cuisine or city" type="search" /></label>
      {busy ? <p role="status">Loading restaurants…</p> : error ? <p className="restaurant-error" role="alert">Couldn't load restaurants: {error}. Check Firestore rules and indexes.</p> : visible.length ? <div className="restaurant-grid">{visible.map(r=><Link key={r.id} to={`/restaurants/${r.id}`} className="restaurant-tile"><div className="restaurant-tile-visual" aria-hidden="true">✦</div><span className="restaurant-eyebrow">{r.cuisine} · {r.city}</span><h2>{r.name} ↗</h2><p>{r.description}</p><span className="restaurant-open">Approved kitchen · View menu</span></Link>)}</div>:<div className="restaurant-empty"><h2>No kitchens to show yet</h2><p>Restaurants will appear here once their applications are approved.</p><Link to="/restaurant/apply">Apply as a restaurant →</Link></div>}
    </main></div>;
}
