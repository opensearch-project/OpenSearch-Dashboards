import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import { AnnotationDomainTypes, Axis, BarSeries, Chart, LineAnnotation, ScaleType, Settings } from '../../../src';
import { getChartRotationKnob } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  const dataValues = [
    {
      dataValue: 3.5,
    },
  ];

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

  const xDomain = {
    minInterval: 1,
  };

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} xDomain={xDomain} />
      <LineAnnotation
        id="annotation_1"
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        style={style}
      />
      <Axis id="horizontal" position={Position.Bottom} title="x-domain axis" />
      <Axis id="vertical" title="y-domain axis" position={Position.Left} />
      <BarSeries
        enableHistogramMode={true}
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[{ x: 3, y: 2 }]}
      />
    </Chart>
  );
};
