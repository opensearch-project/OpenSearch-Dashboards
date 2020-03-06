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
  title: 'Bar Chart',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as basic } from './1_basic';
export { example as withValueLabel } from './2_label_value';
export { example as withAxis } from './3_with_axis';
export { example as withOrdinalXAxis } from './4_ordinal';
export { example as withLinearXAxis } from './5_linear';
export { example as withLinearXAxisNoLinearInterval } from './6_linear_no_linear_interval';
export { example as withTimeXAxis } from './7_with_time_xaxis';
export { example as withLogYAxis } from './8_with_log_yaxis';
export { example as withStackedLogYAxis } from './9_with_stacked_log';

export { example as withAxisAndLegend } from './10_axis_and_legend';
export { example as stackedWithAxisAndLegend } from './11_stacked_with_axis_and_legend';
export { example as stackedAsPercentage } from './12_stacked_as_percentage';
export { example as clusteredWithAxisAndLegend } from './13_clustered';
export { example as clusteredMultipleSeriesSpecs } from './14_clustered_multiple';
export { example as timeClusteredUsingVariousSpecs } from './15_time_clustered';
export { example as timeStackedUsingVariousSpecs } from './17_time_stacked';
export { example as barChart1y0g } from './18_bar_chart_1y0g';
export { example as barChart1y1g } from './19_bar_chart_1y1g';

export { example as barChart1y2g } from './20_bar_chart_1y2g';
export { example as barChart2y0g } from './21_bar_chart_2y0g';
export { example as barChart2y1g } from './22_barchart_2y1g';
export { example as barChart2y2g } from './23_bar_chart_2y2g';
export { example as tooltipSeriesVisibility } from './24_tooltip_visibility';
export { example as withHighDataVolume } from './25_high_data_volume';
export { example as singleDataChartLinear } from './26_single_data_linear';
export { example as singleDataChartOrdinal } from './27_single_data_ordinal';
export { example as singleDataClusteredChart } from './28_single_data_clustered';
export { example as singleDataStackedChart } from './29_single_data_stacked';

export { example as stackedToExtent } from './30_stacked_to_extent';
export { example as negativeAndPositiveXValues } from './31_negative_and_positive_x_values';
export { example as scaleToExtent } from './32_scale_to_extent';
export { example as bandBarChart } from './33_band_bar';
export { example as minHeight } from './45_min_height';
export { example as stackedOnlyGroupedAreas } from './47_stacked_only_grouped';

// for testing purposes only
export { example as testLinear } from './34_test_linear';
export { example as testTime } from './35_test_time';
export { example as testLinearClustered } from './36_test_linear_clustered';
export { example as testTimeClustered } from './37_test_time_clustered';
export { example as testClusteredBarChartWithNullBars } from './38_test_clustered_null_bars';
export { example as testStackedBarChartWithNullBars } from './39_test_stacked_null';
export { example as testSwitchOrdinalLinearAxis } from './40_test_switch';
export { example as testHistogramModeLinear } from './41_test_histogram_linear';
export { example as testHistogramModeOrdinal } from './42_test_histogram_ordinal';
export { example as testDiscover } from './43_test_discover';
export { example as testSingleHistogramBarChart } from './44_test_single_histogram';
export { example as testMinHeightPositiveAndNegativeValues } from './46_test_min_height';
export { example as testTooltipAndRotation } from './48_test_tooltip';
