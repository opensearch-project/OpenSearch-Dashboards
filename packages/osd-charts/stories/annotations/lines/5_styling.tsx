/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { boolean, color, number, select } from '@storybook/addon-knobs';
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
import { getChartRotationKnob } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

function generateAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({ dataValue: value, details: `detail-${index}` }));
}

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  const data = [2.5, 7.2];
  const dataValues = generateAnnotationData(data);

  const dashWidth = number('dash line width', 1);
  const dashGapWidth = number('dash gap width', 0);

  const style = {
    line: {
      strokeWidth: number('line stroke width', 3),
      stroke: color('line & marker color', '#f00'),
      dash: [dashWidth, dashGapWidth],
      opacity: number('line opacity', 1, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };

  const axisPosition = Position.Bottom;

  const marker = select<'alert' | 'eye' | 'questionInCircle'>(
    'marker icon (examples from internal Icon library)',
    {
      alert: 'alert',
      eye: 'eye',
      questionInCircle: 'questionInCircle',
    },
    'alert',
  );

  const hideLines = boolean('annotation lines hidden', false);
  const hideTooltips = boolean('annotation tooltips hidden', false);

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <LineAnnotation
        id="annotation_1"
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={dataValues}
        style={style}
        marker={<Icon type={marker} />}
        hideLines={hideLines}
        hideTooltips={hideTooltips}
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
