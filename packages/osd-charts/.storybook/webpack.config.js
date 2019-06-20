// eslint-disable-next-line
const path = require('path');

module.exports = (baseConfig, env, config) => {
  if (env === 'DEVELOPMENT') {
    config.devtool = 'inline-source-map';
  } else {
    config.devtool = 'source-map';
  }
  config.module.rules.push({
    test: /\.tsx?$/,
    loader: require.resolve('ts-loader'),
    exclude: /node_modules/,
    options: {
      configFile: 'tsconfig.json',
    },
  });
  config.module.rules.push({
    test: /\.tsx?$/,
    loader: require.resolve('react-docgen-typescript-loader'),
    exclude: /node_modules/,
  });
  config.module.rules.push({
    test: /\.tsx?$/,
    include: [path.resolve(__dirname, '../stories')],
    loaders: [
      {
        loader: require.resolve('@storybook/addon-storysource/loader'),
        options: {
          parser: 'typescript',
        },
      },
    ],
    enforce: 'pre',
  });
  config.module.rules.push({
    test: /\.scss$/,
    use: [
      {
        loader: 'style-loader',
        options: {
          attrs: {
            nonce: 'Pk1rZ1XDlMuYe8ubWV3Lh0BzwrTigJQ=',
          },
        },
      },
      {
        loader: 'css-loader',
      },
      {
        loader: 'sass-loader',
      },
    ],
  });
  config.resolve.extensions.push('.ts', '.tsx');

  return config;
};
