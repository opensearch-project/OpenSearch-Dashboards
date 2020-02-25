import { action } from '@storybook/addon-actions';
import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings, TooltipValue, TooltipValueFormatter } from '../../src/';

const onElementListeners = {
  onElementClick: action('onElementClick'),
  onElementOver: action('onElementOver'),
  onElementOut: action('onElementOut'),
};

export const example = () => {
  const headerFormatter: TooltipValueFormatter = (tooltip: TooltipValue) => {
    if (tooltip.value % 2 === 0) {
      return (
        <div>
          <p>special header for even x values</p>
          <p>{tooltip.value}</p>
        </div>
      );
    }

    return tooltip.value;
  };

  const tooltipProps = {
    headerFormatter,
  };

  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
        {...onElementListeners}
        tooltip={tooltipProps}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
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
      />
    </Chart>
  );
};
