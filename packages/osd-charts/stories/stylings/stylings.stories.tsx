import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Stylings',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as chartSize } from './1_chart_size';
export { example as marginsAndPaddings } from './2_margins';
export { example as axis } from './3_axis';
export { example as themeStyling } from './4_theme_styling';
export { example as partialCustomTheme } from './5_partial_custom_theme';
export { example as partialCustomThemeWithBaseTheme } from './6_partial_and_base';
export { example as multipleCustomPartialThemes } from './7_multiple_custom';
export { example as customSeriesColorsViaColorsArray } from './8_custom_series_colors_array';
export { example as customSeriesColorsViaAccessorFunction } from './9_custom_series_colors_function';

export { example as customSeriesStylesBars } from './10_custom_bars';
export { example as customSeriesStylesLines } from './11_custom_lines';
export { example as customSeriesStylesArea } from './12_custom_area';
export { example as customSeriesName } from './13_custom_series_name';
export { example as customSeriesNameConfig } from './13_custom_series_name_config';
export { example as customSeriesNameFormatting } from './14_custom_series_name_formatting';
export { example as tickLabelPaddingBothPropAndTheme } from './15_tick_label';
export { example as styleAccessorOverrides } from './16_style_accessor';
