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
 * under the License.
 */

import { createStore, Store } from 'redux';

import { Predicate } from '../../../../common/predicate';
import { MockGlobalSpec, MockSeriesSpec } from '../../../../mocks/specs';
import {
  SettingsSpec,
  XYChartElementEvent,
  PartitionElementEvent,
  HeatmapElementEvent,
  GroupBySpec,
  SmallMultiplesSpec,
} from '../../../../specs';
import { updateParentDimensions } from '../../../../state/actions/chart_settings';
import { onMouseDown, onMouseUp, onPointerMove } from '../../../../state/actions/mouse';
import { upsertSpec, specParsed } from '../../../../state/actions/specs';
import { chartStoreReducer, GlobalChartState } from '../../../../state/chart_state';
import { Datum } from '../../../../utils/common';
import { HIERARCHY_ROOT_KEY } from '../../layout/utils/group_by_rollup';
import { PartitionSpec } from '../../specs';
import { partitionGeometries } from './geometries';
import { createOnElementClickCaller } from './on_element_click_caller';

describe('Picked shapes selector', () => {
  function initStore() {
    const storeReducer = chartStoreReducer('chartId');
    return createStore(storeReducer);
  }
  function addSeries(store: Store<GlobalChartState>, spec: PartitionSpec, settings?: Partial<SettingsSpec>) {
    store.dispatch(upsertSpec(MockGlobalSpec.settings(settings)));
    store.dispatch(upsertSpec(spec));
    store.dispatch(specParsed());
    store.dispatch(updateParentDimensions({ width: 300, height: 300, top: 0, left: 0 }));
  }
  function addSmallMultiplesSeries(
    store: Store<GlobalChartState>,
    groupBy: Partial<GroupBySpec>,
    sm: Partial<SmallMultiplesSpec>,
    spec: PartitionSpec,
    settings?: Partial<SettingsSpec>,
  ) {
    store.dispatch(upsertSpec(MockGlobalSpec.settings(settings)));
    store.dispatch(upsertSpec(MockGlobalSpec.groupBy(groupBy)));
    store.dispatch(upsertSpec(MockGlobalSpec.smallMultiple(sm)));
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
      valueAccessor: (d: { v: number }) => d.v,
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
    const treemapGeometries = partitionGeometries(store.getState())[0];
    expect(treemapGeometries.quadViewModel).toHaveLength(6);

    addSeries(store, sunburstSpec);
    const sunburstGeometries = partitionGeometries(store.getState())[0];
    expect(sunburstGeometries.quadViewModel).toHaveLength(6);
  });
  test('treemap check picked geometries', () => {
    const onClickListener = jest.fn<
      undefined,
      Array<(XYChartElementEvent | PartitionElementEvent | HeatmapElementEvent)[]>
    >((): undefined => undefined);
    addSeries(store, treemapSpec, {
      onElementClick: onClickListener,
    });
    const geometries = partitionGeometries(store.getState())[0];
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
          {
            smAccessorValue: '',
            groupByRollup: 'b',
            value: 2,
            depth: 1,
            sortIndex: 1,
            path: [
              { index: 0, value: HIERARCHY_ROOT_KEY },
              { index: 1, value: 'b' },
            ],
          },
          {
            smAccessorValue: '',
            groupByRollup: 'b',
            value: 1,
            depth: 2,
            sortIndex: 1,
            path: [
              { index: 0, value: HIERARCHY_ROOT_KEY },
              { index: 1, value: 'b' },
              { index: 1, value: 'b' },
            ],
          },
        ],
        {
          specId: treemapSpec.id,
          key: `spec{${treemapSpec.id}}`,
        },
      ],
    ]);
  });
  test('small multiples pie chart check picked geometries', () => {
    const onClickListener = jest.fn<
      undefined,
      Array<(XYChartElementEvent | PartitionElementEvent | HeatmapElementEvent)[]>
    >((): undefined => undefined);
    addSmallMultiplesSeries(
      store,
      {
        id: 'splitGB',
        by: (_, d: Datum) => d.g1,
        sort: Predicate.AlphaAsc,
        format: (d: Datum) => String(d),
      },
      { id: 'sm', splitHorizontally: 'splitGB' },
      MockSeriesSpec.sunburst({
        smallMultiples: 'sm',
        valueAccessor: (d: { v: number }) => d.v,
        data: [
          { g1: 'a', g2: 'a', v: 1 },
          { g1: 'a', g2: 'b', v: 1 },
          { g1: 'b', g2: 'a', v: 1 },
          { g1: 'b', g2: 'b', v: 1 },
        ],
        layers: [
          {
            groupByRollup: (datum: { g2: string }) => datum.g2,
          },
        ],
      }),
      {
        onElementClick: onClickListener,
      },
    );
    const geometries = partitionGeometries(store.getState())[0];
    expect(geometries.quadViewModel).toHaveLength(2);

    const onElementClickCaller = createOnElementClickCaller();
    store.subscribe(() => {
      onElementClickCaller(store.getState());
    });
    const x = 50;
    const y = 150;
    store.dispatch(onPointerMove({ x, y }, 0));
    store.dispatch(onMouseDown({ x, y }, 1));
    store.dispatch(onMouseUp({ x, y }, 2));
    expect(onClickListener).toBeCalled();
    expect(onClickListener.mock.calls[0][0]).toEqual([
      [
        [
          {
            smAccessorValue: 'a',
            groupByRollup: 'a',
            value: 1,
            depth: 1,
            sortIndex: 0,
            path: [
              { index: 0, value: HIERARCHY_ROOT_KEY },
              { index: 0, value: 'a' },
            ],
          },
        ],
        {
          specId: sunburstSpec.id,
          key: `spec{${sunburstSpec.id}}`,
        },
      ],
    ]);
  });
  test('sunburst check picked geometries', () => {
    const onClickListener = jest.fn<
      undefined,
      Array<(XYChartElementEvent | PartitionElementEvent | HeatmapElementEvent)[]>
    >((): undefined => undefined);
    addSeries(store, sunburstSpec, {
      onElementClick: onClickListener,
    });
    const geometries = partitionGeometries(store.getState())[0];
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
          {
            smAccessorValue: '',
            groupByRollup: 'b',
            value: 2,
            depth: 1,
            sortIndex: 1,
            path: [
              { index: 0, value: HIERARCHY_ROOT_KEY },
              { index: 1, value: 'b' },
            ],
          },
          {
            smAccessorValue: '',
            groupByRollup: 'b',
            value: 1,
            depth: 2,
            sortIndex: 1,
            path: [
              { index: 0, value: HIERARCHY_ROOT_KEY },
              { index: 1, value: 'b' },
              { index: 1, value: 'b' },
            ],
          },
        ],
        {
          specId: sunburstSpec.id,
          key: `spec{${sunburstSpec.id}}`,
        },
      ],
    ]);
  });
});
