import path from "node:path";
import type { NextConfig } from "next";


const nextConfig: NextConfig = {
	turbopack: {
		root: path.resolve(__dirname, "../../"),
	},
	allowedDevOrigins: ["192.168.1.15:3000", "192.168.1.15", "localhost:3000"],
};

export default nextConfig;
