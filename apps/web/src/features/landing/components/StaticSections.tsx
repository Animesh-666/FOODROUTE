export function StorySection() {
  return <section className="story section" id="story">
    <div className="story-image"><img src="/assets/bowl.jpg" alt="Colourful fresh vegetables and grains in a bowl" loading="lazy" /><span className="story-stamp">REAL FOOD<br />GOOD ENERGY<br />✳</span></div>
    <div><p className="eyebrow">NOT JUST ANOTHER BITE</p><h2>Good things.<br /><em>In every layer.</em></h2>
      <p>Crunch you can hear. Colour you can taste. We believe the best meals start with simple ingredients, put together with a little extra care.</p>
      <a className="primary" href="#menu">Taste the difference <span aria-hidden="true">↗</span></a>
    </div>
  </section>;
}

export function HowItWorks() {
  return <section className="how section" id="how">
    <p className="eyebrow">FROM YOUR FIRST CRAVING TO YOUR LAST BITE</p><h2>Your good-food <em>routine.</em></h2>
    <div className="steps">
      <article><span>01</span><h3>Follow your craving.</h3><p>Explore the menu. Find a favourite or discover something new.</p></article>
      <article><span>02</span><h3>Make it yours.</h3><p>Pick your quantity and build your perfect bag.</p></article>
      <article><span>03</span><h3>Enjoy the good stuff.</h3><p>Preview your bag. Intelligent dispatch and live checkout follow in the next build.</p></article>
    </div>
  </section>;
}

export function ClosingSections() {
  return <>
    <section className="last-call"><p>YOUR NEXT GREAT BITE IS WAITING.</p><h2>Go on. <em>Give in.</em></h2><a href="#menu" className="primary">Explore the menu ↗</a><span aria-hidden="true">✳</span></section>
    <footer><a className="brand" href="#top">foodroute.</a><p>Fresh food. Thoughtful journeys.</p><span>React + TypeScript frontend · Demo menu · 2026</span></footer>
  </>;
}

export function Ribbon() {
  return <div className="ribbon" aria-label="Freshly made, full of flavour, happiness delivered"><span>FRESHLY MADE</span><i>✳</i><span>FULL OF FLAVOUR</span><i>✳</i><span>HAPPINESS, DELIVERED</span><i>✳</i><span>FRESHLY MADE</span><i>✳</i></div>;
}
