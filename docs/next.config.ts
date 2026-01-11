const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [require("remark-gfm"), require("remark-math")],
    rehypePlugins: [
      require("rehype-slug"),
      require("rehype-autolink-headings"),
      require("rehype-katex"),
      [
        require("rehype-pretty-code"),
        {
          theme: "github-dark",
          keepBackground: false,
        },
      ],
    ],
  },
});

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    mdxRs: true,
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "framer-motion",
      "date-fns",
    ],
  },
  images: {
    domains: ["localhost", "skygenesisenterprise.com"],
    formats: ["image/webp", "image/avif"],
  },
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  async rewrites() {
    return [
      {
        source: "/docs/:path*",
        destination: "/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/wiki",
        destination: "/docs",
        permanent: true,
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: "radix",
            priority: 20,
            chunks: "all",
          },
        },
      };
    }

    return config;
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: ".next",
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? "https://wiki.skygenesisenterprise.com"
      : undefined,
};

module.exports = withBundleAnalyzer(withMDX(nextConfig));
