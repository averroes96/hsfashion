import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from another device on the local Wi-Fi network (like a phone)
  // @ts-ignore - Next.js internal type missing in some versions
  allowedDevOrigins: ['192.168.1.16'],
  output: 'standalone',
};

export default nextConfig;
