# Consuming Elastic Charts

### Components

You can import Chart components from the top-level Elastic Chart module.

```js
import { Axis, BarSeries, Chart, getAxisId, getSpecId, Position, ScaleType } from '@elastic/charts';
```

## Requirements and dependencies

Elastic Charts depends on EUI framework for styles and its subsequent peer dependencies (`moment` and `@elastic/datemath`). These are already loaded in most Elastic repos, but make sure to install them if you are starting from scratch.

## Using Elastic Charts in Kibana

To use Elastic Charts code in Kibana, check if `@elastic/charts` packages is already configured as dependency in `package.json` and simply import the components you want.

## Using Elastic Charts in a standalone project

You can consume Elastic Charts in standalone projects, such as plugins and prototypes.

### Importing CSS

You need to import the CSS to provide the correct theme styling for some of the EUI components we are using (legend and tooltips). In this case, you can use Webpack or another bundler to import the compiled EUI CSS and the Elastic Charts with the `style`,`css`, and `postcss` loaders.

```js
import '@elastic/eui/dist/eui_theme_dark.css';
import '@elastic/charts/dist/style.css';
```

By default, EUI ships with a font stack that includes some outside, open source fonts. If your system is internet available you can include these by adding the following imports to your SCSS/CSS files, otherwise you'll need to bundle the physical fonts in your build. EUI will drop to System Fonts (which you may prefer) in their absence.

```scss
// index.scss
@import url('https://fonts.googleapis.com/css?family=Roboto+Mono:400,400i,700,700i');
@import url('https://rsms.me/inter/inter-ui.css');
```
