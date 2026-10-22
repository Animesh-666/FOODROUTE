import { useEffect,useState,type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { MENU_CATEGORIES,money,restaurantDocId,type MenuItem, type MenuItemDraft,type Restaurant } from './restaurant.types';
import { saveMenuItem,subscribeMenu,subscribeRestaurant,unpublishMenuItem } from './restaurant.service';
import './restaurants.css';
import '../orders/orders.css';
const EMPTY:MenuItemDraft={name:'',description:'',category:'Burgers',pricePaise:19900,imageUrl:'',vegetarian:false,available:true,published:false};
export function RestaurantDashboard(){
  const {user}=useAuth();const restaurantId=user?restaurantDocId(user.uid):'';
  const [restaurant,setRestaurant]=useState<Restaurant|null>(null);const [items,setItems]=useState<MenuItem[]>([]);
  const [draft,setDraft]=useState<MenuItemDraft>({...EMPTY});const [price,setPrice]=useState('199');const [editId,setEditId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  useEffect(()=>{if(!restaurantId)return;return subscribeRestaurant(restaurantId,setRestaurant,e=>setError(e.message))},[restaurantId]);
  useEffect(()=>{if(!restaurant)return;return subscribeMenu(restaurantId,false,setItems,e=>setError(e.message))},[restaurant,restaurantId]);
  function edit(item:MenuItem){setDraft({name:item.name,description:item.description,category:item.category,pricePaise:item.pricePaise,imageUrl:item.imageUrl,vegetarian:item.vegetarian,available:item.available,published:item.published});setPrice((item.pricePaise/100).toString());setEditId(item.id);window.scrollTo({top:0,behavior:'smooth'})}
  function reset(){setDraft({...EMPTY});setPrice('199');setEditId(null)}
  async function save(e:FormEvent){e.preventDefault();setError('');setNotice('');setBusy(true);try{
    if(!/^\d+(\.\d{1,2})?$/.test(price)){throw new Error('Enter a valid rupee amount with at most two decimals.')}
    await saveMenuItem(restaurantId,{...draft,pricePaise:Math.round(Number(price)*100)},editId??undefined);
    setNotice(editId?'Dish updated.':'Dish created.');reset();
  }catch(e){setError(e instanceof Error?e.message:'Could not save menu item.')}finally{setBusy(false)}}
  async function archive(item:MenuItem){if(!window.confirm(`Unpublish ${item.name}? You can edit and republish it later.`))return;setBusy(true);try{await unpublishMenuItem(restaurantId,item.id);setNotice('Dish unpublished.')}catch(e){setError(e instanceof Error?e.message:'Could not unpublish dish.')}finally{setBusy(false)}}
  return <div className="restaurant-page"><div className="restaurant-top"><Link to="/" className="restaurant-brand">f↗ foodroute<span>.</span></Link><nav><Link to="/restaurant/orders">Incoming orders</Link><Link to="/account">My account</Link><Link to="/restaurants">Customer view</Link></nav></div><main className="restaurant-container">
    <header className="restaurant-intro"><p className="eyebrow"><span/> RESTAURANT WORKSPACE</p><h1>{restaurant?.name??'Your kitchen'}<em>.</em></h1><p>Manage your published and unavailable dishes. Manage your published dishes and track incoming orders. Rider dispatch and image uploads will follow in later phases.</p></header>
    <Link className="order-inline-link" to="/restaurant/orders">View incoming orders →</Link>
    {!restaurant?<div className="restaurant-empty">Loading your approved restaurant… If this persists, sign out and back in after approval.</div>:<>
      <div className="restaurant-dashboard-grid"><section className="restaurant-panel" aria-labelledby="menuFormTitle"><h2 id="menuFormTitle">{editId?'Edit dish':'Add a new dish'}</h2><form className="restaurant-form" onSubmit={save}>
        <label>Dish name<input required minLength={3} maxLength={90} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
        <label>Description<textarea required rows={3} minLength={5} maxLength={250} value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))}/></label>
        <label>Category<select value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value as MenuItemDraft['category']}))}>{MENU_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
        <label>Price (₹)<input required inputMode="decimal" type="text" value={price} onChange={e=>setPrice(e.target.value)} placeholder="199.00" /></label>
        <label>Image URL (HTTPS or /assets/)<input type="text" value={draft.imageUrl} onChange={e=>setDraft(d=>({...d,imageUrl:e.target.value}))} placeholder="https://example.com/dish.webp" /></label>
        <div className="restaurant-checks"><label><input type="checkbox" checked={draft.vegetarian} onChange={e=>setDraft(d=>({...d,vegetarian:e.target.checked}))}/> Vegetarian</label><label><input type="checkbox" checked={draft.available} onChange={e=>setDraft(d=>({...d,available:e.target.checked}))}/> In stock</label><label><input type="checkbox" checked={draft.published} onChange={e=>setDraft(d=>({...d,published:e.target.checked}))}/> Published publicly</label></div>
        {error&&<p className="restaurant-error" role="alert">{error}</p>}{notice&&<p className="restaurant-ok" role="status">{notice}</p>}
        <div className="restaurant-actions"><button disabled={busy} className="restaurant-button" type="submit">{busy?'Saving…':editId?'Update dish':'Add dish ↗'}</button>{editId&&<button type="button" className="restaurant-secondary" onClick={reset}>Cancel editing</button>}</div>
      </form></section>
      <section className="restaurant-panel"><h2>My menu <span className="restaurant-count">{items.length} items</span></h2><p className="restaurant-note">Drafts and out-of-stock items are visible only to your restaurant.</p>
        {items.length?<div className="restaurant-dash-list">{items.map(item=><article className="restaurant-dash-item" key={item.id}><div><strong>{item.name}</strong><p>{item.category} · {money(item.pricePaise)}</p><p>{item.published?'Published':'Draft'} · {item.available?'Available':'Out of stock'}</p></div><div className="restaurant-actions"><button type="button" className="restaurant-secondary" disabled={busy} onClick={()=>edit(item)}>Edit</button><button type="button" className="restaurant-secondary" disabled={busy||!item.published} onClick={()=>archive(item)}>Unpublish</button></div></article>)}</div>:<p>No dishes yet. Add your first menu item.</p>}
      </section></div>
    </>}
  </main></div>;
}
