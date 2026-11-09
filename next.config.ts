import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    serverActions: {
      // The public host can differ from the proxy's x-forwarded-host.
      // Without this, every server action responds 500.
      allowedOrigins: ["expedientes-digitales.apps.grok.bot"],
    },
  },
};

export default nextConfig;
