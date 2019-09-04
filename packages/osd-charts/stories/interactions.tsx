import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';
import React from 'react';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  CurveType,
  DARK_THEME,
  getAxisId,
  getSpecId,
  LIGHT_THEME,
  LineSeries,
  niceTimeFormatByDay,
  niceTimeFormatter,
  Position,
  Rotation,
  ScaleType,
  Settings,
  timeFormatter,
  TooltipType,
  TooltipValue,
  TooltipValueFormatter,
} from '../src/';

import { array, boolean, number, select } from '@storybook/addon-knobs';
import { DateTime } from 'luxon';
import { switchTheme } from '../.storybook/theme_service';
import { BARCHART_2Y2G } from '../src/utils/data_samples/test_dataset';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';

const onElementListeners = {
  onElementClick: action('onElementClick'),
  onElementOver: action('onElementOver'),
  onElementOut: action('onElementOut'),
};

const onLegendItemListeners = {
  onLegendItemOver: action('onLegendItemOver'),
  onLegendItemOut: action('onLegendItemOut'),
  onLegendItemClick: action('onLegendItemClick'),
  onLegendItemPlusClick: action('onLegendItemPlusClick'),
  onLegendItemMinusClick: action('onLegendItemMinusClick'),
};

const onRenderChange = action('onRenderChange');
const onCursorUpdate = action('onCursorUpdate');

