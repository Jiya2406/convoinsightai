import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prisma must run only on the server; keep it out of the client bundle.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Pin the workspace root to this project. A stray package-lock.json in the
  // user's home folder made Next.js guess the wrong root; this silences it.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
