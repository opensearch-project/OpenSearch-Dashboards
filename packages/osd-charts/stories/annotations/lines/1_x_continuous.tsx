import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import {
  AnnotationDomainTypes,
  Axis,
  BarSeries,
  Chart,
  LineAnnotation,
  LineAnnotationDatum,
  ScaleType,
  Settings,
} from '../../../src';
import { Icon } from '../../../src/components/icons/icon';
import { getChartRotationKnob, arrayKnobs } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

function generateAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({ dataValue: value, details: `detail-${index}` }));
}

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();
  const data = arrayKnobs('data values', [2.5, 7.2]);
  const dataValues = generateAnnotationData(data);

  const style = {
    line: {
      strokeWidth: 3,
      stroke: '#f00',
      opacity: 1,
    },
    details: {
      fontSize: 12,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: 'gray',
      padding: 0,
    },
  };

  const isBottom = boolean('x domain axis is bottom', true);
  const axisPosition = isBottom ? Position.Bottom : Position.Top;

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra debug={debug} rotation={rotation} />
      <LineAnnotation
        id="annotation_1"
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        style={style}
        marker={<Icon type="alert" />}
      />
      <Axis id="horizontal" position={axisPosition} title="x-domain axis" />
      <Axis id="vertical" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
