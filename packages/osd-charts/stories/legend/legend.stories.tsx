import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Legend',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as right } from './1_legend_right';
export { example as bottom } from './2_legend_bottom';
export { example as left } from './3_legend_left';
export { example as top } from './4_legend_top';
export { example as changingSpecs } from './5_changing_specs';
export { example as hideLegendItemsBySeries } from './6_hide_legend';
export { example as displayValuesInLegendElements } from './7_display_values';
export { example as legendSpacingBuffer } from './8_spacing_buffer';
export { example as colorPicker } from './9_color_picker';
