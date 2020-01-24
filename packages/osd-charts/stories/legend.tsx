import { boolean, select, number } from '@storybook/addon-knobs';
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
  PartialTheme,
} from '../src/';
import * as TestDatasets from '../src/utils/data_samples/test_dataset';
import { TSVB_DATASET } from '../src/utils/data_samples/test_dataset_tsvb';
import { arrayKnobs } from './common';

export default {
  title: 'Legend',
  parameters: {
    info: {
      source: false,
    },
  },
};

export const right = () => {
  const yAccessors = ['y1', 'y2'];
  const splitSeriesAccessors = ['g1', 'g2'];

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
        yAccessors={yAccessors}
        splitSeriesAccessors={splitSeriesAccessors}
        data={TestDatasets.BARCHART_2Y2G}
        hideInLegend={false}
      />
    </Chart>
  );
};
right.story = {
  name: 'right',
};

export const bottom = () => {
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
};
bottom.story = {
  name: 'bottom',
};

export const left = () => {
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
};
left.story = {
  name: 'left',
};

export const top = () => {
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
};
top.story = {
  name: 'top',
};

export const changingSpecs = () => {
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
};
changingSpecs.story = {
  name: 'changing specs',
};

export const hideLegendItemsBySeries = () => {
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
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
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
        data={[
          { x: 0, y: 3 },
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 10 },
        ]}
        hideInLegend={hideLineSeriesInLegend}
      />
    </Chart>
  );
};
hideLegendItemsBySeries.story = {
  name: 'hide legend items by series',
};

export const displayValuesInLegendElements = () => {
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

  const namesArray = arrayKnobs('series names (in sort order)', ['jpg', 'php', 'png', 'css', 'gif']);

  const seriesComponents = tsvbSeries.map((series: any) => {
    const nameIndex = namesArray.findIndex((name) => {
      return name === series.label;
    });
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
};
displayValuesInLegendElements.story = {
  name: 'display values in legend elements',
};

export const legendSpacingBuffer = () => {
  const theme: PartialTheme = {
    legend: {
      spacingBuffer: number('legend buffer value', 80),
    },
  };

  return (
    <Chart className={'story-chart'}>
      <Settings theme={theme} showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars 1')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 100000000 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
      <BarSeries
        id={getSpecId('bars 2')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 100000000 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
legendSpacingBuffer.story = {
  name: 'legend spacingBuffer',
};
//   {
//     info: {
//       text:
//         'For high variability in values it may be necessary to increase the `spacingBuffer` to account for larger numbers.',
//     },
//   },
// );
