/* eslint-disable @next/next/no-html-link-for-pages -- The static export uses document navigation without RSC prefetch requests. */
import { contact, shopUrl } from "./products";

export const site = { title: "El Moretto" };

function Wordmark() {
  return <a className="wordmark" href="/" aria-label="El Moretto home"><span className="logo" aria-hidden="true" /></a>;
}

const links = [
  ["/#origin", "The Journey"],
  ["/#products", "The Collection"],
  ["/story/", "Our Story"],
  ["/coffee/", "Our Coffee"],
] as const;

export function Navigation({ solid = false }: { solid?: boolean }) {
  return (
    <header className={solid ? "site-header site-header--solid" : "site-header"}>
      <Wordmark />
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <a className="nav-cta" href={shopUrl} target="_blank" rel="noopener">Shop online <span aria-hidden="true">↗</span></a>
      <details className="mobile-nav">
        <summary>Menu <span aria-hidden="true">+</span></summary>
        <nav aria-label="Mobile navigation">
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          <a href={shopUrl} target="_blank" rel="noopener">Shop online <span aria-hidden="true">↗</span></a>
        </nav>
      </details>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Wordmark />
        <p>Authentic Italian coffee, served with care. Founded in Dublin in 2016.</p>
      </div>
      <nav className="footer-col" aria-label="Footer">
        <p className="kicker">Explore</p>
        {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        <a href={shopUrl} target="_blank" rel="noopener">Shop online ↗</a>
      </nav>
      <address className="footer-col">
        <p className="kicker">Get in touch</p>
        <span>{contact.address}</span>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
        {contact.phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>)}
      </address>
      <p className="footer-legal">© {new Date().getFullYear()} El Moretto Café Limited <a href="#top">Back to top ↑</a></p>
    </footer>
  );
}
