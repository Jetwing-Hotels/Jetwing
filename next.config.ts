import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep nodemailer out of the bundler — it's a Node-only lib used by API routes.
  serverExternalPackages: ['nodemailer'],
};

export default nextConfig;
