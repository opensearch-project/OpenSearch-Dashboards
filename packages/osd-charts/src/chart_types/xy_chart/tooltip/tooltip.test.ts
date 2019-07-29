import { getAxisId, getGroupId, getSpecId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { BarGeometry } from '../rendering/rendering';
import { AxisSpec, BarSeriesSpec, Position } from '../utils/specs';
import { formatTooltip } from './tooltip';

describe('Tooltip formatting', () => {
  const SPEC_ID_1 = getSpecId('bar_1');
  const SPEC_GROUP_ID_1 = getGroupId('bar_group_1');
  const SPEC_1: BarSeriesSpec = {
    id: SPEC_ID_1,
    groupId: SPEC_GROUP_ID_1,
    seriesType: 'bar',
    data: [],
    xAccessor: 0,
    yAccessors: [1],
    yScaleToDataExtent: false,
    yScaleType: ScaleType.Linear,
    xScaleType: ScaleType.Linear,
  };
  const YAXIS_SPEC: AxisSpec = {
    id: getAxisId('axis_1'),
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
    geometryId: {
      specId: SPEC_ID_1,
      seriesKey: [],
    },
    value: {
      x: 1,
      y: 10,
      accessor: 'y1',
    },
    seriesStyle,
  };

  test('format simple tooltip', () => {
    const tooltipValue = formatTooltip(indexedGeometry, SPEC_1, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.name).toBe('bar_1');
    expect(tooltipValue.isXValue).toBe(false);
    expect(tooltipValue.isHighlighted).toBe(false);
    expect(tooltipValue.color).toBe('blue');
    expect(tooltipValue.value).toBe('10');
  });
  test('format tooltip with seriesKey name', () => {
    const geometry: BarGeometry = {
      ...indexedGeometry,
      geometryId: {
        specId: SPEC_ID_1,
        seriesKey: ['y1'],
      },
    };
    const tooltipValue = formatTooltip(geometry, SPEC_1, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.name).toBe('y1');
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
    const tooltipValue = formatTooltip(geometry, SPEC_1, false, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
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
    let tooltipValue = formatTooltip(geometry, SPEC_1, true, false, YAXIS_SPEC);
    expect(tooltipValue).toBeDefined();
    expect(tooltipValue.name).toBe('bar_1');
    expect(tooltipValue.isXValue).toBe(true);
    expect(tooltipValue.isHighlighted).toBe(false);
    expect(tooltipValue.color).toBe('blue');
    expect(tooltipValue.value).toBe('1');
    // disable any highlight on x value
    tooltipValue = formatTooltip(geometry, SPEC_1, true, true, YAXIS_SPEC);
    expect(tooltipValue.isHighlighted).toBe(false);
  });
});
