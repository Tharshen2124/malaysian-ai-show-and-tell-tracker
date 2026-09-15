import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  // Lets a phone reach the dev server through a `cloudflared` quick tunnel.
  // Wildcarded because a temporary tunnel gets a fresh random subdomain on
  // every restart — pinning one hostname means editing this file each time.
  // Dev-only: `next build` ignores it.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
