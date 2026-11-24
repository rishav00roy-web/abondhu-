import { homeMarkdown } from "@/lib/agent-text";

// Also answers "/" for agents that ask for Markdown (see next.config.mjs). Rendered per request and
// marked no-store, so a shared cache can never hand this Markdown to a browser asking for the homepage.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(homeMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store", Vary: "Accept" },
  });
}
