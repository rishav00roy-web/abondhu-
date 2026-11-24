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
