import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Profile pictures for GitHub and Google accounts.
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
