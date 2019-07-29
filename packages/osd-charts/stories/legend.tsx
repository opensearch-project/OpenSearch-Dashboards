import { array, boolean, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import React from 'react';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  CurveType,
  getAxisId,
  getSpecId,
  LineSeries,
  Position,
  ScaleType,
  Settings,
} from '../src/';
import * as TestDatasets from '../src/utils/data_samples/test_dataset';
import { TSVB_DATASET } from '../src/utils/data_samples/test_dataset_tsvb';

storiesOf('Legend', module)
  .add('right', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
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
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={['g1', 'g2']}
          data={TestDatasets.BARCHART_2Y2G}
          hideInLegend={false}
        />
      </Chart>
    );
  })
  .add('bottom', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Bottom} />
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
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={['g1', 'g2']}
          data={TestDatasets.BARCHART_2Y2G}
        />
      </Chart>
    );
  })
  .add('left', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Left} />
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
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={['g1', 'g2']}
          data={TestDatasets.BARCHART_2Y2G}
        />
      </Chart>
    );
  })
  .add('top', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Top} />
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
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={['g1', 'g2']}
          data={TestDatasets.BARCHART_2Y2G}
        />
      </Chart>
    );
  })
  .add('changing specs', () => {
    const splitSeries = boolean('split series', true) ? ['g1', 'g2'] : undefined;
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Top} />
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
          yAccessors={['y1', 'y2']}
          splitSeriesAccessors={splitSeries}
          data={TestDatasets.BARCHART_2Y2G}
        />
      </Chart>
    );
  })
  .add('hide legend items by series', () => {
    const hideBarSeriesInLegend = boolean('hide bar series in legend', false);
    const hideLineSeriesInLegend = boolean('hide line series in legend', false);

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
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
          hideInLegend={hideBarSeriesInLegend}
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
          hideInLegend={hideLineSeriesInLegend}
        />
      </Chart>
    );
  })
  .add('display values in legend elements', () => {
    const showLegendDisplayValue = boolean('show display value in legend', true);
    const legendPosition = select(
      'legendPosition',
      {
        right: Position.Right,
        bottom: Position.Bottom,
        left: Position.Left,
        top: Position.Top,
      },
      Position.Right,
    );

    const tsvbSeries = TSVB_DATASET.series;

    const namesArray = array('series names (in sort order)', ['jpg', 'php', 'png', 'css', 'gif']);

    const seriesComponents = tsvbSeries.map((series: any) => {
      const nameIndex = namesArray.findIndex((name: string) => name === series.label);
      const sortIndex = nameIndex > -1 ? nameIndex : undefined;

      return (
        <AreaSeries
          key={`${series.id}-${series.label}`}
          id={getSpecId(`${series.id}-${series.label}`)}
          name={series.label}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={series.data}
          curve={series.lines.steps ? CurveType.CURVE_STEP : CurveType.LINEAR}
          sortIndex={sortIndex}
        />
      );
    });
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={legendPosition} showLegendDisplayValue={showLegendDisplayValue} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        {seriesComponents}
      </Chart>
    );
  });
