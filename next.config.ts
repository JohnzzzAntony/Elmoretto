import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  outputFileTracingRoot: process.cwd(),
  trailingSlash: true,
  devIndicators: false,
};

export default config;
