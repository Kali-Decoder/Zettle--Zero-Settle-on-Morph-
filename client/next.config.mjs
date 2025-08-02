/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript type checking
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint checks during builds
  },
  webpack: (config) => {
    // Disable Terser optimization to fix HeartbeatWorker.js issue
    config.optimization.minimize = false;
    
    return config;
  },
};

export default nextConfig;
