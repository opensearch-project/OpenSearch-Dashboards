const path = require('path');
// const webpack = require('webpack');
// eslint-disable-next-line

const createCompiler = require('@storybook/addon-docs/mdx-compiler-plugin');

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

module.exports = async ({ config }) => {
  //config.plugins.push(new webpack.EnvironmentPlugin({ RNG_SEED: null }));

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

  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [['react-app', { flow: false, typescript: true, sourceLoaderOptions: null }]],
        },
      },
      {
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.json',
          transpileOnly: true,
        },
      },
      {
        loader: require.resolve('react-docgen-typescript-loader'),
      },
    ],
  });
  config.module.rules.push({
    test: /\.mdx$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: [['react-app', { flow: false, typescript: true }]],
        },
      },
      {
        loader: '@mdx-js/loader',
        options: {
          compilers: [createCompiler({})],
        },
      },
    ],
  });

  config.resolve.extensions.push('.ts', '.tsx', '.mdx');

  return config;
};
