import type { Metadata } from "next";
import { Footer } from "../navigation";
import { Reel } from "./reel";

export const metadata: Metadata = { title: "The Reel" };

export default function ReelPage() {
  return (
    <>
      <a className="skip-link" href="/story/">Skip to the readable story</a>
      <main id="main"><Reel /></main>
      <Footer />
    </>
  );
}
