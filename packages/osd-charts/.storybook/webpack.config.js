const path = require('path');

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
      },
      {
        loader: require.resolve('react-docgen-typescript-loader')
      },
    ]
  });
  config.module.rules.push({
    test: /\.scss$/,
    use: [
      {
        loader: "style-loader"
      },
      {
        loader: "css-loader"
      },
      {
        loader: "sass-loader",
      }
    ]
  });
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
};

