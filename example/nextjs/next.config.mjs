const nextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "source-map": false
    };

    return config;
  }
};

export default nextConfig;
