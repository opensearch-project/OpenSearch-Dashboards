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
@import '~@elastic/charts/src/theme_only_light';
```
