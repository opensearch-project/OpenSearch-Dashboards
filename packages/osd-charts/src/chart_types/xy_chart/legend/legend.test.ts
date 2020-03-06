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

import { ScaleType } from '../../../scales';
import { computeLegend } from './legend';
import { SeriesCollectionValue, getSeriesName } from '../utils/series';
import { AxisSpec, BasicSeriesSpec, SeriesTypes } from '../utils/specs';
import { Position } from '../../../utils/commons';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';

const nullDisplayValue = {
  formatted: {
    y0: null,
    y1: null,
  },
  raw: {
    y0: null,
    y1: null,
  },
};
const seriesCollectionValue1a = {
  seriesIdentifier: {
    specId: 'spec1',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['y1'],
    key: 'seriesCollectionValue1a',
  },
};
const seriesCollectionValue1b = {
  seriesIdentifier: {
    specId: 'spec1',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['a', 'b', 'y1'],
    key: 'seriesCollectionValue1b',
  },
};
const seriesCollectionValue2a = {
  seriesIdentifier: {
    specId: 'spec2',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['y1'],
    key: 'seriesCollectionValue2a',
  },
};
const seriesCollectionValue2b = {
  seriesIdentifier: {
    specId: 'spec3',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['c', 'd', 'y1'],
    key: 'seriesCollectionValue2b',
  },
};
const spec1: BasicSeriesSpec = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Series,
  id: 'spec1',
  name: 'Spec 1 title',
  groupId: 'group',
  seriesType: SeriesTypes.Line,
  yScaleType: ScaleType.Log,
  xScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  yScaleToDataExtent: false,
  data: [],
  hideInLegend: false,
};
const spec2: BasicSeriesSpec = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Series,
  id: 'spec2',
  groupId: 'group',
  seriesType: SeriesTypes.Line,
  yScaleType: ScaleType.Log,
  xScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  yScaleToDataExtent: false,
  data: [],
  hideInLegend: false,
};

const axesSpecs: AxisSpec[] = [];
const axisSpec: AxisSpec = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Axis,
  id: 'axis1',
  groupId: 'group1',
  hide: false,
  showOverlappingTicks: false,
  showOverlappingLabels: false,
  position: Position.Left,
  tickSize: 10,
  tickPadding: 10,
  tickFormat: (value: any) => {
    return `${value}`;
  },
};
axesSpecs.push(axisSpec);

