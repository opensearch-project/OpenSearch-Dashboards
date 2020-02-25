import { boolean, select } from '@storybook/addon-knobs';
import React from 'react';
import { AreaSeries, Axis, Chart, CurveType, Position, ScaleType, Settings } from '../../src/';
import { TSVB_DATASET } from '../../src/utils/data_samples/test_dataset_tsvb';
import { arrayKnobs } from '../utils/knobs';

export const example = () => {
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
        id={`${series.id}-${series.label}`}
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
    <Chart className="story-chart">
      <Settings showLegend={true} legendPosition={legendPosition} showLegendExtra={showLegendDisplayValue} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
      {seriesComponents}
    </Chart>
  );
};
