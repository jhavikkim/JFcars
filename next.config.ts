import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // JFcars is deployed as a compiled Cloudflare worker behind Nginx. Serving
  // uploaded and bundled media directly avoids routing every image through a
  // framework optimizer endpoint that is not available in that topology.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
