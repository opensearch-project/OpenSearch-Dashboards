import { boolean, color, number, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import React from 'react';
import { switchTheme } from '../.storybook/theme_service';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  CurveType,
  CustomSeriesColorsMap,
  DataGenerator,
  DataSeriesColorsValues,
  DEFAULT_MISSING_COLOR,
  getAxisId,
  getSpecId,
  LineSeries,
  PartialTheme,
  Position,
  ScaleType,
  Settings,
  BaseThemeTypes,
  LineSeriesStyle,
} from '../src/';
import * as TestDatasets from '../src/utils/data_samples/test_dataset';
import { palettes } from '../src/utils/themes/colors';

function range(title: string, min: number, max: number, value: number, groupId?: string, step: number = 1) {
  return number(
    title,
    value,
    {
      range: true,
      min,
      max,
      step,
    },
    groupId,
  );
}

function generateLineSeriesStyleKnobs(
  groupName: string,
  tag: string,
  pointFill?: string,
  pointStroke?: string,
  pointStrokeWidth?: number,
  pointRadius?: number,
  lineStrokeWidth?: number,
  lineStroke?: string,
): LineSeriesStyle {
  return {
    line: {
      stroke: lineStroke ? color(`line.stroke (${tag})`, lineStroke, groupName) : undefined,
      strokeWidth: range(`line.strokeWidth (${tag})`, 0, 10, lineStrokeWidth ? lineStrokeWidth : 1, groupName),
      visible: boolean(`line.visible (${tag})`, true, groupName),
      opacity: range(`line.opacity (${tag})`, 0, 1, 1, groupName, 0.01),
    },
    point: {
      visible: boolean(`point.visible (${tag})`, true, groupName),
      radius: range(`point.radius (${tag})`, 0, 20, pointRadius ? pointRadius : 5, groupName, 0.5),
      opacity: range(`point.opacity (${tag})`, 0, 1, 1, groupName, 0.01),
      stroke: color(`point.stroke (${tag})`, pointStroke ? pointStroke : 'black', groupName),
      fill: color(`point.fill (${tag})`, pointFill ? pointFill : 'lightgray', groupName),
      strokeWidth: range(`point.strokeWidth (${tag})`, 0, 5, pointStrokeWidth ? pointStrokeWidth : 2, groupName, 0.01),
    },
  };
}

function generateAreaSeriesStyleKnobs(
  groupName: string,
  tag: string,
  pointFill?: string,
  pointStroke?: string,
  pointStrokeWidth?: number,
  pointRadius?: number,
  lineStrokeWidth?: number,
  lineStroke?: string,
  areaFill?: string,
) {
  return {
    ...generateLineSeriesStyleKnobs(
      groupName,
      tag,
      pointFill,
      pointStroke,
      pointStrokeWidth,
      pointRadius,
      lineStrokeWidth,
      lineStroke,
    ),
    area: {
      fill: areaFill ? color(`area.fill (${tag})`, areaFill, groupName) : undefined,
      visible: boolean(`area.visible (${tag})`, true, groupName),
      opacity: range(`area.opacity (${tag})`, 0, 1, 0.8, groupName, 0.01),
    },
  };
}

const dg = new DataGenerator();
const data1 = dg.generateGroupedSeries(40, 4);
const data2 = dg.generateSimpleSeries(40);
const data3 = dg.generateSimpleSeries(40);

