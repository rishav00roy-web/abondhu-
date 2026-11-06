import { ArrowRight } from "lucide-react";
import { AREAS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { btn, Container } from "./ui";
import { WeighingReceipt } from "./WeighingReceipt";

export function Hero() {
  return (
    <section className="pb-16 pt-[clamp(40px,7vw,96px)]">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid min-w-0 gap-7">
          <h1 className="text-[clamp(40px,6vw,72px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Sell your scrap without leaving home.
          </h1>
          <p className="max-w-[44ch] text-lg leading-relaxed text-muted">
            Doorstep pickup across Assam. We weigh everything in front of you and pay before we leave.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#book" className={cn(btn.base, btn.primary)}>
              Book a free pickup <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href="#rates" className="text-[15px] font-medium underline decoration-line hover:decoration-ink">
              See today&apos;s rates
            </a>
          </div>
          <p className="text-sm text-faint">
            Now in {AREAS.map((a) => a.city).slice(0, -1).join(", ")} and {AREAS[AREAS.length - 1].city}.
          </p>
        </div>
        <WeighingReceipt />
      </Container>
    </section>
  );
}
