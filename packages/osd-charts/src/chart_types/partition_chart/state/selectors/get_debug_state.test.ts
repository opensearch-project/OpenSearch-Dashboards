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

import { Store } from 'redux';

import { MockGlobalSpec, MockSeriesSpec } from '../../../../mocks/specs/specs';
import { MockStore } from '../../../../mocks/store/store';
import {
  HeatmapElementEvent,
  LayerValue,
  PartitionElementEvent,
  XYChartElementEvent,
} from '../../../../specs/settings';
import { onMouseDown, onMouseUp, onPointerMove } from '../../../../state/actions/mouse';
import { GlobalChartState } from '../../../../state/chart_state';
import { DebugState, PartitionDebugState, SinglePartitionDebugState } from '../../../../state/types';
import { PartitionLayout } from '../../layout/types/config_types';
import { isSunburst } from '../../layout/viewmodel/viewmodel';
import { getDebugStateSelector } from './get_debug_state';
import { createOnElementClickCaller } from './on_element_click_caller';

describe.each([
  [PartitionLayout.sunburst, 9, 9],
  [PartitionLayout.treemap, 9, 6],
  [PartitionLayout.flame, 9, 6],
  [PartitionLayout.icicle, 9, 6],
  [PartitionLayout.mosaic, 9, 6],
])('Partition - debug state %s', (partitionLayout, numberOfElements, numberOfCalls) => {
  type TestDatum = { cat1: string; cat2: string; val: number };
  const specJSON = {
    config: {
      partitionLayout,
    },
    data: [
      { cat1: 'Asia', cat2: 'Japan', val: 1 },
      { cat1: 'Asia', cat2: 'China', val: 1 },
      { cat1: 'Europe', cat2: 'Germany', val: 1 },
      { cat1: 'Europe', cat2: 'Italy', val: 1 },
      { cat1: 'North America', cat2: 'United States', val: 1 },
      { cat1: 'North America', cat2: 'Canada', val: 1 },
    ],
    valueAccessor: (d: TestDatum) => d.val,
    layers: [
      {
        groupByRollup: (d: TestDatum) => d.cat1,
      },
      {
        groupByRollup: (d: TestDatum) => d.cat2,
      },
    ],
  };
  let store: Store<GlobalChartState>;
  let onClickListener: jest.Mock<
    undefined,
    Array<(XYChartElementEvent | PartitionElementEvent | HeatmapElementEvent)[]>
  >;
  let debugState: DebugState;

  beforeEach(() => {
    onClickListener = jest.fn((): undefined => undefined);
    store = MockStore.default({ width: 500, height: 500, top: 0, left: 0 });
    const onElementClickCaller = createOnElementClickCaller();
    store.subscribe(() => {
      onElementClickCaller(store.getState());
    });
    MockStore.addSpecs(
      [
        MockSeriesSpec.sunburst(specJSON),
        MockGlobalSpec.settings({ debugState: true, onElementClick: onClickListener }),
      ],
      store,
    );
    debugState = getDebugStateSelector(store.getState());
  });

  it('can compute debug state', () => {
    // small multiple panels
    expect(debugState.partition).toHaveLength(1);
    // partition sectors
    expect(debugState.partition![0].partitions).toHaveLength(numberOfElements);
  });

  it('can click on every sector', () => {
    const [{ partitions }] = debugState.partition as PartitionDebugState[];
    let counter = 0;
    for (let index = 0; index < partitions.length; index++) {
      const partition = partitions[index];
      if (!isSunburst(partitionLayout) && partition.depth < 2) {
        continue;
      }
      expectCorrectClickInfo(store, onClickListener, partition, counter);
      counter++;
    }
    expect(onClickListener).toBeCalledTimes(numberOfCalls);
  });
});

function expectCorrectClickInfo(
  store: Store<GlobalChartState>,
  onClickListener: jest.Mock<undefined, Array<(XYChartElementEvent | PartitionElementEvent | HeatmapElementEvent)[]>>,
  partition: SinglePartitionDebugState,
  index: number,
) {
  const {
    depth,
    value,
    name,
    coords: [x, y],
  } = partition;

  store.dispatch(onPointerMove({ x, y }, index * 3));
  store.dispatch(onMouseDown({ x, y }, index * 3 + 1));
  store.dispatch(onMouseUp({ x, y }, index * 3 + 2));

  expect(onClickListener).toBeCalledTimes(index + 1);
  const obj = onClickListener.mock.calls[index][0][0][0] as LayerValue[];
  // pick the last element of the path
  expect(obj[obj.length - 1]).toMatchObject({
    depth,
    groupByRollup: name,
    value,
  });
}
