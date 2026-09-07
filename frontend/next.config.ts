import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // The repo has a backend package.json/lockfile one level up; pin the
    // workspace root to this frontend folder so Turbopack doesn't guess.
    root: path.join(__dirname),
  },
};

export default nextConfig;
