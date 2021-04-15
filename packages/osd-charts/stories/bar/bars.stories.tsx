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
 * under the License.
 */

import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Bar Chart',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { Example as basic } from './1_basic';
export { Example as withValueLabel } from './2_label_value';
export { Example as withValueLabelAdvanced } from './51_label_value_advanced';
export { Example as withAxis } from './3_with_axis';
export { Example as withOrdinalXAxis } from './4_ordinal';
export { Example as withLinearXAxis } from './5_linear';
export { Example as withLinearXAxisNoLinearInterval } from './6_linear_no_linear_interval';
export { Example as withTimeXAxis } from './7_with_time_xaxis';
export { Example as withLogYAxis } from './8_with_log_yaxis';
export { Example as withStackedLogYAxis } from './9_with_stacked_log';

export { Example as withAxisAndLegend } from './10_axis_and_legend';
export { Example as stackedWithAxisAndLegend } from './11_stacked_with_axis_and_legend';
export { Example as stackedAsPercentage } from './12_stacked_as_percentage';
export { Example as clusteredWithAxisAndLegend } from './13_clustered';
export { Example as clusteredMultipleSeriesSpecs } from './14_clustered_multiple';
export { Example as timeClusteredUsingVariousSpecs } from './15_time_clustered';
export { Example as timeStackedUsingVariousSpecs } from './17_time_stacked';
export { Example as barChart1y0g } from './18_bar_chart_1y0g';
export { Example as barChart1y1g } from './19_bar_chart_1y1g';

export { Example as barChart1y2g } from './20_bar_chart_1y2g';
export { Example as barChart2y0g } from './21_bar_chart_2y0g';
export { Example as barChart2y1g } from './22_barchart_2y1g';
export { Example as barChart2y2g } from './23_bar_chart_2y2g';
export { Example as tooltipSeriesVisibility } from './24_tooltip_visibility';
export { Example as withHighDataVolume } from './25_high_data_volume';
export { Example as singleDataChartLinear } from './26_single_data_linear';
export { Example as singleDataChartOrdinal } from './27_single_data_ordinal';
export { Example as singleDataClusteredChart } from './28_single_data_clustered';
export { Example as singleDataStackedChart } from './29_single_data_stacked';

export { Example as stackedToExtent } from './30_stacked_to_extent';
export { Example as negativeAndPositiveXValues } from './31_negative_and_positive_x_values';
export { Example as scaleToExtent } from './32_scale_to_extent';
export { Example as bandBarChart } from './33_band_bar';
export { Example as minHeight } from './45_min_height';
export { Example as stackedOnlyGrouped } from './47_stacked_only_grouped';
export { Example as dualAxisSameYDomain } from './52_multi_group_same_domain';
export { Example as specifyDomainFromDifferentGroup } from './53_use_domain_from_different_groupid';
export { Example as orderBinsBySum } from './50_order_bins_by_sum';
export { Example as functionalAccessors } from './54_functional_accessors';

// for testing purposes only
export { Example as testLinear } from './34_test_linear';
export { Example as testTime } from './35_test_time';
export { Example as testLinearClustered } from './36_test_linear_clustered';
export { Example as testTimeClustered } from './37_test_time_clustered';
export { Example as testClusteredBarChartWithNullBars } from './38_test_clustered_null_bars';
export { Example as testStackedBarChartWithNullBars } from './39_test_stacked_null';
export { Example as testSwitchOrdinalLinearAxis } from './40_test_switch';
export { Example as testHistogramModeLinear } from './41_test_histogram_linear';
export { Example as testHistogramModeOrdinal } from './42_test_histogram_ordinal';
export { Example as testDiscover } from './43_test_discover';
export { Example as testSingleHistogramBarChart } from './44_test_single_histogram';
export { Example as testMinHeightPositiveAndNegativeValues } from './46_test_min_height';
export { Example as testTooltipAndRotation } from './48_test_tooltip';
export { Example as tooltipBoundary } from './55_tooltip_boundary';
export { Example as testDualYAxis } from './49_test_dual_axis';
export { Example as testUseDefaultGroupDomain } from './56_test_use_dfl_gdomain';
