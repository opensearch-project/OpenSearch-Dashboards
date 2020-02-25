import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Area Chart',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as basic } from './1_basic';
export { example as withTimeXAxis } from './2_with_time';
export { example as withLinearXAxis } from './3_with_linear';
export { example as withLogYAxis } from './4_with_log';
export { example as with4Axes } from './5_with_4_axes';
export { example as withAxisAndLegend } from './6_with_axis_and_legend';
export { example as stacked } from './7_stacked';
export { example as stackedPercentage } from './8_stacked_percentage';
export { example as stackedSeparateSpecs } from './9_stacked_separate_specs';
export { example as stackedSameNaming } from './10_stacked_same_naming';
export { example as bandArea } from './13_band_area';
export { example as stackedBand } from './14_stacked_band';
export { example as stackedGrouped } from './15_stacked_grouped';

export { example as testLinear } from './11_test_linear';
export { example as testTime } from './12_test_time';
