import { robotsTxt } from "@/lib/agent-text";

// Built once at build time; the text only changes when the code does.
export const dynamic = "force-static";

export function GET() {
  return new Response(robotsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
