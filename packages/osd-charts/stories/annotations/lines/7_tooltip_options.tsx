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
 * under the License.
 */

import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import {
  AnnotationTooltipFormatter,
  Axis,
  BarSeries,
  Chart,
  ScaleType,
  Settings,
  LineAnnotation,
  AnnotationDomainType,
  LineAnnotationDatum,
} from '../../../packages/charts/src';
import { CustomAnnotationTooltip } from '../../../packages/charts/src/chart_types/xy_chart/annotations/types';
import { Icon } from '../../../packages/charts/src/components/icons/icon';
import { Position } from '../../../packages/charts/src/utils/common';
import {
  arrayKnobs,
  getBoundaryKnob,
  getChartRotationKnob,
  getFallbackPlacementsKnob,
  getPlacementKnob,
} from '../../utils/knobs';

function generateAnnotationData(values: any[]): LineAnnotationDatum[] {
  return values.map((value, index) => ({ dataValue: value, details: `detail-${index}` }));
}

export const Example = () => {
  const rotation = getChartRotationKnob();
  const boundary = getBoundaryKnob();
  const placement = getPlacementKnob('Tooltip placement');
  const fallbackPlacements = getFallbackPlacementsKnob();
  const offset = number('tooltip offset', 10);
  const showCustomTooltip = boolean('custom tooltip', false);
  const showCustomDetails = boolean('custom tooltip details', false);

  const dataValues = generateAnnotationData(arrayKnobs('annotation values', ['a', 'c']));

  const customTooltip: CustomAnnotationTooltip | undefined = showCustomTooltip
    ? ({ header, details }) => (
        <div style={{ backgroundColor: 'blue', color: 'white', padding: 10 }}>
          <h2>custom tooltip -{header}</h2>
          <p>{details}</p>
        </div>
      )
    : undefined;
  const customTooltipDetails: AnnotationTooltipFormatter | undefined = showCustomDetails
    ? (details) => (
        <div>
          <h2>custom Details</h2>
          <p>{details}</p>
        </div>
      )
    : undefined;

  return (
    <Chart className="story-chart">
      <Settings rotation={rotation} />
      <LineAnnotation
        id="annotation_1"
        domainType={AnnotationDomainType.XDomain}
        offset={offset}
        dataValues={dataValues}
        boundary={boundary}
        placement={placement}
        fallbackPlacements={fallbackPlacements}
        customTooltip={customTooltip}
        customTooltipDetails={customTooltipDetails}
        marker={<Icon type="alert" />}
      />
      <Axis id="top" position={Position.Top} title="x-domain axis (top)" />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis (bottom)" />
      <Axis id="left" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 2 },
          { x: 'b', y: 7 },
          { x: 'c', y: 3 },
          { x: 'd', y: 6 },
        ]}
      />
    </Chart>
  );
};
