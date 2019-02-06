import { boolean, number } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import React from 'react';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  getAxisId,
  getGroupId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
} from '../src/';
import { PartialTheme } from '../src/lib/themes/theme';
import { LineSeries } from '../src/specs';
import { DataGenerator } from '../src/utils/data_generators/data_generator';

function createThemeAction(title: string, min: number, max: number, value: number) {
  return number(
    title,
    value,
    {
      range: true,
      min,
      max,
      step: 1,
    },
    'theme',
  );
}

function renderAxisWithOptions(position: Position, seriesGroup: string, show: boolean) {
  const axisTitle = `${position} axis (${seriesGroup})`;

  const showAxis = boolean(`show ${axisTitle} axis`, show, `${position} axes`);

  if (!showAxis) {
    return null;
  }

  const axisProps = {
    id: getAxisId(axisTitle),
    position,
    title: axisTitle,
    showOverlappingTicks: true,
  };

  return <Axis {...axisProps} />;
}

storiesOf('Axis', module)
  .add('basic', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings debug={boolean('debug', false)} />
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

        <AreaSeries
          id={getSpecId('lines')}
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
  .add('tick label rotation', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          tickLabelRotation={number('bottom axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
        />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickLabelRotation={number('left axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('top')}
          title={'Bar axis'}
          position={Position.Top}
          tickLabelRotation={number('top axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('right')}
          title={'Bar axis'}
          position={Position.Right}
          tickLabelRotation={number('right axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
        <Settings debug={boolean('debug', false)} />
      </Chart>
    );
  })
  .add('4 axes', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'bottom'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left')}
          title={'left'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={'top'}
          showOverlappingTicks={true}
        />
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
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('with multi axis', () => {
    const theme: PartialTheme = {
      chart: {
        margins: {
          left: createThemeAction('margin left', 0, 50, 0),
          right: createThemeAction('margin right', 0, 50, 0),
          top: createThemeAction('margin top', 0, 50, 0),
          bottom: createThemeAction('margin bottom', 0, 50, 0),
        },
        paddings: {
          left: createThemeAction('padding left', 0, 50, 0),
          right: createThemeAction('padding right', 0, 50, 0),
          top: createThemeAction('padding top', 0, 50, 0),
          bottom: createThemeAction('padding bottom', 0, 50, 0),
        },
      },
    };

    const seriesGroup1 = 'group1';
    const seriesGroup2 = 'group2';
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={false} theme={theme} debug={boolean('debug', true)} />
        {renderAxisWithOptions(Position.Top, seriesGroup1, false)}
        {renderAxisWithOptions(Position.Top, seriesGroup2, true)}
        {renderAxisWithOptions(Position.Left, seriesGroup1, false)}
        {renderAxisWithOptions(Position.Left, seriesGroup2, true)}
        {renderAxisWithOptions(Position.Bottom, seriesGroup1, false)}
        {renderAxisWithOptions(Position.Bottom, seriesGroup2, true)}
        {renderAxisWithOptions(Position.Right, seriesGroup1, false)}
        {renderAxisWithOptions(Position.Right, seriesGroup2, true)}
        <BarSeries
          id={getSpecId('barseries1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 4 }]}
        />
      </Chart>
    );
  })
  .add('with multi axis bar/lines', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={false} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('right')}
          title={'Line axis'}
          groupId={getGroupId('group2')}
          position={Position.Right}
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
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          groupId={getGroupId('group2')}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('w many tick labels', () => {
    const dg = new DataGenerator();
    const data = dg.generateSimpleSeries(31);
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings debug={true} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  });
