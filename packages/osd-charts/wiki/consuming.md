# Consuming Elastic Charts

### Components

You can import Chart components from the top-level Elastic Chart module.

```js
import { Axis, BarSeries, Chart, getAxisId, getSpecId, Position, ScaleType } from '@elastic/charts';
```

## Using Elastic Charts in Kibana

To use Elastic Charts code in Kibana, check if `@elastic/charts` packages is already configured as dependency in `package.json` and simply import the components you want.

## Using Elastic Charts in a standalone project

You can consume Elastic Charts in standalone projects, such as plugins and prototypes.

### Importing CSS

You need to import a CSS style, related to the theme you are using. You can use Webpack or another bundler to import the compiled CSS style with the `style`,`css`, and `postcss` loaders.

```js
import '@elastic/charts/dist/theme_light.css';
// or
import '@elastic/charts/dist/theme_dark.css';
```

If using Elastic Charts in a project that already uses [EUI](https://github.com/elastic/eui) or some other styling library, will want to import the **theme only** files.

```js
import '@elastic/charts/dist/theme_only_light.css';
// or
import '@elastic/charts/dist/theme_only_dark.css';
```

If using Elastic Charts in the same project that is already compiling EUI's Sass (like Kibana), you can import the SASS files directly instead of using the CSS. Just be sure to import Elastic Charts Sass files **after** EUI.

```scss
@import '~@elastic/eui/src/themes/eui/eui_colors_light';
@import '~@elastic/eui/src/global_styling/functions/index';
@import '~@elastic/eui/src/global_styling/variables/index';
@import '~@elastic/eui/src/global_styling/mixins/index';
@import '~@elastic/eui/src/global_styling/reset/index';
@import '~@elastic/charts/dist/theme';
```

## Polyfills

Elastic Charts is transpiled to es5 but requires the `core-js/stable` polyfill for IE11.

If using babel there are two [options](https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#babel)

### Option 1 `preferred` - [`@babel/preset-env`](https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#babelpreset-env)

Use a `.babelrc` config with the [`usebuiltins`](https://babeljs.io/docs/en/babel-preset-env#usebuiltins) option set to [`'entry'`](https://babeljs.io/docs/en/babel-preset-env#usebuiltins-entry) and the [`corejs`](https://babeljs.io/docs/en/babel-preset-env#corejs) option set to `3`.

### Option 2 - [`@babel/polyfill`](https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#babelpolyfill)

Directly import polyfill and runtime.

```js
import "core-js/stable";
import "regenerator-runtime/runtime";
```
