import { useRef, type MouseEvent, type RefObject } from 'react';
import { foods, formatPrice } from '../catalog';
import { subtotal, type DemoCart } from '../../cart/cart';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

type Props = {
  cart: DemoCart;
  cartRef: RefObject<HTMLDialogElement | null>;
  onAdd: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
};

function closeWhenBackdropClicked(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return;
  const b = event.currentTarget.getBoundingClientRect();
  if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) {
    event.currentTarget.close();
  }
}

export function CartDialogs({ cart, cartRef, onAdd, onDecrease, onRemove }: Props) {
  const checkoutRef = useRef<HTMLDialogElement>(null);
  const reducedMotion = useReducedMotion();
  const selected = foods.filter((item) => cart[item.id]);
  const total = subtotal(cart, foods);

  function openOrderPreview() {
    cartRef.current?.close();
    checkoutRef.current?.showModal();
  }
  function browseMenu() {
    cartRef.current?.close();
    document.getElementById('menu')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  return <>
    <dialog id="cartDialog" ref={cartRef} aria-labelledby="cartTitle" onClick={closeWhenBackdropClicked}>
      <div className="drawer-head"><div><p className="eyebrow">GOOD CHOICES</p><h2 id="cartTitle">Your bag<span>.</span></h2></div>
        <button className="icon-button" type="button" aria-label="Close bag" onClick={() => cartRef.current?.close()}>×</button></div>
      <div id="cartItems">
        {selected.length ? selected.map((item) => <article className="cart-item" key={item.id}>
          <img src={item.image} alt="" loading="lazy" />
          <div><h3>{item.name}</h3><p>{formatPrice(item.price)}</p>
            <div className="quantity"><button type="button" onClick={() => onDecrease(item.id)} aria-label={`Decrease ${item.name} quantity`}>−</button>
              <span>{cart[item.id]}</span>
              <button type="button" onClick={() => onAdd(item.id)} aria-label={`Increase ${item.name} quantity`}>+</button></div>
          </div>
          <div><strong>{formatPrice(item.price * cart[item.id])}</strong><br />
            <button type="button" className="remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>Remove</button></div>
        </article>) : <div className="empty-cart"><h3>A little room for something good.</h3><p>Your bag is empty. Find your next favourite on the menu.</p><button type="button" className="primary" onClick={browseMenu}>Explore menu ↗</button></div>}
      </div>
      {selected.length > 0 && <div id="cartSummary">
        <div className="summary-row"><strong>Subtotal</strong><strong>{formatPrice(total)}</strong></div>
        <p className="summary-note">Demo menu prices. Delivery, taxes and payment integration will be added with live checkout.</p>
        <button className="primary" type="button" onClick={openOrderPreview}>Preview order <span aria-hidden="true">↗</span></button>
      </div>}
    </dialog>
    <dialog id="checkoutDialog" ref={checkoutRef} aria-labelledby="previewTitle" onClick={closeWhenBackdropClicked}>
      <button className="icon-button close-checkout" type="button" aria-label="Close order preview" onClick={() => checkoutRef.current?.close()}>×</button>
      <p className="eyebrow">ONE STEP CLOSER</p><h2 id="previewTitle">Your order <em>preview.</em></h2>
      <p>This is an interactive frontend demo. No payment is collected and no order is sent.</p>
      <div id="orderPreview">
        {selected.map((item) => <div className="summary-row" key={item.id}>
          <span>{cart[item.id]} × {item.name}</span><strong>{formatPrice(item.price * cart[item.id])}</strong></div>)}
        <hr /><div className="summary-row"><strong>Subtotal</strong><strong>{formatPrice(total)}</strong></div>
      </div>
      <button className="primary" type="button" onClick={() => checkoutRef.current?.close()}>Keep exploring ↗</button>
    </dialog>
  </>;
}
