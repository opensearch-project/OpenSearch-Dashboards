import { action } from '@storybook/addon-actions';
import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';

import { array, boolean, number, select } from '@storybook/addon-knobs';
import { BARCHART_2Y2G } from '../../src/utils/data_samples/test_dataset';

const onLegendItemListeners = {
  onLegendItemOver: action('onLegendItemOver'),
  onLegendItemOut: action('onLegendItemOut'),
  onLegendItemClick: action('onLegendItemClick'),
  onLegendItemPlusClick: action('onLegendItemPlusClick'),
  onLegendItemMinusClick: action('onLegendItemMinusClick'),
};

export const example = () => {
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
    <Chart className="story-chart">
      <Settings
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
        {...onLegendItemListeners}
        xDomain={xDomain}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        domain={yDomain}
      />

      <BarSeries
        id="bars"
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
};
