import { CinematicExperience } from "./cinematic";
import { Footer } from "./navigation";
import { Reel } from "./reel/reel";
import { Visual } from "./visual";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="/story/">Skip to the readable story</a>
      <main id="main">
        <CinematicExperience />
        <Reel embedded />
        <section className="outro" aria-labelledby="outro-title">
          <p className="kicker"><span className="kicker-rule" />Beyond the cup</p>
          <h2 id="outro-title">A slower kind of <em>morning.</em></h2>
          <div className="outro-links">
            <a className="outro-card" href="/story/">
              <Visual name="cherry" />
              <span className="kicker">Field notes</span>
              <strong>Read the story <span aria-hidden="true">↗</span></strong>
              <span>Seven chapters, from the first ripe cherry to the first sip.</span>
            </a>
            <a className="outro-card" href="/coffee/">
              <Visual name="cup" />
              <span className="kicker">The collection</span>
              <strong>Find your blend <span aria-hidden="true">↗</span></strong>
              <span>Amalfi, Sorrento and Positano, from smooth 100% Arabica to a strong Italian classic.</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
