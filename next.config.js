module.exports = {
  reactStrictMode: true,
  future: { webpack5: true },
  webpack: (config) => {
    // Unset client-side javascript that only works server-side
    config.resolve.fallback = { fs: false, module: false };

    return config;
  },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     // Unset client-side javascript that only works server-side
  //     // https://github.com/vercel/next.js/issues/7755#issuecomment-508633125
  //     config.node = { fs: 'empty', module: 'empty' };
  //   }

  //   return config;
  // },
};
