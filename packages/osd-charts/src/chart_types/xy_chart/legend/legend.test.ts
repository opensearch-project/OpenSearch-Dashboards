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

import { ChartType } from '../..';
import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs/specs';
import { MockStore } from '../../../mocks/store/store';
import { ScaleType } from '../../../scales/constants';
import { SpecType } from '../../../specs/constants';
import { onToggleDeselectSeriesAction } from '../../../state/actions/legend';
import { GlobalChartState } from '../../../state/chart_state';
import { Position, RecursivePartial } from '../../../utils/common';
import { AxisStyle } from '../../../utils/themes/theme';
import { computeLegendSelector } from '../state/selectors/compute_legend';
import { computeSeriesDomainsSelector } from '../state/selectors/compute_series_domains';
import { getSeriesName } from '../utils/series';
import { AxisSpec, BasicSeriesSpec, SeriesType } from '../utils/specs';
import { getLegendExtra } from './legend';

const nullDisplayValue = {
  formatted: null,
  raw: null,
  legendSizingLabel: null,
};

const spec1: BasicSeriesSpec = {
  chartType: ChartType.XYAxis,
  specType: SpecType.Series,
  id: 'spec1',
  name: 'Spec 1 title',
  groupId: 'group',
  seriesType: SeriesType.Line,
  yScaleType: ScaleType.Log,
  xScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  data: [],
  hideInLegend: false,
};
const spec2: BasicSeriesSpec = {
  chartType: ChartType.XYAxis,
  specType: SpecType.Series,
  id: 'spec2',
  groupId: 'group',
  seriesType: SeriesType.Line,
  yScaleType: ScaleType.Log,
  xScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  data: [],
  hideInLegend: false,
};

const style: RecursivePartial<AxisStyle> = {
  tickLine: {
    size: 10,
    padding: 10,
  },
};
const axesSpecs: AxisSpec[] = [];
const axisSpec: AxisSpec = {
  chartType: ChartType.XYAxis,
  specType: SpecType.Axis,
  id: 'axis1',
  groupId: 'group1',
  hide: false,
  showOverlappingTicks: false,
  showOverlappingLabels: false,
  position: Position.Left,
  style,
  tickFormat: (value: any) => `${value}`,
};
axesSpecs.push(axisSpec);

