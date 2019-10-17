import { array, boolean, number } from '@storybook/addon-knobs';
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
  LIGHT_THEME,
  LineSeries,
  mergeWithDefaultTheme,
  PartialTheme,
  Position,
  ScaleType,
  Settings,
  niceTimeFormatter,
} from '../src/';
import { SeededDataGenerator } from '../.storybook/utils';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';

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
    const customStyle = {
      tickLabelPadding: number('Tick Label Padding', 0, {
        range: true,
        min: 2,
        max: 30,
        step: 1,
      }),
    };
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 60);
    return (
      <Chart className={'story-chart'}>
        <Settings debug={boolean('debug', false)} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          style={customStyle}
          showOverlappingLabels={boolean('Bottom overlap labels', false, 'Bottom Axis')}
          showOverlappingTicks={boolean('Bottom overlap ticks', true, 'Bottom Axis')}
          ticks={number(
            'Number of ticks on bottom',
            10,
            {
              range: true,
              min: 2,
              max: 20,
              step: 1,
            },
            'Bottom Axis',
          )}
          tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          style={customStyle}
          showOverlappingLabels={boolean('Left overlap labels', false, 'Left Axis')}
          showOverlappingTicks={boolean('Left overlap ticks', true, 'Left Axis')}
          ticks={number(
            'Number of ticks on left',
            10,
            {
              range: true,
              min: 2,
              max: 20,
              step: 1,
            },
            'Left Axis',
          )}
        />

        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
        />
      </Chart>
    );
  })
  .add('tick label rotation', () => {
    const customStyle = {
      tickLabelPadding: number('Tick Label Padding', 0),
    };

    return (
      <Chart className={'story-chart'}>
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
          hide={boolean('hide bottom axis', false)}
          style={customStyle}
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
          style={customStyle}
          hide={boolean('hide left axis', false)}
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
          style={customStyle}
          hide={boolean('hide top axis', false)}
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
          style={customStyle}
          hide={boolean('hide right axis', false)}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <Settings debug={boolean('debug', false)} />
      </Chart>
    );
  })
  .add('4 axes', () => {
    return (
      <Chart className={'story-chart'}>
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'bottom'}
          showOverlappingTicks={true}
          hide={boolean('hide botttom axis', false)}
        />
        <Axis
          id={getAxisId('left')}
          title={'left'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          hide={boolean('hide left axis', false)}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={'top'}
          showOverlappingTicks={true}
          hide={boolean('hide top axis', false)}
        />
        <Axis
          id={getAxisId('right')}
          title={'right'}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
          hide={boolean('hide right axis', false)}
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
  .add('with multi axis', () => {
    const theme: PartialTheme = {
      chartMargins: {
        left: createThemeAction('margin left', 0, 50, 0),
        right: createThemeAction('margin right', 0, 50, 0),
        top: createThemeAction('margin top', 0, 50, 0),
        bottom: createThemeAction('margin bottom', 0, 50, 0),
      },
      chartPaddings: {
        left: createThemeAction('padding left', 0, 50, 0),
        right: createThemeAction('padding right', 0, 50, 0),
        top: createThemeAction('padding top', 0, 50, 0),
        bottom: createThemeAction('padding bottom', 0, 50, 0),
      },
    };
    const customTheme = mergeWithDefaultTheme(theme, LIGHT_THEME);

    const seriesGroup1 = 'group1';
    const seriesGroup2 = 'group2';
    return (
      <Chart size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={false} theme={customTheme} debug={boolean('debug', true)} />
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
      <Chart className={'story-chart'}>
        <Settings showLegend={false} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
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
        />
      </Chart>
    );
  })
  .add('with multi axis different tooltip formats', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={false} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left')}
          groupId={getGroupId('group1')}
          title={'Line 1'}
          position={Position.Left}
          tickFormat={(d) => `${Number(d).toFixed(2)} %`}
        />
        <Axis
          id={getAxisId('right')}
          title={'Line 2'}
          groupId={getGroupId('group2')}
          position={Position.Right}
          tickFormat={(d) => `${Number(d).toFixed(2)}/s`}
        />
        <LineSeries
          id={getSpecId('line1')}
          groupId={getGroupId('group1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 5 }, { x: 1, y: 4 }, { x: 2, y: 3 }, { x: 3, y: 2 }]}
        />
        <LineSeries
          id={getSpecId('line2')}
          groupId={getGroupId('group2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 5 }]}
        />
      </Chart>
    );
  })
  .add('w many tick labels', () => {
    const dg = new SeededDataGenerator();
    const data = dg.generateSimpleSeries(31);
    const customStyle = {
      tickLabelPadding: number('Tick Label Padding', 0),
    };

    return (
      <Chart className={'story-chart'}>
        <Settings debug={true} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          style={customStyle}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
        />
      </Chart>
    );
  })
  .add('customizing domain limits [mixed linear chart]', () => {
    const leftDomain = {
      min: number('left min', 0),
      max: number('left max', 7),
    };

    const rightDomain1 = {
      min: number('right1 min', 0),
      max: number('right1 max', 10),
    };

    const rightDomain2 = {
      min: number('right2 min', 0),
      max: number('right2 max', 10),
    };

    const xDomain = {
      min: number('xDomain min', 0),
      max: number('xDomain max', 3),
    };
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={false} xDomain={xDomain} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={leftDomain}
          hide={boolean('hide left axis', false)}
        />
        <Axis
          id={getAxisId('right')}
          title={'Line axis (Right 1)'}
          groupId={getGroupId('group2')}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={rightDomain1}
        />
        <Axis
          id={getAxisId('right2')}
          title={'Line axis (Right 2)'}
          groupId={getGroupId('group2')}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={rightDomain2}
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
          groupId={getGroupId('group2')}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  })
  .add('customizing domain limits [mixed ordinal & linear x domain]', () => {
    const leftDomain = {
      min: number('left min', 0),
      max: number('left max', 7),
    };

    const right1Domain = {
      min: number('right1 min', 0),
      max: number('right1 max', 10),
    };

    const xDomain = array('xDomain', ['a', 'b', 'c', 'd', 0, 1, 2, 3]);

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={false} xDomain={xDomain} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={leftDomain}
        />
        <Axis
          id={getAxisId('right')}
          title={'Line axis'}
          groupId={getGroupId('group2')}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={right1Domain}
        />
        <Axis
          id={getAxisId('right 2')}
          title={'Line axis 2'}
          groupId={getGroupId('group2')}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Ordinal}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 'a', y: 2 }, { x: 'b', y: 7 }, { x: 'c', y: 3 }, { x: 'd', y: 6 }]}
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
        />
      </Chart>
    );
  })
  .add('customizing domain limits [only one bound defined]', () => {
    const leftDomain = {
      min: number('left min', 0),
    };

    const xDomain = {
      max: number('xDomain max', 3),
    };

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={false} xDomain={xDomain} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          domain={leftDomain}
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
  });
