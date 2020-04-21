/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

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
export { example as barSeriesColorVariant } from './17_bar_series_color_variant';
export { example as lineSeriesColorVariant } from './18_line_series_color_variant';
export { example as areaSeriesColorVariant } from './19_area_series_color_variant';