describe('Legends', () => {
  let store: Store<GlobalChartState>;

  beforeEach(() => {
    store = MockStore.default();
  });
  it('compute legend for a single series', () => {
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          name: 'Spec 1 title',
          yAccessors: ['y1'],
          data: [{ x: 0, y1: 1 }],
        }),
        MockGlobalSpec.settings({ showLegend: true, theme: { colors: { vizColors: ['red'] } } }),
      ],
      store,
    );
    const legend = computeLegendSelector(store.getState());
    const expected = {
      color: 'red',
      label: 'Spec 1 title',
      childId: 'y1',
      isItemHidden: false,
      isSeriesHidden: false,
      isToggleable: true,
      defaultExtra: nullDisplayValue,
      path: [{ index: 0, value: 'groupId{__global__}spec{spec1}yAccessor{y1}splitAccessors{}' }],
    };
    expect(legend[0]).toMatchObject(expected);
  });
  it('compute legend for a single spec but with multiple series', () => {
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          yAccessors: ['y1', 'y2'],
          splitSeriesAccessors: ['g'],
          data: [
            {
              x: 0,
              y1: 1,
              g: 'a',
              y2: 3,
            },
            {
              x: 0,
              y1: 1,
              g: 'b',
              y2: 3,
            },
          ],
        }),
        MockGlobalSpec.settings({
          showLegend: true,
          theme: { colors: { vizColors: ['red', 'blue', 'violet', 'green'] } },
        }),
      ],
      store,
    );
    const legend = computeLegendSelector(store.getState());

    const expected = [
      {
        color: 'red',
        label: 'a - y1',
        childId: 'y1',
        isItemHidden: false,
        isSeriesHidden: false,
        isToggleable: true,
        defaultExtra: nullDisplayValue,
        path: [{ index: 0, value: 'groupId{__global__}spec{spec1}yAccessor{y1}splitAccessors{g-a}' }],
      },
      {
        color: 'blue',
        label: 'a - y2',
        childId: 'y1',
        isItemHidden: false,
        isSeriesHidden: false,
        isToggleable: true,
        defaultExtra: nullDisplayValue,
        path: [{ index: 0, value: 'groupId{__global__}spec{spec1}yAccessor{y2}splitAccessors{g-a}' }],
      },
      {
        color: 'violet',
        label: 'b - y1',
        childId: 'y1',
        isItemHidden: false,
        isSeriesHidden: false,
        isToggleable: true,
        defaultExtra: nullDisplayValue,
        path: [{ index: 0, value: 'groupId{__global__}spec{spec1}yAccessor{y1}splitAccessors{g-b}' }],
      },
      {
        color: 'green',
        label: 'b - y2',
        childId: 'y1',
        isItemHidden: false,
        isSeriesHidden: false,
        isToggleable: true,
        defaultExtra: nullDisplayValue,
        path: [{ index: 0, value: 'groupId{__global__}spec{spec1}yAccessor{y2}splitAccessors{g-b}' }],
      },
    ];
    expect(legend).toHaveLength(4);
    expect(legend).toMatchObject(expected);
  });
  it('compute legend for multiple specs', () => {
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          id: 'spec1',
          data: [
            {
              x: 0,
              y: 1,
            },
          ],
        }),
        MockSeriesSpec.bar({
          id: 'spec2',
          data: [
            {
              x: 0,
              y: 1,
            },
          ],
        }),
        MockGlobalSpec.settings({
          showLegend: true,
          theme: { colors: { vizColors: ['red', 'blue'] } },
        }),
      ],
      store,
    );
    const legend = computeLegendSelector(store.getState());
    const expected = [
      {
        color: 'red',
        label: 'spec1',
        childId: 'y1',
      },
      {
        color: 'blue',
        label: 'spec2',
        childId: 'y1',
        isItemHidden: false,
        isSeriesHidden: false,
        isToggleable: true,
        defaultExtra: nullDisplayValue,
        path: [{ index: 0, value: 'groupId{__global__}spec{spec2}yAccessor{y}splitAccessors{}' }],
      },
    ];
    expect(legend).toHaveLength(2);
    expect(legend).toMatchObject(expected);
  });

  it('default all series legend items to visible when deselectedDataSeries is null', () => {
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          id: 'spec1',
          data: [
            {
              x: 0,
              y: 1,
            },
          ],
        }),
        MockSeriesSpec.bar({
          id: 'spec2',
          data: [
            {
              x: 0,
              y: 1,
            },
          ],
        }),
        MockGlobalSpec.settings({
          showLegend: true,
          theme: { colors: { vizColors: ['red', 'blue'] } },
        }),
      ],
      store,
    );
    const legend = computeLegendSelector(store.getState());

    const visibility = legend.map((item) => !item.isSeriesHidden);

    expect(visibility).toEqual([true, true]);
  });
  it('selectively sets series to visible when there are deselectedDataSeries items', () => {
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          id: 'spec1',
          data: [
            {
              x: 0,
              y: 1,
            },
          ],
        }),
        MockSeriesSpec.bar({
          id: 'spec2',
          data: [
            {
              x: 0,
              y: 1,
            },
          ],
        }),
        MockGlobalSpec.settings({
          showLegend: true,
          theme: { colors: { vizColors: ['red', 'blue'] } },
        }),
      ],
      store,
    );
    const {
      formattedDataSeries: [{ key, specId }],
    } = computeSeriesDomainsSelector(store.getState());

    store.dispatch(onToggleDeselectSeriesAction([{ key, specId }]));
    const legend = computeLegendSelector(store.getState());
    const visibility = legend.map((item) => !item.isSeriesHidden);
    expect(visibility).toEqual([false, true]);
  });
  it('returns the right series name for a color series', () => {
    const seriesIdentifier1 = {
      specId: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['y1'],
      key: '',
    };
    const seriesIdentifier2 = {
      specId: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'y1'],
      key: '',
    };

    // null removed, seriesIdentifier has to be at least an empty array
    let name = getSeriesName(seriesIdentifier1, true, false);
    expect(name).toBe('');
    name = getSeriesName(seriesIdentifier1, true, false, spec1);
    expect(name).toBe('Spec 1 title');
    name = getSeriesName(seriesIdentifier1, true, false, spec2);
    expect(name).toBe('spec2');
    name = getSeriesName(seriesIdentifier2, true, false, spec1);
    expect(name).toBe('Spec 1 title');
    name = getSeriesName(seriesIdentifier2, true, false, spec2);
    expect(name).toBe('spec2');

    name = getSeriesName(seriesIdentifier1, false, false, spec1);
    expect(name).toBe('Spec 1 title');
    name = getSeriesName(seriesIdentifier1, false, false, spec2);
    expect(name).toBe('spec2');
    name = getSeriesName(seriesIdentifier2, false, false, spec1);
    expect(name).toBe('a - b');
    name = getSeriesName(seriesIdentifier2, false, false, spec2);
    expect(name).toBe('a - b');

    name = getSeriesName(seriesIdentifier1, true, false, spec1);
    expect(name).toBe('Spec 1 title');
    name = getSeriesName(seriesIdentifier1, true, false, spec2);
    expect(name).toBe('spec2');
    name = getSeriesName(seriesIdentifier1, true, false);
    expect(name).toBe('');
    name = getSeriesName(seriesIdentifier1, true, false, spec1);
    expect(name).toBe('Spec 1 title');
    name = getSeriesName(seriesIdentifier1, true, false, spec2);
    expect(name).toBe('spec2');
  });
  it('use the split value as name if has a single series and splitSeries is used', () => {
    const seriesIdentifier1 = {
      specId: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['y1'],
      key: '',
    };
    const seriesIdentifier2 = {
      specId: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'y1'],
      key: '',
    };
    const seriesIdentifier3 = {
      specId: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'y1'],
      key: '',
    };

    const specWithSplit: BasicSeriesSpec = {
      ...spec1,
      splitSeriesAccessors: ['g'],
    };
    let name = getSeriesName(seriesIdentifier1, true, false, specWithSplit);
    expect(name).toBe('Spec 1 title');

    name = getSeriesName(seriesIdentifier3, true, false, specWithSplit);
    expect(name).toBe('a');

    // happens when we have multiple values in splitSeriesAccessor
    // or we have also multiple yAccessors
    name = getSeriesName(seriesIdentifier2, true, false, specWithSplit);
    expect(name).toBe('a - b');

    // happens when the value of a splitSeriesAccessor is null
    name = getSeriesName(seriesIdentifier1, true, false, specWithSplit);
    expect(name).toBe('Spec 1 title');

    name = getSeriesName(seriesIdentifier1, false, false, specWithSplit);
    expect(name).toBe('Spec 1 title');
  });
  it('should return correct legendSizingLabel with linear scale and showExtraLegend set to true', () => {
    const formatter = (d: string | number) => `${Number(d).toFixed(2)} dogs`;
    const lastValues = { y0: null, y1: 14 };
    const showExtraLegend = true;
    const xScaleIsLinear = ScaleType.Linear;

    expect(getLegendExtra(showExtraLegend, xScaleIsLinear, formatter, 'y1', lastValues)).toMatchObject({
      raw: 14,
      formatted: '14.00 dogs',
      legendSizingLabel: '14.00 dogs',
    });
  });
  it('should return formatted to null with ordinal scale and showExtraLegend set to true', () => {
    const formatter = (d: string | number) => `${Number(d).toFixed(2)} dogs`;
    const lastValues = { y0: null, y1: 14 };

    expect(getLegendExtra(true, ScaleType.Ordinal, formatter, 'y1', lastValues)).toMatchObject({
      raw: 14,
      formatted: null,
      legendSizingLabel: '14.00 dogs',
    });
  });
  it('should return legendSizingLabel null with showLegendExtra set to false', () => {
    const formatter = (d: string | number) => `${Number(d).toFixed(2)} dogs`;
    const lastValues = { y0: null, y1: 14 };
    const showLegendExtra = false;

    expect(getLegendExtra(showLegendExtra, ScaleType.Ordinal, formatter, 'y1', lastValues)).toMatchObject({
      raw: null,
      formatted: null,
      legendSizingLabel: null,
    });
  });
});
