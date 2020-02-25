import { SB_SOURCE_PANEL } from '../utils/storybook';

export default {
  title: 'Line Chart',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as basic } from './1_basic';
export { example as withAxis } from './2_w_axis';
export { example as ordinalWithAxis } from './3_ordinal';
export { example as linearWithAxis } from './4_linear';
export { example as withAxisAndLegend } from './5_w_axis_and_legend';
export { example as curvedWithAxisAndLegend } from './6_curved';
export { example as multipleWithAxisAndLegend } from './7_multiple';
export { example as stackedWithAxisAndLegend } from './8_stacked';
export { example as multiSeriesWithLogValues } from './9_multi_series';
