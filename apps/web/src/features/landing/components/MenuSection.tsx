import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { categories, filterFoods, foods, formatPrice, type FilterCategory } from '../catalog';

export function MenuSection({ onAdd }: { onAdd: (id: number) => void }) {
  const [filter, setFilter] = useState<FilterCategory>('All');
  const [search, setSearch] = useState('');
  const shown = useMemo(() => filterFoods(foods, filter, search), [filter, search]);

  return (
    <section className="menu-section section" id="menu">
      <div className="section-heading">
        <div><p className="eyebrow">THE GOOD STUFF</p><h2>Meet your next <em>favourite.</em></h2></div>
        <p>A little comfort. A little adventure.<br />Something for every kind of craving.</p>
      </div>
      <div className="menu-tools">
        <div className="filters" role="group" aria-label="Filter menu">
          {categories.map((category) => <button key={category.value} type="button"
            aria-pressed={filter === category.value} className={filter === category.value ? 'selected' : ''}
            onClick={() => setFilter(category.value)}>{category.label}</button>)}
        </div>
        <label className="search-label">
          <span className="sr-only">Search menu</span><span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your favourite" />
        </label>
      </div>
<div className="live-restaurant-callout">Our original eight-dish showcase is a design demo. <Link to="/restaurants">Explore real restaurant menus →</Link></div>
      <p className="menu-result-count" role="status" aria-live="polite">{shown.length === 1 ? '1 dish available' : `${shown.length} dishes available`}</p>
      {shown.length ? (
        <div className="menu-grid">
          {shown.map((item) => <article className="food-card" key={item.id}>
            <div className="card-picture">
              <img src={item.image} alt={item.name} width={500} height={430} loading="lazy" />
              <span className="food-type">{item.veg ? 'Vegetarian' : 'Chicken'}</span>
              <button className="add-button" type="button" onClick={() => onAdd(item.id)} aria-label={`Add ${item.name} to bag`}>+</button>
            </div>
            <p className="card-caption">{item.tag}</p>
            <h3>{item.name}<span>{formatPrice(item.price)}</span></h3>
            <p>{item.description}</p>
          </article>)}
        </div>
      ) : <p>No matches yet. Try another craving.</p>}
    </section>
  );
}
