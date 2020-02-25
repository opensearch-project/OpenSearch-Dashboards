import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Axes',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as basic } from './1_basic';
export { example as tickLabelRotation } from './2_tick_label_rotation';
export { example as with4Axes } from './3_axis_4_axes';
export { example as multiAxes } from './4_multi_axis';
export { example as barsAndLines } from './5_multi_axis_bar_lines';
export { example as differentTooltip } from './6_different_tooltip';
export { example as manyTickLabels } from './7_many_tick_labels';
export { example as customDomain } from './8_custom_domain';
export { example as customMixed } from './9_custom_mixed_domain';
export { example as oneDomainBound } from './10_one_domain_bound';
export { example as fitDomain } from './11_fit_domain_extent';
