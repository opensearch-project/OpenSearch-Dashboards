import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Grids',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as basic } from './1_basic';
export { example as multipleAxesWithTheSamePosition } from './2_multiple_axes';
