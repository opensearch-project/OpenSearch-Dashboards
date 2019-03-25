import { getGroupId, getSpecId, GroupId } from '../../utils/ids';
import { ScaleType } from '../../utils/scales/scales';
import { RawDataSeries } from '../series';
import { BasicSeriesSpec, DomainRange } from '../specs';
import { BARCHART_1Y0G } from '../utils/test_dataset';
import {
  coerceYScaleTypes,
  getDataSeriesOnGroup,
  mergeYDomain,
  splitSpecsByGroupId,
  YBasicSeriesSpec,
} from './y_domain';

describe('Y Domain', () => {
  test('Should merge Y domain', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId: getGroupId('a'),
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId: 'a',
        domain: [2, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should merge Y domain different group', () => {
    const dataSeries1: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const dataSeries2: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries1);
    specDataSeries.set(getSpecId('b'), dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId: getGroupId('a'),
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: 'area',
          yScaleType: ScaleType.Log,
          groupId: getGroupId('b'),
          id: getSpecId('b'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [2, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
      {
        groupId: 'b',
        domain: [2, 10],
        scaleType: ScaleType.Log,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y domain same group all stacked', () => {
    const dataSeries1: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const dataSeries2: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries1);
    specDataSeries.set(getSpecId('b'), dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId: getGroupId('a'),
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: 'area',
          yScaleType: ScaleType.Log,
          groupId: getGroupId('a'),
          id: getSpecId('b'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [2, 17],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y domain same group partially stacked', () => {
    const dataSeries1: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const dataSeries2: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries1);
    specDataSeries.set(getSpecId('b'), dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId: getGroupId('a'),
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: 'area',
          yScaleType: ScaleType.Log,
          groupId: getGroupId('a'),
          id: getSpecId('b'),
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain).toEqual([
      {
        groupId: 'a',
        domain: [2, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
  });
  test('Should merge Y high volume of data', () => {
    const maxValues = 10000;
    const dataSeries1: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
      },
    ];
    const dataSeries2: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: new Array(maxValues).fill(0).map((d, i) => ({ x: i, y: i })),
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries1);
    specDataSeries.set(getSpecId('b'), dataSeries2);
    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId: getGroupId('a'),
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
        {
          seriesType: 'area',
          yScaleType: ScaleType.Log,
          groupId: getGroupId('a'),
          id: getSpecId('b'),
          yScaleToDataExtent: true,
        },
      ],
      new Map(),
    );
    expect(mergedDomain.length).toEqual(1);
  });
  test('Should split specs by groupId, two groups, non stacked', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group1', 'group2']);
    expect(groupValues.length).toBe(2);
    expect(groupValues[0].nonStacked).toEqual([spec1]);
    expect(groupValues[1].nonStacked).toEqual([spec2]);
    expect(groupValues[0].stacked).toEqual([]);
    expect(groupValues[1].stacked).toEqual([]);
  });
  test('Should split specs by groupId, two groups, stacked', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group1', 'group2']);
    expect(groupValues.length).toBe(2);
    expect(groupValues[0].stacked).toEqual([spec1]);
    expect(groupValues[1].stacked).toEqual([spec2]);
    expect(groupValues[0].nonStacked).toEqual([]);
    expect(groupValues[1].nonStacked).toEqual([]);
  });
  test('Should split specs by groupId, 1 group, stacked', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group']);
    expect(groupValues.length).toBe(1);
    expect(groupValues[0].stacked).toEqual([spec1, spec2]);
    expect(groupValues[0].nonStacked).toEqual([]);
  });
  test('Should 3 split specs by groupId, 2 group, semi/stacked', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec3: BasicSeriesSpec = {
      id: getSpecId('spec3'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const splittedSpecs = splitSpecsByGroupId([spec1, spec2, spec3]);
    const groupKeys = [...splittedSpecs.keys()];
    const groupValues = [...splittedSpecs.values()];
    expect(groupKeys).toEqual(['group1', 'group2']);
    expect(groupValues.length).toBe(2);
    expect(groupValues[0].stacked).toEqual([spec1, spec2]);
    expect(groupValues[0].nonStacked).toEqual([]);
    expect(groupValues[1].stacked).toEqual([spec3]);
    expect(groupValues[0].nonStacked).toEqual([]);
  });

  test('Should return a default Scale Linear for YScaleType when there are no specs', () => {
    const specs: Array<Pick<BasicSeriesSpec, 'yScaleType'>> = [];
    expect(coerceYScaleTypes(specs)).toBe(ScaleType.Linear);
  });

  test('Should getDataSeriesOnGroup for matching specs', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('b'), dataSeries);

    const specs: YBasicSeriesSpec[] = [
      {
        seriesType: 'area',
        yScaleType: ScaleType.Linear,
        groupId: getGroupId('a'),
        id: getSpecId('a'),
        stackAccessors: ['a'],
        yScaleToDataExtent: true,
      },
    ];

    const rawDataSeries = getDataSeriesOnGroup(specDataSeries, specs);
    expect(rawDataSeries).toEqual([]);
  });
  test('Should merge Y domain accounting for custom domain limits: complete bounded domain', () => {
    const groupId = getGroupId('a');

    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 0, max: 20 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId,
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [0, 20],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should merge Y domain accounting for custom domain limits: partial lower bounded domain', () => {
    const groupId = getGroupId('a');

    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 0 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId,
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [0, 12],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should not merge Y domain with invalid custom domain limits: partial lower bounded domain', () => {
    const groupId = getGroupId('a');

    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { min: 20 });

    const attemptToMerge = () => {
      mergeYDomain(
        specDataSeries,
        [
          {
            seriesType: 'area',
            yScaleType: ScaleType.Linear,
            groupId,
            id: getSpecId('a'),
            stackAccessors: ['a'],
            yScaleToDataExtent: true,
          },
        ],
        domainsByGroupId,
      );
    };

    const errorMessage = 'custom yDomain for a is invalid, custom min is greater than computed max';
    expect(attemptToMerge).toThrowError(errorMessage);
  });
  test('Should merge Y domain accounting for custom domain limits: partial upper bounded domain', () => {
    const groupId = getGroupId('a');

    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { max: 20 });

    const mergedDomain = mergeYDomain(
      specDataSeries,
      [
        {
          seriesType: 'area',
          yScaleType: ScaleType.Linear,
          groupId,
          id: getSpecId('a'),
          stackAccessors: ['a'],
          yScaleToDataExtent: true,
        },
      ],
      domainsByGroupId,
    );
    expect(mergedDomain).toEqual([
      {
        type: 'yDomain',
        groupId,
        domain: [2, 20],
        scaleType: ScaleType.Linear,
        isBandScale: false,
      },
    ]);
  });
  test('Should not merge Y domain with invalid custom domain limits: partial upper bounded domain', () => {
    const groupId = getGroupId('a');

    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 5 }],
      },
      {
        specId: getSpecId('a'),
        key: [''],
        seriesColorKey: '',
        data: [{ x: 1, y: 2 }, { x: 4, y: 7 }],
      },
    ];
    const specDataSeries = new Map();
    specDataSeries.set(getSpecId('a'), dataSeries);
    const domainsByGroupId = new Map<GroupId, DomainRange>();
    domainsByGroupId.set(groupId, { max: -1 });

    const attemptToMerge = () => {
      mergeYDomain(
        specDataSeries,
        [
          {
            seriesType: 'area',
            yScaleType: ScaleType.Linear,
            groupId,
            id: getSpecId('a'),
            stackAccessors: ['a'],
            yScaleToDataExtent: true,
          },
        ],
        domainsByGroupId,
      );
    };

    const errorMessage = 'custom yDomain for a is invalid, computed min is greater than custom max';
    expect(attemptToMerge).toThrowError(errorMessage);
  });
});
