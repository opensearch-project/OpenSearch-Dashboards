import React from 'react';

import { BarSeries, Chart, ScaleType, Settings, TooltipType, RecursivePartial, Theme } from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dg = new SeededDataGenerator();
const data2 = dg.generateSimpleSeries(40);

export const example = () => {
  const theme: RecursivePartial<Theme> = {
    chartMargins: {
      bottom: 0,
      left: 0,
      top: 0,
      right: 0,
    },
  };
  return (
    <div>
      <Chart className="story-chart" size={{ width: 100, height: 50 }}>
        <Settings tooltip={TooltipType.None} theme={theme} />
        <BarSeries
          id="bars"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data2}
        />
      </Chart>
      <Chart className="story-chart" size={{ height: 50 }}>
        <Settings tooltip={TooltipType.None} theme={theme} />
        <BarSeries
          id="bars"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data2}
        />
      </Chart>
      <Chart className="story-chart" size={['50%', 50]}>
        <Settings tooltip={TooltipType.None} theme={theme} />
        <BarSeries
          id="bars"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data2}
        />
      </Chart>
      <Chart className="story-chart" size={[undefined, 50]}>
        <Settings tooltip={TooltipType.None} theme={theme} />
        <BarSeries
          id="bars"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data2}
        />
      </Chart>
      <Chart className="story-chart" size={50}>
        <Settings tooltip={TooltipType.None} theme={theme} />
        <BarSeries
          id="bars"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data2}
        />
      </Chart>
    </div>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
