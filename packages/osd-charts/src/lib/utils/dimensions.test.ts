import { AxisTicksDimensions } from '../axes/axis_utils';
import { AxisSpec, Position } from '../series/specs';
import { LIGHT_THEME } from '../themes/light_theme';
import { LegendStyle } from '../themes/theme';
import { computeChartDimensions, Margins } from './dimensions';
import { AxisId, getAxisId, getGroupId } from './ids';
import { ScaleType } from './scales/scales';

describe('Computed chart dimensions', () => {
  const parentDim = {
    width: 100,
    height: 100,
    top: 0,
    left: 0,
  };
  const chartMargins: Margins = {
    left: 10,
    right: 10,
    top: 10,
    bottom: 10,
  };
  const chartPaddings: Margins = {
    left: 10,
    right: 10,
    top: 10,
    bottom: 10,
  };

  const axis1Dims: AxisTicksDimensions = {
    axisScaleType: ScaleType.Linear,
    axisScaleDomain: [0, 1],
    tickValues: [0, 1],
    tickLabels: ['first', 'second'],
    maxLabelBboxWidth: 10,
    maxLabelBboxHeight: 10,
    maxLabelTextWidth: 10,
    maxLabelTextHeight: 10,
  };
  const axisLeftSpec: AxisSpec = {
    id: getAxisId('axis_1'),
    groupId: getGroupId('group_1'),
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
  const legend: LegendStyle = {
    verticalWidth: 10,
    horizontalHeight: 10,
  };
  const showLegend = false;
  const defaultTheme = LIGHT_THEME;
  const chartTheme = {
    ...defaultTheme,
    chartMargins,
    chartPaddings,
    axes: {
      ...defaultTheme.axes,
    },
    ...legend,
  };
  chartTheme.axes.axisTitleStyle.fontSize = 10;
  chartTheme.axes.axisTitleStyle.padding = 10;
  test('should be equal to parent dimension with no axis minus margins', () => {
    const axisDims = new Map<AxisId, AxisTicksDimensions>();
    const axisSpecs = new Map<AxisId, AxisSpec>();
    const chartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a left axis', () => {
    // |margin|titleFontSize|titlePadding|maxLabelBboxWidth|tickPadding|tickSize|padding|
    // \10|10|10|10|10|10|10| = 70px from left
    const axisDims = new Map<AxisId, AxisTicksDimensions>();
    const axisSpecs = new Map<AxisId, AxisSpec>();
    axisDims.set(getAxisId('axis_1'), axis1Dims);
    axisSpecs.set(getAxisId('axis_1'), axisLeftSpec);
    const chartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a right axis', () => {
    // |padding|tickSize|tickPadding|maxLabelBBoxWidth|titlePadding|titleFontSize\margin|
    // \10|10|10|10|10|10|10| = 70px from right
    const axisDims = new Map<AxisId, AxisTicksDimensions>();
    const axisSpecs = new Map<AxisId, AxisSpec>();
    axisDims.set(getAxisId('axis_1'), axis1Dims);
    axisSpecs.set(getAxisId('axis_1'), { ...axisLeftSpec, position: Position.Right });
    const chartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a top axis', () => {
    // |margin|titleFontSize|titlePadding|maxLabelBboxHeight|tickPadding|tickSize|padding|
    // \10|10|10|10|10|10|10| = 70px from top
    const axisDims = new Map<AxisId, AxisTicksDimensions>();
    const axisSpecs = new Map<AxisId, AxisSpec>();
    axisDims.set(getAxisId('axis_1'), axis1Dims);
    axisSpecs.set(getAxisId('axis_1'), {
      ...axisLeftSpec,
      position: Position.Top,
    });
    const chartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a bottom axis', () => {
    // |margin|titleFontSize|titlePadding|maxLabelBboxHeight|tickPadding|tickSize|padding|
    // \10|10|10|10|10|10|10| = 70px from bottom
    const axisDims = new Map<AxisId, AxisTicksDimensions>();
    const axisSpecs = new Map<AxisId, AxisSpec>();
    axisDims.set(getAxisId('axis_1'), axis1Dims);
    axisSpecs.set(getAxisId('axis_1'), {
      ...axisLeftSpec,
      position: Position.Bottom,
    });
    const chartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should not add space for axis when no spec for axis dimensions or axis is hidden', () => {
    const axisDims = new Map<AxisId, AxisTicksDimensions>();
    const axisSpecs = new Map<AxisId, AxisSpec>();
    axisDims.set(getAxisId('foo'), axis1Dims);
    axisSpecs.set(getAxisId('axis_1'), {
      ...axisLeftSpec,
      position: Position.Bottom,
    });
    const chartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );

    const expectedDims = {
      height: 60,
      width: 60,
      left: 20,
      top: 20,
    };

    expect(chartDimensions).toEqual(expectedDims);

    const hiddenAxisDims = new Map<AxisId, AxisTicksDimensions>();
    const hiddenAxisSpecs = new Map<AxisId, AxisSpec>();
    hiddenAxisDims.set(getAxisId('axis_1'), axis1Dims);
    hiddenAxisSpecs.set(getAxisId('axis_1'), {
      ...axisLeftSpec,
      hide: true,
      position: Position.Bottom,
    });
    const hiddenAxisChartDimensions = computeChartDimensions(
      parentDim,
      chartTheme,
      axisDims,
      axisSpecs,
      showLegend,
    );

    expect(hiddenAxisChartDimensions).toEqual(expectedDims);
  });
});
