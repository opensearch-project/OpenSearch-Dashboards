import { ScaleType } from '../../../utils/scales/scales';
import { AxisSpec, BarSeriesSpec, Position, SpecTypes, SeriesTypes } from '../utils/specs';
import { formatTooltip } from './tooltip';
import { BarGeometry } from '../../../utils/geometry';
import { ChartTypes } from '../..';

describe('Tooltip formatting', () => {
  const SPEC_ID_1 = 'bar_1';
  const SPEC_GROUP_ID_1 = 'bar_group_1';
  const SPEC_1: BarSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: SPEC_ID_1,
    groupId: SPEC_GROUP_ID_1,
    seriesType: SeriesTypes.Bar,
    data: [],
    xAccessor: 0,
    yAccessors: [1],
    yScaleToDataExtent: false,
    yScaleType: ScaleType.Linear,
    xScaleType: ScaleType.Linear,
  };
  const bandedSpec = {
    ...SPEC_1,
    y0Accessors: [1],
  };
  const YAXIS_SPEC: AxisSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Axis,
    id: 'axis_1',
    groupId: SPEC_GROUP_ID_1,
    hide: false,
    position: Position.Left,
    showOverlappingLabels: false,
    showOverlappingTicks: false,
    tickPadding: 0,
    tickSize: 0,
    tickFormat: (d) => `${d}`,
  };
  const seriesStyle = {
    rect: {
      opacity: 1,
    },
    rectBorder: {
      strokeWidth: 1,
      visible: false,
    },
    displayValue: {
      fill: 'black',
      fontFamily: '',
      fontSize: 2,
      offsetX: 0,
      offsetY: 0,
      padding: 2,
    },
  };
  const indexedGeometry: BarGeometry = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: 'blue',
    seriesIdentifier: {
      specId: SPEC_ID_1,
      key: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: [],
    },
    value: {
      x: 1,
      y: 10,
      accessor: 'y1',
    },
    seriesStyle,
  };
  const indexedBandedGeometry: BarGeometry = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: 'blue',
    seriesIdentifier: {
      specId: SPEC_ID_1,
      key: '',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: [],
    },
    value: {
      x: 1,
      y: 10,
      accessor: 'y1',
    },
    seriesStyle,
  };

  test('format simple tooltip', () => {
    const tooltipValue = formatTooltip(indexedGeometry, SPEC_1, false, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.yAccessor).toBe('y1');
    expect(tooltipValue.name).toBe('bar_1');
    expect(tooltipValue.isXValue).toBe(false);
    expect(tooltipValue.isHighlighted).toBe(false);
    expect(tooltipValue.color).toBe('blue');
    expect(tooltipValue.value).toBe('10');
  });
  it('should set name as spec name when provided', () => {
    const name = 'test - spec';
    const tooltipValue = formatTooltip(indexedBandedGeometry, { ...SPEC_1, name }, false, false, false, YAXIS_SPEC);
    expect(tooltipValue.name).toBe(name);
  });
  it('should set name as spec id when name is not provided', () => {
    const tooltipValue = formatTooltip(indexedBandedGeometry, SPEC_1, false, false, false, YAXIS_SPEC);
    expect(tooltipValue.name).toBe(SPEC_1.id);
  });
  test('format banded tooltip - upper', () => {
    const tooltipValue = formatTooltip(indexedBandedGeometry, bandedSpec, false, false, false, YAXIS_SPEC);
    expect(tooltipValue.name).toBe('bar_1 - upper');
  });
  test('format banded tooltip - y1AccessorFormat', () => {
    const tooltipValue = formatTooltip(
      indexedBandedGeometry,
      { ...bandedSpec, y1AccessorFormat: ' [max]' },
      false,
      false,
      false,
      YAXIS_SPEC,
    );
    expect(tooltipValue.name).toBe('bar_1 [max]');
  });
  test('format banded tooltip - y1AccessorFormat as function', () => {
    const tooltipValue = formatTooltip(
      indexedBandedGeometry,
      { ...bandedSpec, y1AccessorFormat: (label) => `[max] ${label}` },
      false,
      false,
      false,
      YAXIS_SPEC,
    );
    expect(tooltipValue.name).toBe('[max] bar_1');
  });
  test('format banded tooltip - lower', () => {
    const tooltipValue = formatTooltip(
      {
        ...indexedBandedGeometry,
        value: {
          ...indexedBandedGeometry.value,
          accessor: 'y0',
        },
      },
      bandedSpec,
      false,
      false,
      false,
      YAXIS_SPEC,
    );
    expect(tooltipValue.name).toBe('bar_1 - lower');
  });
  test('format banded tooltip - y0AccessorFormat', () => {
    const tooltipValue = formatTooltip(
      {
        ...indexedBandedGeometry,
        value: {
          ...indexedBandedGeometry.value,
          accessor: 'y0',
        },
      },
      { ...bandedSpec, y0AccessorFormat: ' [min]' },
      false,
      false,
      false,
      YAXIS_SPEC,
    );
    expect(tooltipValue.name).toBe('bar_1 [min]');
  });
  test('format banded tooltip - y0AccessorFormat as function', () => {
    const tooltipValue = formatTooltip(
      {
        ...indexedBandedGeometry,
        value: {
          ...indexedBandedGeometry.value,
          accessor: 'y0',
        },
      },
      { ...bandedSpec, y0AccessorFormat: (label) => `[min] ${label}` },
      false,
      false,
      false,
      YAXIS_SPEC,
    );
    expect(tooltipValue.name).toBe('[min] bar_1');
  });
  test('format tooltip with seriesKeys name', () => {
    const geometry: BarGeometry = {
      ...indexedGeometry,
      seriesIdentifier: {
        specId: SPEC_ID_1,
        key: '',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['y1'],
      },
    };
    const tooltipValue = formatTooltip(geometry, SPEC_1, false, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.yAccessor).toBe('y1');
    expect(tooltipValue.name).toBe('bar_1');
    expect(tooltipValue.isXValue).toBe(false);
    expect(tooltipValue.isHighlighted).toBe(false);
    expect(tooltipValue.color).toBe('blue');
    expect(tooltipValue.value).toBe('10');
  });
  test('format y0 tooltip', () => {
    const geometry: BarGeometry = {
      ...indexedGeometry,
      value: {
        ...indexedGeometry.value,
        accessor: 'y0',
      },
    };
    const tooltipValue = formatTooltip(geometry, SPEC_1, false, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.yAccessor).toBe('y0');
    expect(tooltipValue.name).toBe('bar_1');
    expect(tooltipValue.isXValue).toBe(false);
    expect(tooltipValue.isHighlighted).toBe(false);
    expect(tooltipValue.color).toBe('blue');
    expect(tooltipValue.value).toBe('10');
  });
  test('format x tooltip', () => {
    const geometry: BarGeometry = {
      ...indexedGeometry,
      value: {
        ...indexedGeometry.value,
        accessor: 'y0',
      },
    };
    let tooltipValue = formatTooltip(geometry, SPEC_1, true, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.yAccessor).toBe('y0');
    expect(tooltipValue.name).toBe('bar_1');
    expect(tooltipValue.isXValue).toBe(true);
    expect(tooltipValue.isHighlighted).toBe(false);
    expect(tooltipValue.color).toBe('blue');
    expect(tooltipValue.value).toBe('1');
    // disable any highlight on x value
    tooltipValue = formatTooltip(geometry, SPEC_1, true, true, false, YAXIS_SPEC);
    expect(tooltipValue.isHighlighted).toBe(false);
  });
});
