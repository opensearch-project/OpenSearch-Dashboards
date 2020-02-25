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

  const data = arrayKnobs('data values', [1.5, 7.2]);
  const dataValues = generateAnnotationData(data);

  const isLeft = boolean('y-domain axis is Position.Left', true);
  const axisTitle = isLeft ? 'y-domain axis (left)' : 'y-domain axis (right)';
  const axisPosition = isLeft ? Position.Left : Position.Right;

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <LineAnnotation
        id="annotation_1"
        domainType={AnnotationDomainTypes.YDomain}
        dataValues={dataValues}
        marker={<Icon type="alert" />}
      />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis" />
      <Axis id="left" title={axisTitle} position={axisPosition} />
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
