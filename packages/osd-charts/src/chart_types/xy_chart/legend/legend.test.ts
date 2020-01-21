import { getAxisId, getGroupId, getSpecId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { computeLegend } from './legend';
import { SeriesCollectionValue, getSeriesLabel } from '../utils/series';
import { AxisSpec, BasicSeriesSpec, Position, SeriesTypes } from '../utils/specs';
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
    specId: getSpecId('spec1'),
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['y1'],
    key: 'seriesCollectionValue1a',
  },
};
const seriesCollectionValue1b = {
  seriesIdentifier: {
    specId: getSpecId('spec1'),
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['a', 'b', 'y1'],
    key: 'seriesCollectionValue1b',
  },
};
const seriesCollectionValue2a = {
  seriesIdentifier: {
    specId: getSpecId('spec2'),
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['y1'],
    key: 'seriesCollectionValue2a',
  },
};
const seriesCollectionValue2b = {
  seriesIdentifier: {
    specId: getSpecId('spec3'),
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: ['c', 'd', 'y1'],
    key: 'seriesCollectionValue2b',
  },
};
const spec1: BasicSeriesSpec = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Series,
  id: getSpecId('spec1'),
  name: 'Spec 1 title',
  groupId: getGroupId('group'),
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
  id: getSpecId('spec2'),
  groupId: getGroupId('group'),
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
  id: getAxisId('axis1'),
  groupId: getGroupId('group1'),
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
        label: 'Spec 1 title',
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
        label: 'Spec 1 title',
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
        label: 'a - b',
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
        label: 'Spec 1 title',
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
        label: 'spec2',
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
        label: 'Spec 1 title',
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
  it('returns the right series label for a color series', () => {
    const seriesIdentifier1 = {
      specId: getSpecId(''),
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['y1'],
      key: '',
    };
    const seriesIdentifier2 = {
      specId: getSpecId(''),
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'y1'],
      key: '',
    };

    // null removed, seriesIdentifier has to be at least an empty array
    let label = getSeriesLabel(seriesIdentifier1, true, false);
    expect(label).toBe('');
    label = getSeriesLabel(seriesIdentifier1, true, false, spec1);
    expect(label).toBe('Spec 1 title');
    label = getSeriesLabel(seriesIdentifier1, true, false, spec2);
    expect(label).toBe('spec2');
    label = getSeriesLabel(seriesIdentifier2, true, false, spec1);
    expect(label).toBe('Spec 1 title');
    label = getSeriesLabel(seriesIdentifier2, true, false, spec2);
    expect(label).toBe('spec2');

    label = getSeriesLabel(seriesIdentifier1, false, false, spec1);
    expect(label).toBe('Spec 1 title');
    label = getSeriesLabel(seriesIdentifier1, false, false, spec2);
    expect(label).toBe('spec2');
    label = getSeriesLabel(seriesIdentifier2, false, false, spec1);
    expect(label).toBe('a - b');
    label = getSeriesLabel(seriesIdentifier2, false, false, spec2);
    expect(label).toBe('a - b');

    label = getSeriesLabel(seriesIdentifier1, true, false, spec1);
    expect(label).toBe('Spec 1 title');
    label = getSeriesLabel(seriesIdentifier1, true, false, spec2);
    expect(label).toBe('spec2');
    label = getSeriesLabel(seriesIdentifier1, true, false);
    expect(label).toBe('');
    label = getSeriesLabel(seriesIdentifier1, true, false, spec1);
    expect(label).toBe('Spec 1 title');
    label = getSeriesLabel(seriesIdentifier1, true, false, spec2);
    expect(label).toBe('spec2');
  });
  it('use the splitted value as label if has a single series and splitSeries is used', () => {
    const seriesIdentifier1 = {
      specId: getSpecId(''),
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['y1'],
      key: '',
    };
    const seriesIdentifier2 = {
      specId: getSpecId(''),
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'y1'],
      key: '',
    };
    const seriesIdentifier3 = {
      specId: getSpecId(''),
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'y1'],
      key: '',
    };

    const specWithSplit: BasicSeriesSpec = {
      ...spec1,
      splitSeriesAccessors: ['g'],
    };
    let label = getSeriesLabel(seriesIdentifier1, true, false, specWithSplit);
    expect(label).toBe('Spec 1 title');

    label = getSeriesLabel(seriesIdentifier3, true, false, specWithSplit);
    expect(label).toBe('a');

    // happens when we have multiple values in splitSeriesAccessor
    // or we have also multiple yAccessors
    label = getSeriesLabel(seriesIdentifier2, true, false, specWithSplit);
    expect(label).toBe('a - b');

    // happens when the value of a splitSeriesAccessor is null
    label = getSeriesLabel(seriesIdentifier1, true, false, specWithSplit);
    expect(label).toBe('Spec 1 title');

    label = getSeriesLabel(seriesIdentifier1, false, false, specWithSplit);
    expect(label).toBe('Spec 1 title');
  });
});
