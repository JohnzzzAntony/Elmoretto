import type { Metadata } from "next";
import { MotionPlate } from "../motion-plate";
import { Footer, Navigation } from "../navigation";
import { products, shopUrl } from "../products";
import { scenes } from "../scenes";

export const metadata: Metadata = { title: "Our Coffee", description: "Amalfi, Sorrento and Positano: El Moretto's signature coffee-bean blends, from 100% Arabica to a strong Arabica and Robusta classic." };

export default function Coffee() {
  return <>
    <Navigation solid />
    <main className="editorial">
      <header className="editorial-intro editorial-feature">
        <div>
          <p className="kicker"><span className="kicker-rule" /> Our coffee</p>
          <h1>From harvest <em>to happiness.</em></h1>
          <p className="editorial-deck">Three signature bean blends, selected for aroma, flavour and freshness, and roasted for the way you brew.</p>
          <a className="button" href="#collection">See the collection <span aria-hidden="true">↓</span></a>
        </div>
        <figure className="editorial-plate editorial-plate--coffee">
          <MotionPlate name={scenes[6].visual} alt={scenes[6].alt} priority />
          <figcaption><span>Plate 07</span><span>The final reveal</span></figcaption>
        </figure>
      </header>
      <section className="range" id="collection" aria-labelledby="collection-title">
        <div className="section-heading">
          <h2 id="collection-title">The collection.</h2>
          <a className="text-link" href={shopUrl} target="_blank" rel="noopener">All products <span aria-hidden="true">↗</span></a>
        </div>
        <ul className="range-grid">
          {products.map((product) => (
            <li className="range-card" key={product.id}>
              <div className="range-plate">
                {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
                <img src={product.image} alt={`El Moretto ${product.name} coffee beans bag`} width={product.width} height={product.height} loading="lazy" />
              </div>
              <p className="kicker">{product.strength} · {product.blend}</p>
              <h3>{product.name}</h3>
              <p>{product.notes}</p>
              <p className="range-buy"><strong>{product.price}</strong><a className="button" href={product.url} target="_blank" rel="noopener">Buy now <span aria-hidden="true">↗</span></a></p>
            </li>
          ))}
        </ul>
      </section>
    </main>
    <Footer />
  </>;
}
