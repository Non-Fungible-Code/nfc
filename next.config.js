module.exports = {
  reactStrictMode: true,
  future: { webpack5: true },
  webpack: (config) => {
    // Unset client-side javascript that only works server-side
    config.resolve.fallback = {
      fs: false,
      module: false,
      // Polyfill the node modules required by bnc-onboard
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
    };

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};
