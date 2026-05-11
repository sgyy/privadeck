import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  images: { unoptimized: true },
  trailingSlash: true,
  // Dev-only: production 走 output:"export"，headers() 不会被执行；
  // 这里给 next dev 提供 FFmpeg.wasm / SharedArrayBuffer 所需的 COEP/COOP。
  // 生产环境对应的 header 在 public/_headers 中。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
