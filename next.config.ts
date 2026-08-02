import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/learn/**/*": ["./content/modules/**/*"],
  },
};

export default nextConfig;
