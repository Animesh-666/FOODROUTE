import { useEffect,useMemo,useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { subscribeMenu,subscribeRestaurant } from './restaurant.service';
import { money, type MenuItem, type Restaurant } from './restaurant.types';
import './restaurants.css';
import { useLiveCart } from '../orders/live-cart';
import '../orders/orders.css';
export function RestaurantMenuPage(){
  const {restaurantId}=useParams();const {cart,add}=useLiveCart();const [restaurant,setRestaurant]=useState<Restaurant|null>(null);
  const [items,setItems]=useState<MenuItem[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');const [category,setCategory]=useState('All');
  useEffect(()=>{if(!restaurantId)return;setLoading(true);setError('');const a=subscribeRestaurant(restaurantId,v=>{setRestaurant(v);setLoading(false)},e=>{setError(e.message);setLoading(false)});return a},[restaurantId]);
  useEffect(()=>{if(!restaurantId||!restaurant?.approved||restaurant.status!=='active')return;const unsubscribe=subscribeMenu(restaurantId,true,setItems,e=>setError(e.message));return unsubscribe},[restaurantId,restaurant?.approved,restaurant?.status]);
  const categories=useMemo(()=>['All',...new Set(items.map(x=>x.category))],[items]);
  const visible=items.filter(item=>item.available&&(category==='All'||item.category===category)&&`${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="restaurant-page"><div className="restaurant-top"><Link to="/" className="restaurant-brand">f↗ foodroute<span>.</span></Link><Link to="/restaurants">← All restaurants</Link></div>
    <main className="restaurant-container">
      {loading?<p role="status">Loading this kitchen…</p>:error?<p role="alert" className="restaurant-error">{error}</p>:!restaurant||!restaurant.approved||restaurant.status!=='active'?<div className="restaurant-empty">This restaurant is not currently available. <Link to="/restaurants">Browse other restaurants</Link></div>:<>
        <header className="restaurant-intro"><p className="eyebrow"><span/> {restaurant.cuisine.toUpperCase()} · {restaurant.city.toUpperCase()}</p><h1>{restaurant.name}<em>.</em></h1><p>{restaurant.description}</p></header>
        <div className="restaurant-toolbar"><label className="restaurant-field">Find a dish<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this menu" /></label><label className="restaurant-field">Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>
        <p className="restaurant-note">Live restaurant dishes · Cash on delivery is available through our development checkout.</p>
        {cart&&<div className="order-cart-banner"><strong>{cart.lines.reduce((sum,x)=>sum+x.quantity,0)} items in your bag · {cart.restaurantName}</strong><Link to="/checkout">Review bag and checkout →</Link></div>}
        {visible.length?<div className="restaurant-menu-grid">{visible.map(item=><article className="restaurant-food" key={item.id}><div className="restaurant-food-image">{item.imageUrl?<img src={item.imageUrl} alt={item.name} loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<span aria-hidden="true">✦</span>}</div><div className="restaurant-food-body"><span className="restaurant-eyebrow">{item.category} · {item.vegetarian?'Vegetarian':'Non-vegetarian'}</span><h2>{item.name}</h2><p>{item.description}</p><strong>{money(item.pricePaise)}</strong><button className="restaurant-button order-add" type="button" onClick={()=>add(restaurant.id,restaurant.name,item.id)}>Add to bag +</button></div></article>)}</div>:<div className="restaurant-empty">No available dishes match this search.</div>}
      </>}
    </main></div>
}
