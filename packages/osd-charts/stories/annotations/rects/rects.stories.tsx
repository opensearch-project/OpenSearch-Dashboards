import { SB_KNOBS_PANEL } from '../../utils/storybook';

export default {
  title: 'Annotations/Rects',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as linearBarChart } from './1_linear_bar_chart';
export { example as ordinalBarChart } from './2_ordinal_bar_chart';
export { example as linearLineChart } from './3_linear_line_chart';
export { example as styling } from './4_styling';
export { example as tooltipVisibility } from './5_tooltip_visibility';
