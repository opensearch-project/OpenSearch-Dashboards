import { palettes } from '@elastic/eui';
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
  DARK_THEME,
  DataGenerator,
  DataSeriesColorsValues,
  DEFAULT_MISSING_COLOR,
  getAxisId,
  getSpecId,
  LIGHT_THEME,
  LineSeries,
  mergeWithDefaultTheme,
  PartialTheme,
  Position,
  ScaleType,
  Settings,
} from '../src/';
import * as TestDatasets from '../src/lib/series/utils/test_dataset';

function range(
  title: string,
  min: number,
  max: number,
  value: number,
  groupId?: string,
  step: number = 1,
) {
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
    };
    const customTheme = mergeWithDefaultTheme(theme, LIGHT_THEME);
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings
          theme={customTheme}
          debug={boolean('debug', true)}
          showLegend={true}
          legendPosition={Position.Right}
        />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          showGridLines={boolean('show bottom axis grid lines', false)}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          showGridLines={boolean('show left axis grid lines', false)}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={'Top axis'}
          showOverlappingTicks={true}
          showGridLines={boolean('show top axis grid lines', false)}
        />
        <Axis
          id={getAxisId('right')}
          title={'Right axis'}
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
          yScaleToDataExtent={false}
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
          padding: 0,
        },
        tickLineStyle: {
          stroke: color('tickLineColor', '#333', 'Tick Line'),
          strokeWidth: range('tickLineWidth', 0, 5, 1, 'Tick Line'),
        },
      },
    };
    const customTheme = mergeWithDefaultTheme(theme, LIGHT_THEME);
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings
          theme={customTheme}
          debug={boolean('debug', true)}
          rotation={select('rotation', { '0': 0, '90': 90, '-90': -90, '180': 180 }, 0)}
        />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
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
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
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
        border: {
          stroke: 'gray',
          strokeWidth: 2,
          visible: false,
          // not already customizeable
          // stroke: color('lBorderStroke', 'gray', 'line'),
          // strokeWidth: range('lBorderStrokeWidth', 0, 10, 2, 'line'),
          // visible: boolean('lBorderVisible', false, 'line'),
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
        border: {
          stroke: 'gray',
          strokeWidth: 2,
          visible: false,
          // not already customizeable
          // stroke: color('aBorderStroke', 'gray', 'area'),
          // strokeWidth: range('aBorderStrokeWidth', 0, 10, 2, 'area'),
          // visible: boolean('aBorderVisible', false, 'area'),
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
        border: {
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
            colorBlind: palettes.euiPaletteColorBlind.colors,
            darkBackground: palettes.euiPaletteForDarkBackground.colors,
            lightBackground: palettes.euiPaletteForLightBackground.colors,
            forStatus: palettes.euiPaletteForStatus.colors,
          },
          palettes.euiPaletteColorBlind.colors,
          'Colors',
        ),
        defaultVizColor: DEFAULT_MISSING_COLOR,
      },
    };

    const darkmode = boolean('darkmode', false, 'Colors');
    const className = darkmode ? 'story-chart-dark' : 'story-chart';
    const defaultTheme = darkmode ? DARK_THEME : LIGHT_THEME;
    const customTheme = mergeWithDefaultTheme(theme, defaultTheme);
    switchTheme(darkmode ? 'dark' : 'light');

    return (
      <Chart renderer="canvas" className={className}>
        <Settings
          theme={customTheme}
          debug={boolean('debug', false)}
          showLegend={true}
          legendPosition={Position.Right}
        />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={'Top axis'}
          showOverlappingTicks={true}
        />
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
          yScaleToDataExtent={false}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_MONOTONE_X}
          data={data2}
          yScaleToDataExtent={false}
        />
        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_MONOTONE_X}
          data={data3}
          yScaleToDataExtent={false}
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
      <Chart renderer="canvas" className={'story-chart'}>
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
          yScaleToDataExtent={false}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          customSeriesColors={lineCustomSeriesColors}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  });
