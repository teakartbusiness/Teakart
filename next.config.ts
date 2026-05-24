import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    // Prefer modern formats; browsers that don't support them fall back automatically.
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 7 days. Cloudinary URLs change when admin
    // re-uploads (new public_id), so this is safe.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Stop browsers from sniffing MIME types.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Block this site from being framed by other origins (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak full URLs in the Referer when navigating away.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Don't grant access to powerful browser APIs we don't need.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
