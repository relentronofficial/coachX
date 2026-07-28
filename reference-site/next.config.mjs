/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Emit `.next/standalone` — a self-contained server with only the modules it
   * actually imports traced in. The container ships that instead of the full
   * node_modules tree, which is what keeps the Cloud Run image small and cold
   * starts short.
   */
  output: 'standalone',
  images: {
    // Placeholder image host used by the scaffold. Swap for your own assets.
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
};

export default nextConfig;
