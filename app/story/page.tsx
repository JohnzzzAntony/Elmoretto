/* eslint-disable @next/next/no-html-link-for-pages -- The static export uses document navigation without RSC prefetch requests. */
import type { Metadata } from "next";
import { MotionPlate } from "../motion-plate";
import { Footer, Navigation } from "../navigation";
import { chapterNumber, scenes } from "../scenes";
import { Visual } from "../visual";

export const metadata: Metadata = { title: "Our Story" };

// Story chapters that have a matching chapter in the scroll film on the home page.
const filmLinks = { origin: "origin", cherry: "cherry", process: "harvest", processing: "drum", roast: "fire", brew: "espresso", reveal: "sip" };

export default function Story() {
  return <>
    <Navigation solid />
    <main className="editorial">
      <header className="editorial-intro editorial-feature">
        <div>
          <p className="kicker"><span className="kicker-rule" /> The field notes</p>
          <h1>From the mountains <em>to your morning.</em></h1>
          <p className="editorial-deck">Follow coffee through seven chapters, from the first ripe cherry to the first sip.</p>
          <a className="button" href="/">Watch the scroll film <span aria-hidden="true">↗</span></a>
        </div>
        <figure className="editorial-plate">
          <MotionPlate name={scenes[0].visual} alt={scenes[0].alt} priority />
          <figcaption><span>Plate 01</span><span>The highlands</span></figcaption>
        </figure>
      </header>
      <section className="story-index" aria-labelledby="story-index-title">
        <div className="section-heading">
          <h2 id="story-index-title">Seven chapters.</h2>
          <p>From the highlands to the first sip</p>
        </div>
        <div className="story-grid">
          {scenes.map((scene, i) => (
            <article className="story-card" key={scene.id}>
              <Visual name={scene.visual} alt={scene.alt} />
              <div className="story-card-copy">
                <p className="kicker">Chapter {chapterNumber(i)}</p>
                <h3>{scene.label}</h3>
                <p>{scene.story}</p>
                {scene.id in filmLinks && (
                  <a className="text-link" href={`/#${filmLinks[scene.id as keyof typeof filmLinks]}`}>Watch this chapter <span aria-hidden="true">↗</span></a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
