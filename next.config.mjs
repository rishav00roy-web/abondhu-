// Stop the build when a key was pasted as the hidden dots a dashboard shows (e.g. "eyJhbGci••••").
// A failed build keeps the last working version live, instead of shipping a site where login silently breaks.
const MUST_BE_PLAIN = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "AADHAAR_KEY", "SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
const broken = MUST_BE_PLAIN.filter((k) => /[^\x20-\x7E]/.test(process.env[k] ?? ""));
if (broken.length) {
  throw new Error(`These environment variables hold hidden dots or odd characters, not the real value: ${broken.join(", ")}. Paste the real values and build again.`);
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Agents that ask for Markdown get the homepage as Markdown (src/app/index.md) instead of HTML.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }], destination: "/index.md" }],
    };
  },
  async headers() {
    return [
      {
        // RFC 8288 Link header: points agents at the site summary and the Markdown homepage.
        source: "/",
        headers: [
          { key: "Link", value: '</llms.txt>; rel="describedby"; type="text/plain", </index.md>; rel="alternate"; type="text/markdown"' },
          { key: "Vary", value: "Accept" },
        ],
      },
    ];
  },
};

export default nextConfig;
