import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  allowedDevOrigins: ["192.168.1.15:3000", "192.168.1.15", "192.170.60.182:3000", "192.170.60.182", "192.168.6.180:3000", "192.168.6.180", "192.168.18.18:3000", "192.168.18.18","localhost:3000"],
};

export default nextConfig;
