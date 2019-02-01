import { boolean, number, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import React from 'react';
import { Axis, BarSeries, Chart, getAxisId, getSpecId, Position, ScaleType, Settings } from '..';
import { GridLineConfig, PartialTheme } from '../lib/themes/theme';

function createThemeAction(title: string, min: number, max: number, value: number) {
  return number(title, value, {
    range: true,
    min,
    max,
    step: 1,
  });
}

storiesOf('Stylings', module)
  .add('margins and paddings', () => {
    const theme: PartialTheme = {
      chart: {
        margins: {
          left: createThemeAction('margin left', 0, 50, 10),
          right: createThemeAction('margin right', 0, 50, 10),
          top: createThemeAction('margin top', 0, 50, 10),
          bottom: createThemeAction('margin bottom', 0, 50, 10),
        },
        paddings: {
          left: createThemeAction('padding left', 0, 50, 10),
          right: createThemeAction('padding right', 0, 50, 10),
          top: createThemeAction('padding top', 0, 50, 10),
          bottom: createThemeAction('padding bottom', 0, 50, 10),
        },
      },
    };

    const leftAxisGridLine: GridLineConfig = {
      stroke: 'purple',
      strokeWidth: number('left axis grid line stroke width', 1, {
        range: true,
        min: 0,
        max: 10,
        step: 1,
      }),
      opacity: number('left axis grid line stroke opacity', 1, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
      dash: [
        number('left axis grid line dash length', 1, {
          range: true,
          min: 0,
          max: 10,
          step: 1,
        }),
        number('left axis grid line dash spacing', 1, {
          range: true,
          min: 0,
          max: 10,
          step: 1,
        }),
      ],
    };

    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings theme={theme} debug={boolean('debug', true)} />
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
          gridLineStyle={leftAxisGridLine}
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
  .add('axis (TOFIX)', () => {
    const theme: PartialTheme = {
      axes: {
        tickFontSize: createThemeAction('tickFontSize', 0, 40, 10),
        tickFontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
        tickFontStyle: 'normal',
        titleFontSize: createThemeAction('titleFontSize', 0, 40, 12),
        titleFontStyle: 'bold',
        titleFontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
        titlePadding: createThemeAction('titlePadding', 0, 40, 5),
      },
    };
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings
          theme={theme}
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
  });