storiesOf('Interactions', module)
  .add('bar clicks and hovers', () => {
    const headerFormatter: TooltipValueFormatter = (tooltipData: TooltipValue) => {
      if (tooltipData.value % 2 === 0) {
        return (
          <div>
            <p>special header for even x values</p>
            <p>{tooltipData.value}</p>
          </div>
        );
      }

      return tooltipData.value;
    };

    const tooltipProps = {
      headerFormatter,
    };

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} tooltip={tooltipProps} />
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
  .add('area point clicks and hovers', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('area')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
      </Chart>
    );
  })
  .add('line point clicks and hovers', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <LineSeries
          id={getSpecId('line')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
      </Chart>
    );
  })
  .add('line area bar point clicks and hovers', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} />
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
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 2.3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 8 }]}
        />
        <LineSeries
          id={getSpecId('line')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <AreaSeries
          id={getSpecId('area')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2.3 }, { x: 1, y: 7.3 }, { x: 2, y: 6 }, { x: 3, y: 2 }]}
        />
      </Chart>
    );
  })
  .add('click/hovers on legend items [bar chart]', () => {
    const notSpecChange = 'not spec change';
    const specChange = 'spec change';

    const xDomain = {
      min: number('xDomain min', 0, {}, notSpecChange),
      max: number('xDomain max', 6, {}, notSpecChange),
    };

    const yDomain = {
      min: number('yDomain min', 0, {}, notSpecChange),
      max: number('yDomain max', 10, {}, notSpecChange),
    };

    const yScaleTypeOptions: { [key: string]: typeof ScaleType.Linear | typeof ScaleType.Log } = {
      linear: ScaleType.Linear,
      log: ScaleType.Log,
    };
    const yScaleType = select('yScaleType', yScaleTypeOptions, ScaleType.Linear, specChange);

    const xAccessorOptions = { x: 'x', y1: 'y1', y2: 'y2' };
    const xAccessor = select('xAccessor', xAccessorOptions, 'x', notSpecChange);

    const yScaleToDataExtent = boolean('yScaleDataToExtent', false, specChange);

    const splitSeriesAccessors = array('split series accessors', ['g1', 'g2'], ',', specChange);

    const hasY2 = boolean('has y2 yAccessor', true, specChange);
    const yAccessors = hasY2 ? ['y1', 'y2'] : ['y1'];

    const additionalG1Value = { x: 4, g1: '$$$$$$$$', g2: 'indirect-cdn', y1: 7, y2: 3 };
    const hasAdditionalG1Value = boolean('has additional g1 value', false, specChange);

    const seriesData = BARCHART_2Y2G;

    const data = hasAdditionalG1Value ? [...seriesData, additionalG1Value] : seriesData;

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onLegendItemListeners} xDomain={xDomain} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={yDomain}
        />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={yScaleType}
          xAccessor={xAccessor}
          yAccessors={yAccessors}
          splitSeriesAccessors={splitSeriesAccessors}
          data={data}
          yScaleToDataExtent={yScaleToDataExtent}
        />
      </Chart>
    );
  })
  .add('click/hovers on legend items [area chart]', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          onLegendItemClick={action('onLegendItemClick')}
          onLegendItemOver={action('onLegendItemOver')}
          onLegendItemOut={action('onLegendItemOut')}
        />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
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
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[
            { x: 0, y: 2, g: 'a' },
            { x: 1, y: 7, g: 'a' },
            { x: 2, y: 3, g: 'a' },
            { x: 3, y: 6, g: 'a' },
            { x: 0, y: 4, g: 'b' },
            { x: 1, y: 5, g: 'b' },
            { x: 2, y: 8, g: 'b' },
            { x: 3, y: 2, g: 'b' },
          ]}
        />
      </Chart>
    );
  })
  .add('click/hovers on legend items [line chart]', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          onLegendItemClick={action('onLegendItemClick')}
          onLegendItemOver={action('onLegendItemOver')}
          onLegendItemOut={action('onLegendItemOut')}
        />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
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
          curve={CurveType.CURVE_MONOTONE_X}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_BASIS}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines3')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_CARDINAL}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines4')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_CATMULL_ROM}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines5')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_NATURAL}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines6')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.LINEAR}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
      </Chart>
    );
  })
  .add('click/hovers on legend items [mixed chart]', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          onLegendItemClick={action('onLegendItemClick')}
          onLegendItemOver={action('onLegendItemOver')}
          onLegendItemOut={action('onLegendItemOut')}
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
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  })
  .add('brush selection tool on linear', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings onBrushEnd={action('onBrushEnd')} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'bottom'} showOverlappingTicks={true} />
        <Axis id={getAxisId('left')} title={'left'} position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
        <Axis id={getAxisId('top')} position={Position.Top} title={'top'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('right')}
          title={'right'}
          position={Position.Right}
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
  })
  .add('brush selection tool on bar chart linear', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings onBrushEnd={action('onBrushEnd')} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'bottom'} showOverlappingTicks={true} />
        <Axis id={getAxisId('left')} title={'left'} position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
        <Axis id={getAxisId('top')} position={Position.Top} title={'top'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('right')}
          title={'right'}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 1, y: 2 }, { x: 2, y: 7 }, { x: 3, y: 3 }]}
        />
      </Chart>
    );
  })
  .add('brush selection tool on time charts', () => {
    const now = DateTime.fromISO('2019-01-11T00:00:00.000')
      .setZone('utc+1')
      .toMillis();
    const oneDay = 1000 * 60 * 60 * 24;
    const formatter = niceTimeFormatter([now, now + oneDay * 5]);
    return (
      <Chart className={'story-chart'}>
        <Settings
          debug={boolean('debug', false)}
          onBrushEnd={(start, end) => {
            action('onBrushEnd')(formatter(start), formatter(end));
          }}
          onElementClick={action('onElementClick')}
        />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'bottom'}
          showOverlappingTicks={true}
          tickFormat={formatter}
        />
        <Axis id={getAxisId('left')} title={'left'} position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[
            { x: now, y: 2 },
            { x: now + oneDay, y: 7 },
            { x: now + oneDay * 2, y: 3 },
            { x: now + oneDay * 5, y: 6 },
          ]}
        />
      </Chart>
    );
  })
  .add('brush disabled on ordinal x axis', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings onBrushEnd={action('onBrushEnd')} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'bottom'} showOverlappingTicks={true} />
        <Axis id={getAxisId('left')} title={'left'} position={Position.Left} />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Ordinal}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 'a', y: 2 }, { x: 'b', y: 7 }, { x: 'c', y: 3 }, { x: 'd', y: 6 }]}
        />
      </Chart>
    );
  })
  .add('crosshair with time axis', () => {
    const hideBars = boolean('hideBars', false);
    const formatter = timeFormatter(niceTimeFormatByDay(1));
    const darkmode = boolean('darkmode', false);
    const className = darkmode ? 'story-chart-dark' : 'story-chart';
    const defaultTheme = darkmode ? DARK_THEME : LIGHT_THEME;
    switchTheme(darkmode ? 'dark' : 'light');
    const chartRotation = select<Rotation>('rotation', { '90': 90, '0': 0, '-90': -90, '180': 180 }, 0);
    const numberFormatter = (d: any) => Number(d).toFixed(2);

    const tooltipType = select(
      'tooltipType',
      {
        cross: TooltipType.Crosshairs,
        vertical: TooltipType.VerticalCursor,
        follow: TooltipType.Follow,
        none: TooltipType.None,
      },
      TooltipType.Crosshairs,
    );

    const tooltipProps = {
      type: tooltipType,
      snap: boolean('tooltip snap to grid', true),
    };

    return (
      <Chart className={className}>
        <Settings
          debug={boolean('debug', false)}
          tooltip={tooltipProps}
          theme={defaultTheme}
          rotation={chartRotation}
        />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          tickFormat={[0, 180].includes(chartRotation) ? formatter : numberFormatter}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={[0, 180].includes(chartRotation) ? numberFormatter : formatter}
        />
        {!hideBars && (
          <BarSeries
            id={getSpecId('data 1')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            stackAccessors={[0]}
            data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20)}
          />
        )}
        {!hideBars && (
          <BarSeries
            id={getSpecId('data 2')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            stackAccessors={[0]}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 20)}
          />
        )}
        <LineSeries
          id={getSpecId('data 3')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={KIBANA_METRICS.metrics.kibana_os_load[2].data.slice(0, 20)}
          yScaleToDataExtent={hideBars}
        />
      </Chart>
    );
  })
  .add(
    'Render change action',
    () => {
      return (
        <Chart className={'story-chart'}>
          <Settings showLegend={true} legendPosition={Position.Right} onRenderChange={onRenderChange} />
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
    },
    {
      info:
        'Sends an event every time the chart render state changes. This is provided to bind attributes to the chart for visulaization loading checks.',
    },
  )
  .add(
    'Cursor update action',
    () => {
      return (
        <Chart className={'story-chart'}>
          <Settings showLegend={true} legendPosition={Position.Right} onCursorUpdate={onCursorUpdate} />
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
    },
    {
      info: 'Sends an event every time the cursor changes. This is provided to sync cursors between multiple charts.',
    },
  );
