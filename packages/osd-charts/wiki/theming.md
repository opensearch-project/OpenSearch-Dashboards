## How Elastic Charts theming works

Elastic Charts can be easily themed by creating a JSON object with the same shape of the existing [Theme](../packages/charts/src/utils/themes/theme.ts) interface. Currently we maintain the following themes:

- LIGHT_THEME (the default Elastic Chart theme)
- DARK_THEME (the same theme in dark)

Each of these themes simply include a series of variables that adjust colors, sizing and styles to fit the needs of that theme.

## How to create and test a theme

### Create a new theme

1. Copy one theme from `packages/charts/src/themes/` directory and tweak it variables.
2. Pass it to the `Setting` component:

   ```
   <Setting theme={customTheme} />
   ```

### Extend an existing one

1. Create a JSON object that respect the `PartialTheme` interface.
2. Merge your partial theme with one of the existing one to be sure to create a valid `Theme` object:

   ```
   const customTheme = mergeWithDefaultTheme(partialTheme, existingTheme);
   ```

3. Pass it to the `Setting` component:

   ```
   <Setting theme={customTheme} />
   ```
