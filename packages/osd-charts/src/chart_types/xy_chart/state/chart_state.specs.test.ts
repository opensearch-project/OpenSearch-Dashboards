import { GlobalChartState, chartStoreReducer } from '../../../state/chart_state';
import { createStore, Store } from 'redux';
import { upsertSpec, specParsed, specParsing } from '../../../state/actions/specs';
import { MockSeriesSpec } from '../../../mocks/specs';
import { getLegendItemsSelector } from '../../../state/selectors/get_legend_items';

const data = [
  { x: 0, y: 10 },
  { x: 1, y: 10 },
];

describe('XYChart - specs ordering', () => {
  let store: Store<GlobalChartState>;
  beforeEach(() => {
    const storeReducer = chartStoreReducer('chartId');
    store = createStore(storeReducer);
    store.dispatch(specParsing());
  });

  it('the legend respect the insert [A, B, C] order', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    const legendItems = getLegendItemsSelector(store.getState());
    const labels = [...legendItems.values()].map((item) => item.label);
    expect(labels).toEqual(['A', 'B', 'C']);
  });
  it('the legend respect the insert order [B, A, C]', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());
    const legendItems = getLegendItemsSelector(store.getState());
    const labels = [...legendItems.values()].map((item) => item.label);
    expect(labels).toEqual(['B', 'A', 'C']);
  });
  it('the legend respect the order when changing properties of existing specs', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    let legendItems = getLegendItemsSelector(store.getState());
    let labels = [...legendItems.values()].map((item) => item.label);
    expect(labels).toEqual(['A', 'B', 'C']);

    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', name: 'B updated', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    legendItems = getLegendItemsSelector(store.getState());
    labels = [...legendItems.values()].map((item) => item.label);
    expect(labels).toEqual(['A', 'B updated', 'C']);
  });
  it('the legend respect the order when changing the order of the specs', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    let legendItems = getLegendItemsSelector(store.getState());
    let labels = [...legendItems.values()].map((item) => item.label);
    expect(labels).toEqual(['A', 'B', 'C']);

    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    legendItems = getLegendItemsSelector(store.getState());
    labels = [...legendItems.values()].map((item) => item.label);
    expect(labels).toEqual(['B', 'A', 'C']);
  });
});
