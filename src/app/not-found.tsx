import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Sections";
import { btn, Container } from "@/components/site/ui";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main id="main" className="bg-sunk">
        <Container className="grid min-h-[60vh] content-center gap-6 py-24">
          <p className="font-mono text-sm text-faint tabular">404, 0.00 kg on the scale</p>
          <h1 className="max-w-[16ch] font-serif text-[clamp(38px,5vw,64px)] leading-[1.06] text-navy">
            Nothing on this page worth weighing.
          </h1>
          <p className="max-w-[44ch] font-light leading-relaxed text-muted">The link may be old. Your store room, on the other hand, probably isn&apos;t empty.</p>
          <Link href="/" className={cn(btn.base, btn.primary, "justify-self-start")}>Back to the home page</Link>
        </Container>
      </main>
      <Footer />
    </MotionConfig>
  );
}
