/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép import @/...
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': __dirname,
    };

    // Fix pdfmake not resolve on Vercel
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      vm: false,
    };

    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  }
};

module.exports = nextConfig;
