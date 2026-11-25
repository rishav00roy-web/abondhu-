import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { btn, Container, Eyebrow } from "./ui";

const STEPS = [
  { title: "Separate", body: "Keep peels and food scraps apart from plastic, glass and metal." },
  { title: "Add and balance", body: "Put them in the bucket with some dry leaves or paper. Keep it moist, not wet." },
  { title: "Use or sell", body: "Feed it to your plants. Made more than you need? Abondhu buys the extra." },
];

const ASK_URL = `${WHATSAPP_URL}?text=${encodeURIComponent("Hi Abondhu, I want to know about the compost kit.")}`;

/** Abondhu sells the compost kit; people compost at home and Abondhu buys back their surplus compost. */
export function CompostKit() {
  return (
    <section id="compost" className="scroll-mt-20 bg-cream py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <Reveal className="relative lg:mb-10 lg:mr-10">
          <Image
            src="/compost-kit.webp"
            alt="Abondhu compost kit: green compost bucket with a tap, strainer, box and user guide"
            width={1200}
            height={1200}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="h-auto w-full border border-navy/10"
          />
          {/* In use: sits on the empty corner of the product shot */}
          <Image
            src="/compost-in-use.webp"
            alt="Peels going into the compost bucket in a home kitchen"
            width={800}
            height={800}
            sizes="(min-width: 1024px) 16vw, 34vw"
            className="absolute bottom-3 right-3 h-auto w-[34%] border-4 border-white shadow-xl shadow-navy/20 lg:-bottom-10 lg:-right-10 lg:w-[38%]"
          />
        </Reveal>

        <div className="grid content-start gap-6">
          <Reveal className="grid gap-5">
            <Eyebrow>Abondhu compost kit</Eyebrow>
            <h2 className="font-serif text-[clamp(34px,4.2vw,52px)] leading-[1.08] text-navy">
              Make your own compost. <span className="italic text-forest">We buy the extra.</span>
            </h2>
            <p className="max-w-[46ch] text-[17px] font-light leading-relaxed text-muted">
              Buy the Abondhu compost kit and turn kitchen peels and food scraps into compost at home. Use it for your
              plants, and sell us whatever you don&apos;t need. The kit has a compost bucket with a tap, a strainer and a
              simple user guide.
            </p>
          </Reveal>

          <Stagger as="ol" className="grid gap-px overflow-hidden border border-navy/10 bg-navy/10 sm:grid-cols-3">
            {STEPS.map(({ title, body }, i) => (
              <StaggerItem as="li" key={title} className="grid content-start gap-2 bg-white p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-forest">Step {i + 1}</span>
                <h3 className="font-serif text-xl text-navy">{title}</h3>
                <p className="text-sm font-light leading-relaxed text-muted">{body}</p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <a href={ASK_URL} target="_blank" rel="noopener noreferrer" className={cn(btn.base, btn.primary)}>
              Get the kit <ArrowRight className="size-4" aria-hidden />
            </a>
            <span className="text-sm font-light text-muted">Price, delivery and buy-back on WhatsApp.</span>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
