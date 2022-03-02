### Settings props table 
In a couple of charts in the `Types of charts` section you may have noticed the `<Settings/>` component. A very common prop on this component is explicitly set `theme`.
Below is a full prop table for the `<Settings/>`. Default specs are set in the `setting.tsx` file. 

| Prop | Type | Default | Note |
|:------|:------:|:---------:|:------|
| theme | ParitalTheme or PartialTheme[] | `LIGHT_THEME`  |Partial theme to be merged with base or an array of partial themes to be merged with the base. Index `0` being the highest priority  |
| baseTheme| Theme | `LIGHT_THEME`  |Full default theme to use as base |
| id | string | `'__global__settings__'` | |
| rendering | Rendering  |`canvas as canvas`  |  |
| rotation | Rotation | `0` |  |
| animateData | boolean |true | |
| showLegend | boolean |false| Show a legend for the chart |
| tooltip | TooltipType or TooltipProps | | Either a TooltipType or an object with configuration of type, snap, and/or headerFormatter |
| debug| boolean | false | Enables styling for debug axes | 
| legendPosition| | Position.Right | Set the position of the legend in relation to the chart |
| showLegendDisplayValue| boolean | `true` | provides a knob for storybook `boolean('show display value in legend', true)`|
| hideDuplicateAxes| boolean | `false`| Removes duplicate axes, compares title, position and first and last tick labels| 

***