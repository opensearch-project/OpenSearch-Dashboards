/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { chartStoreReducer, GlobalChartState } from '../../../../state/chart_state';
import { createStore, Store } from 'redux';
import { PartitionSpec } from '../../specs';
import { upsertSpec, specParsed, specParsing } from '../../../../state/actions/specs';
import { MockGlobalSpec, MockSeriesSpec } from '../../../../mocks/specs';
import { updateParentDimensions } from '../../../../state/actions/chart_settings';
import { partitionGeometries } from './geometries';
import { onMouseDown, onMouseUp, onPointerMove } from '../../../../state/actions/mouse';
import { createOnElementClickCaller } from './on_element_click_caller';
import { SettingsSpec, XYChartElementEvent, PartitionElementEvent } from '../../../../specs';

describe('Picked shapes selector', () => {
  function initStore() {
    const storeReducer = chartStoreReducer('chartId');
    return createStore(storeReducer);
  }
  function addSeries(store: Store<GlobalChartState>, spec: PartitionSpec, settings?: Partial<SettingsSpec>) {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockGlobalSpec.settings(settings)));
    store.dispatch(upsertSpec(spec));
    store.dispatch(specParsed());
    store.dispatch(updateParentDimensions({ width: 300, height: 300, top: 0, left: 0 }));
  }
  let store: Store<GlobalChartState>;
  let treemapSpec: PartitionSpec;
  let sunburstSpec: PartitionSpec;
  beforeEach(() => {
    store = initStore();
    const common = {
      valueAccessor: (d: { v: number }) => {
        return d.v;
      },
      data: [
        { g1: 'a', g2: 'a', v: 1 },
        { g1: 'a', g2: 'b', v: 1 },
        { g1: 'b', g2: 'a', v: 1 },
        { g1: 'b', g2: 'b', v: 1 },
      ],
      layers: [
        {
          groupByRollup: (datum: { g1: string }) => datum.g1,
        },
        {
          groupByRollup: (datum: { g2: string }) => datum.g2,
        },
      ],
    };
    treemapSpec = MockSeriesSpec.treemap(common);
    sunburstSpec = MockSeriesSpec.sunburst(common);
  });
  test('check initial geoms', () => {
    addSeries(store, treemapSpec);
    const treemapGeometries = partitionGeometries(store.getState());
    expect(treemapGeometries.quadViewModel).toHaveLength(6);

    addSeries(store, sunburstSpec);
    const sunburstGeometries = partitionGeometries(store.getState());
    expect(sunburstGeometries.quadViewModel).toHaveLength(6);
  });
  test('treemap check picked geometries', () => {
    const onClickListener = jest.fn<undefined, Array<(XYChartElementEvent | PartitionElementEvent)[]>>(
      (): undefined => undefined,
    );
    addSeries(store, treemapSpec, {
      onElementClick: onClickListener,
    });
    const geometries = partitionGeometries(store.getState());
    expect(geometries.quadViewModel).toHaveLength(6);

    const onElementClickCaller = createOnElementClickCaller();
    store.subscribe(() => {
      onElementClickCaller(store.getState());
    });
    store.dispatch(onPointerMove({ x: 200, y: 200 }, 0));
    store.dispatch(onMouseDown({ x: 200, y: 200 }, 1));
    store.dispatch(onMouseUp({ x: 200, y: 200 }, 2));
    expect(onClickListener).toBeCalled();
    expect(onClickListener.mock.calls[0][0]).toEqual([
      [
        [
          { groupByRollup: 'b', value: 2 },
          { groupByRollup: 'b', value: 1 },
        ],
        {
          specId: treemapSpec.id,
          key: `spec{${treemapSpec.id}}`,
        },
      ],
    ]);
  });
  test('sunburst check picked geometries', () => {
    const onClickListener = jest.fn<undefined, Array<(XYChartElementEvent | PartitionElementEvent)[]>>(
      (): undefined => undefined,
    );
    addSeries(store, sunburstSpec, {
      onElementClick: onClickListener,
    });
    const geometries = partitionGeometries(store.getState());
    expect(geometries.quadViewModel).toHaveLength(6);

    const onElementClickCaller = createOnElementClickCaller();
    store.subscribe(() => {
      onElementClickCaller(store.getState());
    });
    store.dispatch(onPointerMove({ x: 200, y: 200 }, 0));
    store.dispatch(onMouseDown({ x: 200, y: 200 }, 1));
    store.dispatch(onMouseUp({ x: 200, y: 200 }, 2));
    expect(onClickListener).toBeCalled();
    expect(onClickListener.mock.calls[0][0]).toEqual([
      [
        [
          { groupByRollup: 'b', value: 2 },
          { groupByRollup: 'b', value: 1 },
        ],
        {
          specId: sunburstSpec.id,
          key: `spec{${sunburstSpec.id}}`,
        },
      ],
    ]);
  });
});
