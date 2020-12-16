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

import { MockSeriesSpec } from '../../mocks/specs';
import { MockStore } from '../../mocks/store';
import { GlobalChartState } from '../../state/chart_state';
import { LegendItemLabel } from '../../state/selectors/get_legend_items_labels';
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
      MockStore.addSpecs([MockSeriesSpec.sunburst(specJSON)], store);
      expect(getLegendItemsLabels(store.getState()).sort(ascByLabel)).toEqual([
        { depth: 2, label: 'A' },
        { depth: 2, label: 'B' },
        { depth: 1, label: 'C' },
      ]);
    });

    it('special case: one input, one label', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst({ ...specJSON, data: [{ cat1: 'A', cat2: 'A', val: 1 }] })], store);
      expect(getLegendItemsLabels(store.getState())).toEqual([{ depth: 2, label: 'A' }]);
    });

    it('special case: one input, two labels', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst({ ...specJSON, data: [{ cat1: 'C', cat2: 'B', val: 1 }] })], store);
      expect(getLegendItemsLabels(store.getState()).sort(ascByLabel)).toEqual([
        { depth: 2, label: 'B' },
        { depth: 1, label: 'C' },
      ]);
    });

    it('special case: no labels', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst({ ...specJSON, data: [] })], store);
      expect(getLegendItemsLabels(store.getState()).map((l) => l.label)).toEqual([]);
    });
  });

  describe('getLegendItems', () => {
    // todo discuss question marks about testing this selector, and also about unification with `get_legend_items_labels.test.ts`

    it('all distinct labels are present', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst(specJSON)], store);
      expect(computeLegendSelector(store.getState())).toEqual([
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'A',
          depth: 0,
          label: 'A',
          seriesIdentifier: { key: 'A', specId: 'spec1' },
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'A',
          depth: 1,
          label: 'A',
          seriesIdentifier: { key: 'A', specId: 'spec1' },
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'B',
          depth: 1,
          label: 'B',
          seriesIdentifier: { key: 'B', specId: 'spec1' },
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'B',
          depth: 0,
          label: 'B',
          seriesIdentifier: { key: 'B', specId: 'spec1' },
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'A',
          depth: 1,
          label: 'A',
          seriesIdentifier: { key: 'A', specId: 'spec1' },
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'B',
          depth: 1,
          label: 'B',
          seriesIdentifier: { key: 'B', specId: 'spec1' },
        },
        {
          childId: 'C',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'C',
          depth: 0,
          label: 'C',
          seriesIdentifier: { key: 'C', specId: 'spec1' },
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'A',
          depth: 1,
          label: 'A',
          seriesIdentifier: { key: 'A', specId: 'spec1' },
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'B',
          depth: 1,
          label: 'B',
          seriesIdentifier: { key: 'B', specId: 'spec1' },
        },
      ]);
    });

    it('special case: one input, one label', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst({ ...specJSON, data: [{ cat1: 'A', cat2: 'A', val: 1 }] })], store);
      expect(computeLegendSelector(store.getState())).toEqual([
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'A',
          depth: 0,
          label: 'A',
          seriesIdentifier: { key: 'A', specId: 'spec1' },
        },
        {
          childId: 'A',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'A',
          depth: 1,
          label: 'A',
          seriesIdentifier: { key: 'A', specId: 'spec1' },
        },
      ]);
    });

    it('special case: one input, two labels', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst({ ...specJSON, data: [{ cat1: 'C', cat2: 'B', val: 1 }] })], store);
      expect(computeLegendSelector(store.getState())).toEqual([
        {
          childId: 'C',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'C',
          depth: 0,
          label: 'C',
          seriesIdentifier: { key: 'C', specId: 'spec1' },
        },
        {
          childId: 'B',
          color: 'rgba(128, 0, 0, 0.5)',
          dataName: 'B',
          depth: 1,
          label: 'B',
          seriesIdentifier: { key: 'B', specId: 'spec1' },
        },
      ]);
    });

    it('special case: no labels', () => {
      MockStore.addSpecs([MockSeriesSpec.sunburst({ ...specJSON, data: [] })], store);
      expect(getLegendItemsLabels(store.getState()).map((l) => l.label)).toEqual([]);
    });
  });
});
