/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  sw: "/sw.js",
});

const pwa = withPWA({
  reactStrictMode: true,
  images: {
    domains: [""],
  },
  // webpack: (config: any) => {
  //   config.resolve.fallback = { fs: false };
  //   config.module.rules.push({
  //     test: /\.(woff|woff2|eot|ttf|otf)$/i,
  //     issuer: { and: [/\.(js|ts|md)x?$/] },
  //     type: "asset/resource",
  //   });
  //   return config;
  // },
});
module.exports = pwa;
