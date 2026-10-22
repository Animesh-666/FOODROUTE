import { useEffect, useRef, useState } from 'react';
import { useDemoCart } from '../cart/useDemoCart';
import { totalItems } from '../cart/cart';
import { foods } from './catalog';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { Ribbon, StorySection, HowItWorks, ClosingSections } from './components/StaticSections';
import { CartDialogs } from './components/CartDialogs';

export default function LandingPage() {
  const { cart, increment, decrement, remove } = useDemoCart();
  const cartRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  function add(id: number) {
    if ((cart[id] ?? 0) >= 99) { setMessage('Maximum quantity reached for this dish'); return; }
    increment(id);
    const item = foods.find((food) => food.id === id);
    if (item) setMessage(`${item.name} added to your bag`);
  }

  return <div id="top">
    <a className="skip" href="#menu">Skip to menu</a>
    <Header count={totalItems(cart)} onOpenCart={() => cartRef.current?.showModal()} />
    <main>
      <Hero />
      <Ribbon />
      <MenuSection onAdd={add} />
      <StorySection />
      <HowItWorks />
      <ClosingSections />
    </main>
    <CartDialogs cart={cart} cartRef={cartRef} onAdd={add} onDecrease={decrement} onRemove={remove} />
    <div className={`toast${message ? ' show' : ''}`} role="status" aria-live="polite">{message}</div>
  </div>;
}
