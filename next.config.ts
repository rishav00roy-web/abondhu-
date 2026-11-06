import type { NextConfig } from "next";

// `npm run export` builds a static copy (out/) for previews; normal builds stay server-capable.
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;
