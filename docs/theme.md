# Theme loading

## Loading

`src/legacy/ui/ui_render/ui_render_mixin.js` via `src/legacy/ui/ui_render/bootstrap/template.js.hbs` and `src/legacy/ui/ui_render/bootstrap/app_bootstrap.js`. Aliased in `src/legacy/ui/ui_mixin.js`, called by `src/legacy/server/osd_server.js`. Called by `src/core/server/legacy/legacy_service.ts` via `src/core/server/server.ts`

## Injected style tags

1. `src/core/server/rendering/views/styles.tsx` - depends on dark/light mode and injects style tag in head
2. `src/core/server/rendering/views/fonts.tsx` - depends on theme version and injects font style tag in head
3. Monaco editor styles
4. Ace styles
5. Ace TM overrides
6. Ace error styles


## Styleshsheets

1. KUI styles (e.g. `packages/osd-ui-framework/src/kui_dark.scss`, compiled by `packages/osd-ui-framework/Gruntfile.js`). Separate stylesheets for each theme version/dark mode combo (colors).
2. Monaco editor styles
3. Legacy styles (bootstrap)
4. OUI styles (compiled by `packages/osd-ui-shared-deps/webpack.config.js`)
5. Component styles

## JSON/JS Vars

1. Defined by `packages/osd-ui-shared-deps/theme.ts`
	1. Used by `src/plugins/charts/public/static/color_maps/color_maps.ts` to set vis colors
	2. Used by `src/plugins/discover/public/application/components/chart/histogram/histogram.tsx` to define Discover histogram Elastic Chart styling
	3. Used by `src/plugins/maps_legacy/public/map/opensearch_dashboards_map.js` and `src/plugins/region_map/public/choropleth_layer.js` for minor map UI styling (line color, empty shade)
	4. Used by `src/plugins/vis_type_vega/public/data_model/vega_parser.ts` for Vega/Vega-Lite theming
2. Used by `src/plugins/vis_type_vislib/public/vislib/components/tooltip/tooltip.js` for tooltip spacing
3. Used by `src/plugins/expressions/public/react_expression_renderer.tsx` to define padding options.
4. Used by `src/core/server/rendering/views/theme.ts` to inject values into `src/core/server/rendering/views/styles.tsx`
5. Used (incorrectly) to style a badge color in `src/plugins/index_pattern_management/public/components/create_button/create_button.tsx`
6. Used by `src/plugins/opensearch_dashboards_react/public/code_editor/editor_theme.ts` to create Monaco theme styles
