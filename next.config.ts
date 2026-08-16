import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  ...(isGitHubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath: "/games",
        assetPrefix: "/games",
      }
    : {}),
};

export default nextConfig;
