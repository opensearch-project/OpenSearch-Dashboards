// eslint-disable-next-line
const path = require('path');

const nonce = 'Pk1rZ1XDlMuYe8ubWV3Lh0BzwrTigJQ=';
const scssLoaders = [
  {
    loader: 'css-loader',
    options: { importLoaders: 1 },
  },
  {
    loader: 'postcss-loader',
    options: {
      plugins: [require('autoprefixer')],
    },
  },
  'sass-loader',
];

module.exports = async ({ config, mode }) => {
  if (mode === 'DEVELOPMENT') {
    config.devtool = 'inline-source-map';
  } else {
    config.devtool = 'source-map';
  }

  config.module.rules.push({
    test: /\.tsx?$/,
    loader: 'ts-loader',
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

  // Replace default css rules with nonce
  config.module.rules = config.module.rules.filter(({ test }) => !test.test('.css'));
  config.module.rules.push({
    test: /\.css$/,
    use: [
      {
        loader: 'style-loader',
        options: {
          attrs: {
            nonce,
          },
        },
      },
      {
        loader: 'css-loader',
        options: { importLoaders: 1 },
      },
    ],
  });

  config.module.rules.push({
    test: /\.scss$/,
    include: [path.resolve(__dirname, '../.storybook'), path.resolve(__dirname, '../node_modules/@elastic')],
    use: [
      {
        loader: 'style-loader',
        options: {
          attrs: {
            nonce,
          },
        },
      },
      ...scssLoaders,
    ],
  });

  // Used for lazy loaded scss files
  config.module.rules.push({
    test: /\.scss$/,
    resourceQuery: /^\?lazy$/,
    use: [
      {
        loader: 'style-loader/useable',
        options: {
          attrs: {
            nonce,
          },
        },
      },
      ...scssLoaders,
    ],
  });

  config.resolve.extensions.push('.ts', '.tsx');

  return config;
};
