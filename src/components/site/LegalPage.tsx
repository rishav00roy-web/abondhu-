import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/site-data";
import { Nav } from "./Nav";
import { Footer } from "./Sections";
import { Container, Eyebrow } from "./ui";

/** Plain text page (about, privacy, terms): one column of short sections. */
export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main id="main" className="bg-cream pb-16 pt-28 sm:pb-24 sm:pt-36">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-4 font-serif text-4xl text-navy md:text-5xl">{title}</h1>
            <div className="mt-10 grid gap-8 text-[16px] leading-relaxed text-ink/80 [&_a]:font-semibold [&_a]:text-forest [&_a]:underline [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-navy [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
              {children}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </MotionConfig>
  );
}

export const EmailLink = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
