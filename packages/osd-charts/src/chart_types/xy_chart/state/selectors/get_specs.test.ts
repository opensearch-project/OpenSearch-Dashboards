import { getSeriesSpecsSelector } from './get_specs';
import { getInitialState } from '../../../../state/chart_state';
import { MockSeriesSpec } from '../../../../mocks/specs';

describe('selector - get_specs', () => {
  const state = getInitialState('chartId1');
  beforeEach(() => {
    state.specs['bars1'] = MockSeriesSpec.bar({ id: 'bars1' });
    state.specs['bars2'] = MockSeriesSpec.bar({ id: 'bars2' });
  });
  it('shall return the same ref objects', () => {
    const series = getSeriesSpecsSelector(state);
    expect(series.length).toBe(2);
    const seriesSecondCall = getSeriesSpecsSelector({ ...state, specsInitialized: true });
    expect(series).toBe(seriesSecondCall);
  });
});
