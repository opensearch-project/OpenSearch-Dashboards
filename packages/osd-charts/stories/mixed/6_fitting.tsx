import { select, number } from '@storybook/addon-knobs';
import React from 'react';

import {
  AreaSeries,
  Axis,
  Chart,
  CurveType,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  Fit,
  SeriesTypes,
} from '../../src/';

import { SB_KNOBS_PANEL } from '../utils/storybook';

export const example = () => {
  const dataTypes = {
    isolated: [
      { x: 0, y: 3 },
      { x: 1, y: 5 },
      { x: 2, y: null },
      { x: 3, y: 4 },
      { x: 4, y: null },
      { x: 5, y: 5 },
      { x: 6, y: null },
      { x: 7, y: 12 },
      { x: 8, y: null },
      { x: 9, y: 10 },
      { x: 10, y: 7 },
    ],
    successive: [
      { x: 0, y: 3 },
      { x: 1, y: 5 },
      { x: 2, y: null },
      { x: 4, y: null },
      { x: 6, y: null },
      { x: 8, y: null },
      { x: 9, y: 10 },
      { x: 10, y: 7 },
    ],
    endPoints: [
      { x: 0, y: null },
      { x: 1, y: 5 },
      { x: 3, y: 4 },
      { x: 5, y: 5 },
      { x: 7, y: 12 },
      { x: 9, y: 10 },
      { x: 10, y: null },
    ],
    ordinal: [
      { x: 'a', y: null },
      { x: 'b', y: 3 },
      { x: 'c', y: 5 },
      { x: 'd', y: null },
      { x: 'e', y: 4 },
      { x: 'f', y: null },
      { x: 'g', y: 5 },
      { x: 'h', y: 6 },
      { x: 'i', y: null },
      { x: 'j', y: null },
      { x: 'k', y: null },
      { x: 'l', y: 12 },
      { x: 'm', y: null },
    ],
    all: [
      { x: 0, y: null },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: null },
      { x: 4, y: 4 },
      { x: 5, y: null },
      { x: 6, y: 5 },
      { x: 7, y: 6 },
      { x: 8, y: null },
      { x: 9, y: null },
      { x: 10, y: null },
      { x: 11, y: 12 },
      { x: 12, y: null },
    ],
  };

  const seriesType = select<string>(
    'seriesType',
    {
      Area: SeriesTypes.Area,
      Line: SeriesTypes.Line,
    },
    SeriesTypes.Area,
  );
  const dataKey = select<string>(
    'dataset',
    {
      'Isolated Points': 'isolated',
      'Successive null Points': 'successive',
      'null end points': 'endPoints',
      'Ordinal x values': 'ordinal',
      'All edge cases': 'all',
    },
    'all',
  );
  // @ts-ignore
  const dataset = dataTypes[dataKey];
  const fit = select(
    'fitting function',
    {
      None: Fit.None,
      Carry: Fit.Carry,
      Lookahead: Fit.Lookahead,
      Nearest: Fit.Nearest,
      Average: Fit.Average,
      Linear: Fit.Linear,
      Zero: Fit.Zero,
      Explicit: Fit.Explicit,
    },
    Fit.Average,
  );
  const curve = select<CurveType>(
    'Curve',
    {
      'Curve cardinal': CurveType.CURVE_CARDINAL,
      'Curve natural': CurveType.CURVE_NATURAL,
      'Curve monotone x': CurveType.CURVE_MONOTONE_X,
      'Curve monotone y': CurveType.CURVE_MONOTONE_Y,
      'Curve basis': CurveType.CURVE_BASIS,
      'Curve catmull rom': CurveType.CURVE_CATMULL_ROM,
      'Curve step': CurveType.CURVE_STEP,
      'Curve step after': CurveType.CURVE_STEP_AFTER,
      'Curve step before': CurveType.CURVE_STEP_BEFORE,
      Linear: CurveType.LINEAR,
    },
    0,
  );
  const endValue = select<number | 'none' | 'nearest'>(
    'End value',
    {
      None: 'none',
      nearest: 'nearest',
      '0': 0,
      '2': 2,
    },
    'none',
  );
  const parsedEndValue: number | 'nearest' = Number.isNaN(Number(endValue)) ? 'nearest' : Number(endValue);
  const value = number('Explicit valuve (using Fit.Explicit)', 5);
  const xScaleType = dataKey === 'ordinal' ? ScaleType.Ordinal : ScaleType.Linear;

  return (
    <Chart className="story-chart">
      <Settings
        theme={{
          areaSeriesStyle: {
            point: {
              visible: true,
            },
          },
        }}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left" title="Left axis" position={Position.Left} />
      {seriesType === SeriesTypes.Area ? (
        <AreaSeries
          id="test"
          xScaleType={xScaleType}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={curve}
          fit={{
            type: fit,
            value: fit === Fit.Explicit ? value : undefined,
            endValue: endValue === 'none' ? undefined : parsedEndValue,
          }}
          data={dataset}
        />
      ) : (
        <LineSeries
          id="test"
          xScaleType={xScaleType}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={curve}
          fit={{
            type: fit,
            value: fit === Fit.Explicit ? value : undefined,
            endValue: endValue === 'none' ? undefined : parsedEndValue,
          }}
          data={dataset}
        />
      )}
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};
