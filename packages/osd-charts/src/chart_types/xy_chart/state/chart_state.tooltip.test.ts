import { GlobalChartState, chartStoreReducer } from '../../../state/chart_state';
import { createStore, Store } from 'redux';
import { upsertSpec, specParsed } from '../../../state/actions/specs';
import { MockSeriesSpec, MockGlobalSpec } from '../../../mocks/specs';
import { updateParentDimensions } from '../../../state/actions/chart_settings';
import { getTooltipValuesAndGeometriesSelector } from './selectors/get_tooltip_values_highlighted_geoms';
import { onPointerMove } from '../../../state/actions/mouse';
import { TooltipType } from '../utils/interactions';

describe('XYChart - State tooltips', () => {
  let store: Store<GlobalChartState>;
  beforeEach(() => {
    const storeReducer = chartStoreReducer('chartId');
    store = createStore(storeReducer);
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ data: [{ x: 1, y: 10 }, { x: 2, y: 5 }] })));
    store.dispatch(upsertSpec(MockGlobalSpec.settings()));
    store.dispatch(specParsed());
    store.dispatch(updateParentDimensions({ width: 100, height: 100, top: 0, left: 0 }));
  });

  describe('should compute tooltip values depending on tooltip type', () => {
    it.each<[TooltipType, number, number]>([
      [TooltipType.None, 0, 0],
      [TooltipType.Follow, 1, 2],
      [TooltipType.VerticalCursor, 1, 2],
      [TooltipType.Crosshairs, 1, 2],
    ])('tooltip type %s', (tooltipType, expectedHgeomsLength, expectedTooltipValuesLength) => {
      store.dispatch(onPointerMove({ x: 25, y: 50 }, 0));
      store.dispatch(
        upsertSpec(
          MockGlobalSpec.settings({
            tooltip: {
              type: tooltipType,
            },
          }),
        ),
      );
      store.dispatch(specParsed());
      const state = store.getState();
      const tooltipValues = getTooltipValuesAndGeometriesSelector(state);
      expect(tooltipValues.tooltipValues).toHaveLength(expectedTooltipValuesLength);
      expect(tooltipValues.highlightedGeometries).toHaveLength(expectedHgeomsLength);
    });
  });
});