storiesOf('Stylings', module)
  .add('margins and paddings', () => {
    const theme: PartialTheme = {
      chartMargins: {
        left: range('margin left', 0, 50, 10),
        right: range('margin right', 0, 50, 10),
        top: range('margin top', 0, 50, 10),
        bottom: range('margin bottom', 0, 50, 10),
      },
      chartPaddings: {
        left: range('padding left', 0, 50, 10),
        right: range('padding right', 0, 50, 10),
        top: range('padding top', 0, 50, 10),
        bottom: range('padding bottom', 0, 50, 10),
      },
      scales: {
        barsPadding: range('bar padding', 0, 1, 0.1, undefined, 0.01),
      },
    };
    const withLeftTitle = boolean('left axis with title', true);
    const withBottomTitle = boolean('bottom axis with title', true);
    const withRightTitle = boolean('right axis with title', true);
    const withTopTitle = boolean('top axis with title', true);
    return (
      <Chart className={'story-chart'}>
        <Settings theme={theme} debug={boolean('debug', true)} showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={withBottomTitle ? 'Bottom axis' : undefined}
          showOverlappingTicks={true}
          showGridLines={boolean('show bottom axis grid lines', false)}
        />
        <Axis
          id={getAxisId('left2')}
          title={withLeftTitle ? 'Left axis' : undefined}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          showGridLines={boolean('show left axis grid lines', false)}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={withTopTitle ? 'Top axis' : undefined}
          showOverlappingTicks={true}
          showGridLines={boolean('show top axis grid lines', false)}
        />
        <Axis
          id={getAxisId('right')}
          title={withRightTitle ? 'Right axis' : undefined}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
          showGridLines={boolean('show right axis grid lines', false)}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
      </Chart>
    );
  })
  .add('axis', () => {
    const theme: PartialTheme = {
      axes: {
        axisTitleStyle: {
          fill: color('titleFill', '#333', 'Axis Title'),
          fontSize: range('titleFontSize', 0, 40, 12, 'Axis Title'),
          fontStyle: 'bold',
          fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
          padding: range('titlePadding', 0, 40, 5, 'Axis Title'),
        },
        axisLineStyle: {
          stroke: color('axisLinecolor', '#333', 'Axis Line'),
          strokeWidth: range('axisLineWidth', 0, 5, 1, 'Axis Line'),
        },
        tickLabelStyle: {
          fill: color('tickFill', '#333', 'Tick Label'),
          fontSize: range('tickFontSize', 0, 40, 10, 'Tick Label'),
          fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
          fontStyle: 'normal',
          padding: number('tickLabelPadding', 1, {}, 'Tick Label'),
        },
        tickLineStyle: {
          stroke: color('tickLineColor', '#333', 'Tick Line'),
          strokeWidth: range('tickLineWidth', 0, 5, 1, 'Tick Line'),
        },
      },
    };
    return (
      <Chart className={'story-chart'}>
        <Settings
          theme={theme}
          debug={boolean('debug', true)}
          rotation={select('rotation', { '0': 0, '90': 90, '-90': -90, '180': 180 }, 0)}
        />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
      </Chart>
    );
  })
  .add('theme/style', () => {
    const theme: PartialTheme = {
      chartMargins: {
        left: range('margin left', 0, 50, 10, 'Margins'),
        right: range('margin right', 0, 50, 10, 'Margins'),
        top: range('margin top', 0, 50, 10, 'Margins'),
        bottom: range('margin bottom', 0, 50, 10, 'Margins'),
      },
      chartPaddings: {
        left: range('padding left', 0, 50, 10, 'Paddings'),
        right: range('padding right', 0, 50, 10, 'Paddings'),
        top: range('padding top', 0, 50, 10, 'Paddings'),
        bottom: range('padding bottom', 0, 50, 10, 'Paddings'),
      },
      lineSeriesStyle: {
        line: {
          stroke: DEFAULT_MISSING_COLOR,
          strokeWidth: range('lineStrokeWidth', 0, 10, 1, 'line'),
          visible: boolean('lineVisible', true, 'line'),
        },
        point: {
          visible: boolean('linePointVisible', true, 'line'),
          radius: range('linePointRadius', 0, 20, 1, 'line', 0.5),
          // not customizable
          stroke: 'red',
          strokeWidth: range('linePointStrokeWidth', 0, 20, 0.5, 'line'),
          opacity: range('linePointOpacity', 0, 1, 1, 'line', 0.01),
        },
      },
      areaSeriesStyle: {
        area: {
          // not already customizeable
          fill: DEFAULT_MISSING_COLOR,
          visible: boolean('aAreaVisible', true, 'area'),
          opacity: range('aAreaOpacity', 0, 1, 1, 'area'),
        },
        line: {
          // not already customizeable
          stroke: DEFAULT_MISSING_COLOR,
          strokeWidth: range('aStrokeWidth', 0, 10, 1, 'area'),
          visible: boolean('aLineVisible', true, 'area'),
        },
        point: {
          visible: boolean('aPointVisible', true, 'area'),
          radius: range('aPointRadius', 0, 20, 1, 'area'),
          stroke: color('aPointStroke', 'white', 'area'),
          strokeWidth: range('aPointStrokeWidth', 0, 20, 0.5, 'area'),
          opacity: range('aPointOpacity', 0, 1, 0.01, 'area'),
        },
      },
      barSeriesStyle: {
        rect: {
          opacity: range('rectOpacity', 0, 1, 0.1, 'bar'),
        },
        rectBorder: {
          stroke: color('bBorderStroke', 'white', 'bar'),
          strokeWidth: range('bStrokeWidth', 0, 10, 1, 'bar'),
          visible: boolean('bBorderVisible', true, 'bar'),
        },
      },
      sharedStyle: {
        default: {
          opacity: range('sOpacity', 0, 1, 1, 'Shared', 0.05),
        },
        highlighted: {
          opacity: range('sHighlighted', 0, 1, 1, 'Shared', 0.05),
        },
        unhighlighted: {
          opacity: range('sUnhighlighted', 0, 1, 0.25, 'Shared', 0.05),
        },
      },
      colors: {
        vizColors: select(
          'vizColors',
          {
            colorBlind: palettes.echPaletteColorBlind.colors,
            darkBackground: palettes.echPaletteForDarkBackground.colors,
            lightBackground: palettes.echPaletteForLightBackground.colors,
            forStatus: palettes.echPaletteForStatus.colors,
          },
          palettes.echPaletteColorBlind.colors,
          'Colors',
        ),
        defaultVizColor: DEFAULT_MISSING_COLOR,
      },
    };

    const darkmode = boolean('darkmode', false, 'Colors');
    const className = darkmode ? 'story-chart-dark' : 'story-chart';
    switchTheme(darkmode ? 'dark' : 'light');

    return (
      <Chart className={className}>
        <Settings
          theme={theme}
          baseThemeType={darkmode ? 'dark' : 'light'}
          debug={boolean('debug', false)}
          showLegend={true}
          legendPosition={Position.Right}
        />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis id={getAxisId('top')} position={Position.Top} title={'Top axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('right')}
          title={'Right axis'}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          splitSeriesAccessors={['g']}
          stackAccessors={['x']}
          data={data1}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_MONOTONE_X}
          data={data2}
        />
        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_MONOTONE_X}
          data={data3}
        />
      </Chart>
    );
  })
  .add('partial custom theme', () => {
    const customPartialTheme: PartialTheme = {
      barSeriesStyle: {
        rectBorder: {
          stroke: color('BarBorderStroke', 'white'),
          visible: true,
        },
      },
    };

    return (
      <Chart className="story-chart">
        <Settings
          showLegend
          theme={customPartialTheme}
          baseThemeType={BaseThemeTypes.Light}
          legendPosition={Position.Right}
        />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title="Left axis"
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis id={getAxisId('top')} position={Position.Top} title="Top axis" showOverlappingTicks={true} />
        <Axis
          id={getAxisId('right')}
          title="Right axis"
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          splitSeriesAccessors={['g']}
          stackAccessors={['x']}
          data={data1}
        />
      </Chart>
    );
  })
  .add('custom series colors through spec props', () => {
    const barCustomSeriesColors: CustomSeriesColorsMap = new Map();
    const barDataSeriesColorValues: DataSeriesColorsValues = {
      colorValues: ['cloudflare.com', 'direct-cdn', 'y2'],
      specId: getSpecId('bars'),
    };

    const lineCustomSeriesColors: CustomSeriesColorsMap = new Map();
    const lineDataSeriesColorValues: DataSeriesColorsValues = {
      colorValues: [],
      specId: getSpecId('lines'),
    };

    const customBarColorKnob = color('barDataSeriesColor', '#000');
    const customLineColorKnob = color('lineDataSeriesColor', '#ff0');
    barCustomSeriesColors.set(barDataSeriesColorValues, customBarColorKnob);
    lineCustomSeriesColors.set(lineDataSeriesColorValues, customLineColorKnob);

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          // title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={['g1', 'g2']}
          customSeriesColors={barCustomSeriesColors}
          data={TestDatasets.BARCHART_2Y2G}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          customSeriesColors={lineCustomSeriesColors}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  })
  .add('custom series styles: bars', () => {
    const applyBarStyle = boolean('apply bar style (bar 1 series)', true, 'Chart Global Theme');

    const barSeriesStyle = {
      rectBorder: {
        stroke: color('border stroke', 'blue', 'Bar 1 Style'),
        strokeWidth: range('border strokeWidth', 0, 5, 2, 'Bar 1 Style', 0.1),
        visible: boolean('border visible', true, 'Bar 1 Style'),
      },
      rect: {
        fill: color('rect fill', '#22C61A', 'Bar 1 Style'),
        opacity: range('rect opacity', 0, 1, 0.3, 'Bar 1 Style', 0.1),
      },
    };

    const theme = {
      barSeriesStyle: {
        rectBorder: {
          stroke: color('theme border stroke', 'red', 'Chart Global Theme'),
          strokeWidth: range('theme border strokeWidth', 0, 5, 2, 'Chart Global Theme', 0.1),
          visible: boolean('theme border visible', true, 'Chart Global Theme'),
        },
        rect: {
          opacity: range('theme opacity ', 0, 1, 0.9, 'Chart Global Theme', 0.1),
        },
      },
    };

    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} theme={theme} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('bar 1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={TestDatasets.BARCHART_1Y0G}
          yScaleToDataExtent={false}
          barSeriesStyle={applyBarStyle ? barSeriesStyle : undefined}
          name={'bars 1'}
        />
        <BarSeries
          id={getSpecId('bar 2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={TestDatasets.BARCHART_1Y0G}
          yScaleToDataExtent={false}
          name={'bars 2'}
        />
      </Chart>
    );
  })
  .add('custom series styles: lines', () => {
    const applyLineStyles = boolean('apply line series style', true, 'Chart Global Theme');
    const lineSeriesStyle1 = generateLineSeriesStyleKnobs('Line 1 style', 'line1', 'lime', 'green', 4, 10, 6);
    const lineSeriesStyle2 = generateLineSeriesStyleKnobs('Line 2 style', 'line2', 'blue', 'violet', 2, 5, 4);

    const chartTheme = {
      lineSeriesStyle: generateLineSeriesStyleKnobs('Chart Global Theme', 'chartTheme'),
    };

    const dataset1 = [{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }];
    const dataset2 = dataset1.map((datum) => ({ ...datum, y: datum.y - 1 }));
    const dataset3 = dataset1.map((datum) => ({ ...datum, y: datum.y - 2 }));

    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} theme={chartTheme} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <LineSeries
          id={getSpecId('lines1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={dataset1}
          yScaleToDataExtent={false}
          lineSeriesStyle={applyLineStyles ? lineSeriesStyle1 : undefined}
        />
        <LineSeries
          id={getSpecId('lines2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={dataset2}
          yScaleToDataExtent={false}
          lineSeriesStyle={applyLineStyles ? lineSeriesStyle2 : undefined}
        />
        <LineSeries
          id={getSpecId('lines3')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={dataset3}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('custom series styles: area', () => {
    const applyLineStyles = boolean('apply line series style', true, 'Chart Global Theme');

    const chartTheme = {
      areaSeriesStyle: generateAreaSeriesStyleKnobs('Chart Global Theme', 'chartTheme'),
    };

    const dataset1 = [{ x: 0, y: 3 }, { x: 1, y: 6 }, { x: 2, y: 4 }, { x: 3, y: 10 }];
    const dataset2 = dataset1.map((datum) => ({ ...datum, y: datum.y - 1 }));
    const dataset3 = dataset1.map((datum) => ({ ...datum, y: datum.y - 2 }));

    const areaStyle1 = generateAreaSeriesStyleKnobs('Area 1 Style', 'area1', 'lime', 'green', 4, 10, 6, 'black');
    const areaStyle2 = generateAreaSeriesStyleKnobs(
      'Area 2 Style',
      'area2',
      'blue',
      'violet',
      2,
      5,
      4,
      undefined,
      'red',
    );

    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} theme={chartTheme} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('area1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          data={dataset1}
          areaSeriesStyle={applyLineStyles ? areaStyle1 : undefined}
        />
        <AreaSeries
          id={getSpecId('area2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          data={dataset2}
          areaSeriesStyle={applyLineStyles ? areaStyle2 : undefined}
        />
        <AreaSeries
          id={getSpecId('area3')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          data={dataset3}
        />
      </Chart>
    );
  })
  .add('tickLabelPadding both prop and theme', () => {
    const theme: PartialTheme = {
      axes: {
        tickLabelStyle: {
          fill: color('tickFill', '#333', 'Tick Label'),
          fontSize: range('tickFontSize', 0, 40, 10, 'Tick Label'),
          fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
          fontStyle: 'normal',
          padding: number('Tick Label Padding Theme', 1, {}, 'Tick Label'),
        },
      },
    };
    const customStyle = {
      tickLabelPadding: number('Tick Label Padding Axis Spec', 0),
    };
    return (
      <Chart className={'story-chart'}>
        <Settings theme={theme} debug={boolean('debug', true)} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          style={customStyle}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
      </Chart>
    );
  });
