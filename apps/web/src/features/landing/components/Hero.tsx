import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { featuredFoods, type FoodItem } from '../catalog';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function Hero() {
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<FoodItem>(featuredFoods[0]);
  const [displayed, setDisplayed] = useState<FoodItem>(featuredFoods[0]);
  const [switching, setSwitching] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const rotation = useRef(0);
  const paused = userPaused || reducedMotion;

  useEffect(() => {
    if (selected.id === displayed.id) return;
    if (reducedMotion) { setDisplayed(selected); setSwitching(false); return; }
    const timer = window.setTimeout(() => { setDisplayed(selected); setSwitching(false); }, 160);
    return () => window.clearTimeout(timer);
  }, [selected, displayed.id, reducedMotion]);

  useEffect(() => () => { if (raf.current != null) cancelAnimationFrame(raf.current); }, []);
  function selectFood(food: FoodItem) {
    if (food.id === selected.id) return;
    setSwitching(!reducedMotion);
    setSelected(food);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (paused || event.pointerType === 'touch') return;
    const scene = sceneRef.current;
    if (!scene) return;
    const bounds = scene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      if (wrapRef.current) wrapRef.current.style.transform =
        `rotateY(${x * 18 + rotation.current}deg) rotateX(${-y * 12}deg) translate3d(${x * 12}px, ${y * 8}px, 0)`;
    });
  }
  function onPointerLeave() {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    if (wrapRef.current) wrapRef.current.style.transform = `rotateY(${rotation.current}deg)`;
  }
  function turn(degrees: number) {
    rotation.current += degrees;
    if (wrapRef.current) wrapRef.current.style.transform = `rotateY(${rotation.current}deg)`;
  }
  function toggleIngredients() {
    setIngredientsOpen((open) => !open);
    if (!ingredientsOpen && window.innerWidth < 700) {
      window.setTimeout(() => document.getElementById('ingredientDetail')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' }), 0);
    }
  }

  return (
    <section className={`hero${paused ? ' paused' : ''}`} aria-labelledby="heroTitle">
      <div className="hero-copy">
        <p className="eyebrow"><span /> GOOD FOOD. GREAT MOOD.</p>
        <h1 id="heroTitle">A little out<br />of the <em>ordinary.</em></h1>
        <p className="hero-description">Big flavours. Fresh ingredients. Your favourite bites,<br className="desktop" /> taking the scenic route to your doorstep.</p>
        <div className="hero-actions">
          <a className="primary" href="#menu">Find your flavour <span aria-hidden="true">↗</span></a>
          <button className="text-button" type="button" onClick={toggleIngredients}
            aria-expanded={ingredientsOpen} aria-controls="ingredientDetail">Peek at the ingredients <span aria-hidden="true">↓</span></button>
        </div>
        <div className="ingredient-detail" id="ingredientDetail" hidden={!ingredientsOpen}>
          <span className="ingredient-heading">IN THIS FEATURED DISH</span>
          <strong>{selected.name}</strong>
          <div className="ingredient-chips">
            {selected.description.split(' · ').map((part) => <span key={part}>{part}</span>)}
          </div>
        </div>
        <div className="hero-proof">
          <div className="rating-star" aria-hidden="true">✦</div>
          <p><strong>Made fresh. Never ordinary.</strong><br /><span>A better bite, from the very first layer.</span></p>
        </div>
      </div>
      <div ref={sceneRef} className={`hero-scene${ingredientsOpen ? ' expanded' : ''}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" />
        <span className="scene-word" aria-hidden="true">CRAVE</span>
        <div className="hero-food-wrap" ref={wrapRef}>
          <img className={`hero-food${!displayed.hero ? ' photo' : ''}${switching ? ' is-switching' : ''}`}
            src={displayed.hero ?? displayed.image} alt={`Featured dish: ${displayed.name}`} width={1024} height={1024} fetchPriority="high" />
        </div>
        <div className="ingredient-tag tag-top"><span className="small-dot" /> Real ingredients.<br /><strong>Unreal flavour.</strong></div>
        <div className="ingredient-tag tag-bottom"><span className="star-outline" aria-hidden="true">✧</span><span>THE CROWD FAVOURITE<strong>{selected.name}</strong></span></div>
        <div className="leaf leaf-one" aria-hidden="true" /><div className="leaf leaf-two" aria-hidden="true" />
        <span className="spark spark-one" aria-hidden="true">✳</span><span className="spark spark-two" aria-hidden="true">✦</span>
        <div className="scene-controls">
          <button type="button" onClick={() => turn(-12)} aria-label="Tilt food left">↶</button>
          <button type="button" onClick={() => setUserPaused((old) => !old)} aria-pressed={paused} disabled={reducedMotion}
            aria-label={reducedMotion ? 'Motion disabled by device preference' : undefined}>
            {paused ? 'Resume motion' : 'Pause motion'}
          </button>
          <button type="button" onClick={() => turn(12)} aria-label="Tilt food right">↷</button>
        </div>
      </div>
      <div className="hero-bottom">
        <span>01 / THE SIGNATURE COLLECTION</span>
        <div className="hero-selector" role="group" aria-label="Featured dishes">
          {featuredFoods.map((food, index) => <button key={food.id} type="button"
            className={selected.id === food.id ? 'selected' : ''} aria-pressed={selected.id === food.id}
            onClick={() => selectFood(food)}>{String(index + 1).padStart(2, '0')} <span>{food.name.replace('The ', '')}</span></button>)}
        </div>
        <a href="#menu" className="scroll-link">SCROLL TO DISCOVER ↓</a>
      </div>
    </section>
  );
}
