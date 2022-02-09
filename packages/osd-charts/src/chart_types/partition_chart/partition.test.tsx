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

import { MockGlobalSpec, MockSeriesSpec } from '../../mocks/specs';
import { MockStore } from '../../mocks/store';
import { GlobalChartState } from '../../state/chart_state';
import { LegendItemLabel } from '../../state/selectors/get_legend_items_labels';
import { HIERARCHY_ROOT_KEY, NULL_SMALL_MULTIPLES_KEY } from './layout/utils/group_by_rollup';
import { computeLegendSelector } from './state/selectors/compute_legend';
import { getLegendItemsLabels } from './state/selectors/get_legend_items_labels';

// sorting is useful to ensure tests pass even if order changes (where order doesn't matter)
const ascByLabel = (a: LegendItemLabel, b: LegendItemLabel) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0);

describe('Retain hierarchy even with arbitrary names', () => {
  type TestDatum = { cat1: string; cat2: string; val: number };
  const specJSON = {
    data: [
      { cat1: 'A', cat2: 'A', val: 1 },
      { cat1: 'A', cat2: 'B', val: 1 },
      { cat1: 'B', cat2: 'A', val: 1 },
      { cat1: 'B', cat2: 'B', val: 1 },
      { cat1: 'C', cat2: 'A', val: 1 },
      { cat1: 'C', cat2: 'B', val: 1 },
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

  beforeEach(() => {
    store = MockStore.default();
  });

  describe('getLegendItemsLabels', () => {
    // todo discuss question marks about testing this selector, and also about unification with `get_legend_items_labels.test.ts`

    it('all distinct labels are present', () => {
      MockStore.addSpecs([MockGlobalSpec.settings({ showLegend: true }), MockSeriesSpec.sunburst(specJSON)], store);
      expect(getLegendItemsLabels(store.getState()).sort(ascByLabel)).toEqual([
        { depth: 2, label: 'A' },
        { depth: 2, label: 'B' },
        { depth: 1, label: 'C' },
      ]);
    });

    it('no labels are present if showLegend is false', () => {
      MockStore.addSpecs([MockGlobalSpec.settings({ showLegend: false }), MockSeriesSpec.sunburst(specJSON)], store);
      expect(getLegendItemsLabels(store.getState())).toEqual([]);
    });

    it('no labels are present if showLegend is missing', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst(specJSON)], store);
      expect(getLegendItemsLabels(store.getState())).toEqual([]);
    });

    it('special case: one input, one label', () => {
      MockStore.addSpecs(
        [
          MockGlobalSpec.settings({ showLegend: true }),
          MockSeriesSpec.sunburst({
            ...specJSON,
            data: [{ cat1: 'A', cat2: 'A', val: 1, percentage: '100%', valueText: 1 }],
          }),
        ],
        store,
      );
      expect(getLegendItemsLabels(store.getState())).toEqual([{ depth: 2, label: 'A' }]);
    });

    it('special case: one input, two labels', () => {
      MockStore.addSpecs(
        [
          MockGlobalSpec.settings({ showLegend: true }),
          MockSeriesSpec.sunburst({
            ...specJSON,
            data: [{ cat1: 'C', cat2: 'B', val: 1, parentName: 'A', percentage: '100%', valueText: '1' }],
          }),
        ],
        store,
      );
      expect(getLegendItemsLabels(store.getState()).sort(ascByLabel)).toEqual([
        { depth: 2, label: 'B' },
        { depth: 1, label: 'C' },
      ]);
    });

    it('special case: no labels', () => {
      MockStore.addSpecs(
        [MockGlobalSpec.settings({ showLegend: true }), MockSeriesSpec.sunburst({ ...specJSON, data: [] })],
        store,
      );
      expect(getLegendItemsLabels(store.getState()).map((l) => l.label)).toEqual([]);
    });
  });

  describe('getLegendItems', () => {
    // todo discuss question marks about testing this selector, and also about unification with `get_legend_items_labels.test.ts`

    it('all distinct labels are present', () => {
      MockStore.addSpecs(
        [
          MockGlobalSpec.settings({ showLegend: true }),
          MockGlobalSpec.settings({ showLegend: true }),
          MockSeriesSpec.sunburst(specJSON),
        ],
        store,
      );
      expect(computeLegendSelector(store.getState())).toEqual([
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 0, value: 'A' },
          ],
          depth: 0,
          label: 'A',
          seriesIdentifiers: [{ key: 'A', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 0, value: 'A' },
            { index: 0, value: 'A' },
          ],
          depth: 1,
          label: 'A',
          seriesIdentifiers: [{ key: 'A', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 0, value: 'A' },
            { index: 1, value: 'B' },
          ],
          depth: 1,
          label: 'B',
          seriesIdentifiers: [{ key: 'B', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 1, value: 'B' },
          ],
          depth: 0,
          label: 'B',
          seriesIdentifiers: [{ key: 'B', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 1, value: 'B' },
            { index: 0, value: 'A' },
          ],
          depth: 1,
          label: 'A',
          seriesIdentifiers: [{ key: 'A', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 1, value: 'B' },
            { index: 1, value: 'B' },
          ],
          depth: 1,
          label: 'B',
          seriesIdentifiers: [{ key: 'B', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'C',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 2, value: 'C' },
          ],
          depth: 0,
          label: 'C',
          seriesIdentifiers: [{ key: 'C', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 2, value: 'C' },
            { index: 0, value: 'A' },
          ],
          depth: 1,
          label: 'A',
          seriesIdentifiers: [{ key: 'A', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            { index: 0, value: HIERARCHY_ROOT_KEY },
            { index: 2, value: 'C' },
            { index: 1, value: 'B' },
          ],
          depth: 1,
          label: 'B',
          seriesIdentifiers: [{ key: 'B', specId: 'spec1' }],
          keys: [],
        },
      ]);
    });

    it('special case: one input, one label', () => {
      MockStore.addSpecs(
        [
          MockGlobalSpec.settings({ showLegend: true }),
          MockSeriesSpec.sunburst({ ...specJSON, data: [{ cat1: 'A', cat2: 'A', val: 1 }] }),
        ],
        store,
      );
      expect(computeLegendSelector(store.getState())).toEqual([
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            {
              index: 0,
              value: HIERARCHY_ROOT_KEY,
            },
            {
              index: 0,
              value: 'A',
            },
          ],
          depth: 0,
          label: 'A',
          seriesIdentifiers: [{ key: 'A', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            {
              index: 0,
              value: HIERARCHY_ROOT_KEY,
            },
            {
              index: 0,
              value: 'A',
            },
            {
              index: 0,
              value: 'A',
            },
          ],

          depth: 1,
          label: 'A',
          seriesIdentifiers: [{ key: 'A', specId: 'spec1' }],
          keys: [],
        },
      ]);
    });

    it('special case: one input, two labels', () => {
      MockStore.addSpecs(
        [
          MockGlobalSpec.settings({ showLegend: true }),
          MockSeriesSpec.sunburst({ ...specJSON, data: [{ cat1: 'C', cat2: 'B', val: 1 }] }),
        ],
        store,
      );
      expect(computeLegendSelector(store.getState())).toEqual([
        {
          childId: 'C',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            {
              index: 0,
              value: HIERARCHY_ROOT_KEY,
            },
            {
              index: 0,
              value: 'C',
            },
          ],
          depth: 0,
          label: 'C',
          seriesIdentifiers: [{ key: 'C', specId: 'spec1' }],
          keys: [],
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          path: [
            { index: 0, value: NULL_SMALL_MULTIPLES_KEY },
            {
              index: 0,
              value: HIERARCHY_ROOT_KEY,
            },
            {
              index: 0,
              value: 'C',
            },
            {
              index: 0,
              value: 'B',
            },
          ],
          depth: 1,
          label: 'B',
          seriesIdentifiers: [{ key: 'B', specId: 'spec1' }],
          keys: [],
        },
      ]);
    });

    it('special case: no labels', () => {
      MockStore.addSpecs(
        [MockGlobalSpec.settings({ showLegend: true }), MockSeriesSpec.sunburst({ ...specJSON, data: [] })],
        store,
      );
      expect(getLegendItemsLabels(store.getState()).map((l) => l.label)).toEqual([]);
    });
  });
});
