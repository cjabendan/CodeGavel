import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  allowedDevOrigins: ["192.168.*.*", "192.168.*.*:3000", "192.170.*.*", "192.170.*.*:3000", "localhost:3000"],
};

export default nextConfig;
