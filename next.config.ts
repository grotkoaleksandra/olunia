import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // basePath is set to the GitHub repo name for GitHub Pages deployment
  // The setup skill (/setup-alpacapps-infra) will set this during setup
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
