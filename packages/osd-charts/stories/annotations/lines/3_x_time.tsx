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
  timeFormatter,
} from '../../../src';
import { Icon } from '../../../src/components/icons/icon';
import { KIBANA_METRICS } from '../../../src/utils/data_samples/test_dataset_kibana';
import { getChartRotationKnob } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

const dateFormatter = timeFormatter('HH:mm:ss');

function generateTimeAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({
    dataValue: value,
    details: `detail-${index}`,
    header: dateFormatter(value),
  }));
}

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  const dataValues = generateTimeAnnotationData([
    1551438150000,
    1551438180000,
    1551438390000,
    1551438450000,
    1551438480000,
  ]);

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <LineAnnotation
        id="annotation_1"
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        marker={<Icon type="alert" />}
      />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis" tickFormat={dateFormatter} />
      <Axis id="left" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20)}
      />
    </Chart>
  );
};
