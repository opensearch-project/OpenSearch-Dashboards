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

import { ChartType } from '../..';
import { SpecType } from '../../../specs/constants';
import { Position } from '../../../utils/common';
import { Margins } from '../../../utils/dimensions';
import { AxisId } from '../../../utils/ids';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { LegendStyle } from '../../../utils/themes/theme';
import { AxisViewModel } from './axis_utils';
import { computeChartDimensions } from './dimensions';
import { AxisSpec } from './specs';

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

  const axis1Dims: AxisViewModel = {
    tickValues: [0, 1],
    tickLabels: ['first', 'second'],
    maxLabelBboxWidth: 10,
    maxLabelBboxHeight: 10,
    maxLabelTextWidth: 10,
    maxLabelTextHeight: 10,
    isHidden: false,
  };
  const axisLeftSpec: AxisSpec = {
    chartType: ChartType.XYAxis,
    specType: SpecType.Axis,
    id: 'axis_1',
    groupId: 'group_1',
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    tickFormat: (value: any) => `${value}`,
  };
  const legend: LegendStyle = {
    verticalWidth: 10,
    horizontalHeight: 10,
    spacingBuffer: 10,
    margin: 0,
  };
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
  chartTheme.axes.axisTitle.fontSize = 10;
  chartTheme.axes.axisTitle.padding = 10;
  test('should be equal to parent dimension with no axis minus margins', () => {
    const axisDims = new Map<AxisId, AxisViewModel>();
    const axisStyles = new Map();
    const axisSpecs: AxisSpec[] = [];
    const { chartDimensions } = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a left axis', () => {
    // |margin|titleFontSize|titlePadding|maxLabelBboxWidth|tickPadding|tickSize|padding|
    // \10|10|10|10|10|10|10| = 70px from left
    const axisDims = new Map<AxisId, AxisViewModel>();
    const axisStyles = new Map();
    const axisSpecs = [axisLeftSpec];
    axisDims.set('axis_1', axis1Dims);
    const { chartDimensions } = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a right axis', () => {
    // |padding|tickSize|tickPadding|maxLabelBBoxWidth|titlePadding|titleFontSize\margin|
    // \10|10|10|10|10|10|10| = 70px from right
    const axisDims = new Map<AxisId, AxisViewModel>();
    const axisStyles = new Map();
    const axisSpecs = [{ ...axisLeftSpec, position: Position.Right }];
    axisDims.set('axis_1', axis1Dims);
    const { chartDimensions } = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a top axis', () => {
    // |margin|titleFontSize|titlePadding|maxLabelBboxHeight|tickPadding|tickSize|padding|
    // \10|10|10|10|10|10|10| = 70px from top
    const axisDims = new Map<AxisId, AxisViewModel>();
    const axisStyles = new Map();
    const axisSpecs = [
      {
        ...axisLeftSpec,
        position: Position.Top,
      },
    ];
    axisDims.set('axis_1', axis1Dims);
    const { chartDimensions } = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should be padded by a bottom axis', () => {
    // |margin|titleFontSize|titlePadding|maxLabelBboxHeight|tickPadding|tickSize|padding|
    // \10|10|10|10|10|10|10| = 70px from bottom
    const axisDims = new Map<AxisId, AxisViewModel>();
    const axisStyles = new Map();
    const axisSpecs = [
      {
        ...axisLeftSpec,
        position: Position.Bottom,
      },
    ];
    axisDims.set('axis_1', axis1Dims);
    const { chartDimensions } = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);
    expect(chartDimensions.left + chartDimensions.width).toBeLessThanOrEqual(parentDim.width);
    expect(chartDimensions.top + chartDimensions.height).toBeLessThanOrEqual(parentDim.height);
    expect(chartDimensions).toMatchSnapshot();
  });
  test('should not add space for axis when no spec for axis dimensions or axis is hidden', () => {
    const axisDims = new Map<AxisId, AxisViewModel>();
    const axisStyles = new Map();
    const axisSpecs = [
      {
        ...axisLeftSpec,
        position: Position.Bottom,
      },
    ];
    axisDims.set('foo', axis1Dims);
    const chartDimensions = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);

    const expectedDims = {
      chartDimensions: {
        height: 60,
        width: 60,
        left: 20,
        top: 20,
      },
      leftMargin: 10,
    };

    expect(chartDimensions).toEqual(expectedDims);

    const hiddenAxisDims = new Map<AxisId, AxisViewModel>();
    const hiddenAxisSpecs = new Map<AxisId, AxisSpec>();
    hiddenAxisDims.set('axis_1', axis1Dims);
    hiddenAxisSpecs.set('axis_1', {
      ...axisLeftSpec,
      hide: true,
      position: Position.Bottom,
    });
    const hiddenAxisChartDimensions = computeChartDimensions(parentDim, chartTheme, axisDims, axisStyles, axisSpecs);

    expect(hiddenAxisChartDimensions).toEqual(expectedDims);
  });
});
