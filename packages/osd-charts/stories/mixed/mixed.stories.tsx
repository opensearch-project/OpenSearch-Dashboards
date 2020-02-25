import { SB_SOURCE_PANEL } from '../utils/storybook';

export default {
  title: 'Mixed Charts',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as barsAndLines } from './1_bars_and_lines';
export { example as linesAndAreas } from './2_lines_and_areas';
export { example as areasAndBars } from './3_areas_and_bars';
export { example as testBarLinesLinear } from './4_test_bar';
export { example as testBarLinesTime } from './5_test_bar_time';
export { example as fittingFunctionsNonStackedSeries } from './6_fitting';