describe('Legends', () => {
  const seriesCollection = new Map<string, SeriesCollectionValue>();
  const seriesCollectionMap = new Map<string, string>();
  const specs = [spec1, spec2];
  seriesCollectionMap.set('seriesCollectionValue1a', 'red');
  seriesCollectionMap.set('seriesCollectionValue1b', 'blue');
  seriesCollectionMap.set('seriesCollectionValue2a', 'green');
  seriesCollectionMap.set('seriesCollectionValue2b', 'white');
  beforeEach(() => {
    seriesCollection.clear();
  });
  it('compute legend for a single series', () => {
    seriesCollection.set('seriesCollectionValue1a', seriesCollectionValue1a);
    const legend = computeLegend(seriesCollection, seriesCollectionMap, specs, 'violet', axesSpecs);
    const expected = [
      {
        color: 'red',
        name: 'Spec 1 title',
        seriesIdentifier: {
          seriesKeys: ['y1'],
          specId: 'spec1',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          key: 'seriesCollectionValue1a',
        },
        isSeriesVisible: true,
        isLegendItemVisible: true,
        key: 'seriesCollectionValue1a',
        displayValue: nullDisplayValue,
        banded: undefined,
      },
    ];
    expect(Array.from(legend.values())).toEqual(expected);
  });
  it('compute legend for a single spec but with multiple series', () => {
    seriesCollection.set('seriesCollectionValue1a', seriesCollectionValue1a);
    seriesCollection.set('seriesCollectionValue1b', seriesCollectionValue1b);
    const legend = computeLegend(seriesCollection, seriesCollectionMap, specs, 'violet', axesSpecs);
    const expected = [
      {
        color: 'red',
        name: 'Spec 1 title',
        seriesIdentifier: {
          seriesKeys: ['y1'],
          specId: 'spec1',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          key: 'seriesCollectionValue1a',
        },
        isSeriesVisible: true,
        isLegendItemVisible: true,
        key: 'seriesCollectionValue1a',
        displayValue: nullDisplayValue,
        banded: undefined,
      },
      {
        color: 'blue',
        name: 'a - b',
        seriesIdentifier: {
          seriesKeys: ['a', 'b', 'y1'],
          specId: 'spec1',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          key: 'seriesCollectionValue1b',
        },
        isSeriesVisible: true,
        isLegendItemVisible: true,
        key: 'seriesCollectionValue1b',
        displayValue: nullDisplayValue,
        banded: undefined,
      },
    ];
    expect(Array.from(legend.values())).toEqual(expected);
  });
  it('compute legend for multiple specs', () => {
    seriesCollection.set('seriesCollectionValue1a', seriesCollectionValue1a);
    seriesCollection.set('seriesCollectionValue2a', seriesCollectionValue2a);
    const legend = computeLegend(seriesCollection, seriesCollectionMap, specs, 'violet', axesSpecs);
    const expected = [
      {
        color: 'red',
        name: 'Spec 1 title',
        seriesIdentifier: {
          seriesKeys: ['y1'],
          specId: 'spec1',
          splitAccessors: new Map(),
          yAccessor: 'y1',
          key: 'seriesCollectionValue1a',
        },
        isSeriesVisible: true,
        isLegendItemVisible: true,
        key: 'seriesCollectionValue1a',
        displayValue: nullDisplayValue,
        banded: undefined,
      },
      {
        color: 'green',
        name: 'spec2',
        seriesIdentifier: {
          seriesKeys: ['y1'],
          specId: 'spec2',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          key: 'seriesCollectionValue2a',
        },
        isSeriesVisible: true,
        isLegendItemVisible: true,
        key: 'seriesCollectionValue2a',
        displayValue: nullDisplayValue,
        banded: undefined,
      },
    ];
    expect(Array.from(legend.values())).toEqual(expected);
  });
  it('empty legend for missing spec', () => {
    seriesCollection.set('seriesCollectionValue2b', seriesCollectionValue2b);
    const legend = computeLegend(seriesCollection, seriesCollectionMap, specs, 'violet', axesSpecs);
    expect(legend.size).toEqual(0);
  });
  it('compute legend with default color for missing series color', () => {
    seriesCollection.set('seriesCollectionValue1a', seriesCollectionValue1a);
    const emptyColorMap = new Map<string, string>();
    const legend = computeLegend(seriesCollection, emptyColorMap, specs, 'violet', axesSpecs);
    const expected = [
      {
        color: 'violet',
        name: 'Spec 1 title',
        banded: undefined,
        seriesIdentifier: {
          seriesKeys: ['y1'],
          specId: 'spec1',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          key: 'seriesCollectionValue1a',
        },
        isSeriesVisible: true,
        isLegendItemVisible: true,
        key: 'seriesCollectionValue1a',
        displayValue: nullDisplayValue,
      },
    ];
    expect(Array.from(legend.values())).toEqual(expected);
  });
  it('default all series legend items to visible when deselectedDataSeries is null', () => {
    seriesCollection.set('seriesCollectionValue1a', seriesCollectionValue1a);
    seriesCollection.set('seriesCollectionValue1b', seriesCollectionValue1b);
    seriesCollection.set('seriesCollectionValue2a', seriesCollectionValue2a);
    seriesCollection.set('seriesCollectionValue2b', seriesCollectionValue2b);

    const emptyColorMap = new Map<string, string>();

    const legend = computeLegend(seriesCollection, emptyColorMap, specs, 'violet', axesSpecs);

    const visibility = [...legend.values()].map((item) => item.isSeriesVisible);

    expect(visibility).toEqual([true, true, true]);
  });
  it('selectively sets series to visible when there are deselectedDataSeries items', () => {
    seriesCollection.set('seriesCollectionValue1a', seriesCollectionValue1a);
    seriesCollection.set('seriesCollectionValue1b', seriesCollectionValue1b);
    seriesCollection.set('seriesCollectionValue2a', seriesCollectionValue2a);
    seriesCollection.set('seriesCollectionValue2b', seriesCollectionValue2b);

    const emptyColorMap = new Map<string, string>();
    const deselectedDataSeries = [seriesCollectionValue1a.seriesIdentifier, seriesCollectionValue1b.seriesIdentifier];

    const legend = computeLegend(seriesCollection, emptyColorMap, specs, 'violet', axesSpecs, deselectedDataSeries);

    const visibility = [...legend.values()].map((item) => item.isSeriesVisible);
    expect(visibility).toEqual([false, false, true]);
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
  it('use the splitted value as name if has a single series and splitSeries is used', () => {
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
});
