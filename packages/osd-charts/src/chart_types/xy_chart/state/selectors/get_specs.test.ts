import { getSeriesSpecsSelector } from './get_specs';
import { getInitialState } from '../../../../state/chart_state';
import { ChartTypes } from '../../..';
import { SpecTypes } from '../../utils/specs';

describe('selector - get_specs', () => {
  const state = getInitialState('chartId1');
  const barSpec1 = {
    id: 'bars1',
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
  };
  const barSpec2 = {
    id: 'bars2',
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
  };
  beforeEach(() => {
    state.specs['bars1'] = barSpec1;
    state.specs['bars2'] = barSpec2;
  });
  it('shall return the same ref objects', () => {
    const series = getSeriesSpecsSelector(state);
    expect(series.length).toBe(2);
    const seriesSecondCall = getSeriesSpecsSelector({ ...state, specsInitialized: true });
    expect(series).toBe(seriesSecondCall);
  });
});
