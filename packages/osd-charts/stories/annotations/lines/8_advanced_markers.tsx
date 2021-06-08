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

import { EuiIcon } from '@elastic/eui';
import { boolean, number } from '@storybook/addon-knobs';
import moment from 'moment';
import React from 'react';

import {
  Chart,
  Axis,
  Settings,
  HistogramBarSeries,
  Position,
  ScaleType,
  LineAnnotation,
  AnnotationDomainType,
  LineAnnotationSpec,
} from '../../../packages/charts/src';
import { isVerticalAxis } from '../../../packages/charts/src/chart_types/xy_chart/utils/axis_type_utils';
import { getChartRotationKnob, getPositionKnob } from '../../utils/knobs';
import { SB_KNOBS_PANEL } from '../../utils/storybook';

const annotationStyle = {
  line: {
    strokeWidth: 1,
    stroke: 'red',
    opacity: 1,
  },
};

const iconMap = {
  [Position.Top]: 'arrowDown',
  [Position.Right]: 'arrowLeft',
  [Position.Bottom]: 'arrowUp',
  [Position.Left]: 'arrowRight',
};

/**
 * Used to rotate text while maintaining correct parent dimensions
 * https://www.kizu.ru/rotated-text/
 */
const getMarkerBody = (valueCb: (v: any) => string, isVertical: boolean): LineAnnotationSpec['markerBody'] => ({
  dataValue,
}) =>
  isVertical ? (
    <div
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        width: '1.5em',
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          transform: 'translate(0, 100%) rotate(-90deg)',
          transformOrigin: '0 0',
        }}
      >
        {valueCb(dataValue)}
        <div
          style={{
            float: 'left',
            marginTop: '100%',
          }}
        />
      </div>
    </div>
  ) : (
    <div>{valueCb(dataValue)}</div>
  );

/** formats values correctly for any rotation/side combination */
const looseFormatter = (d: any) => (d < 100 ? d : moment(d).format('L'));

export const Example = () => {
  const maxMetric = 30;
  const debug = boolean('Debug', true);
  const showLegend = boolean('show legend', true);
  const rotation = getChartRotationKnob();
  const side = getPositionKnob('Side', Position.Bottom);
  const padding = number('TickLine padding for markerBody', 30, { step: 5, min: 0, max: 100 });
  const start = moment('4/1/2020').startOf('d');
  const metric = number('Annotation metric', maxMetric, { step: 1, min: 0, max: maxMetric, range: true });
  const isVerticalSide = isVerticalAxis(side);
  const isYDomain = rotation === -90 || rotation === 90 ? !isVerticalSide : isVerticalSide;

  return (
    <Chart className="story-chart">
      <Settings debug={debug} showLegend={showLegend} rotation={rotation} />
      <Axis
        id="count"
        integersOnly
        tickFormat={looseFormatter}
        position={side === Position.Right ? Position.Right : Position.Left}
        style={{ tickLine: { padding: isVerticalSide ? padding : undefined } }}
      />
      <Axis
        id="x"
        style={{ tickLine: { padding: isVerticalSide ? undefined : padding } }}
        tickFormat={looseFormatter}
        position={side === Position.Top ? Position.Top : Position.Bottom}
      />
      {isYDomain ? (
        <LineAnnotation
          id="annotation_y"
          domainType={AnnotationDomainType.YDomain}
          dataValues={[{ dataValue: metric }]}
          style={annotationStyle}
          hideTooltips
          marker={<EuiIcon type={iconMap[side]} />}
          markerBody={getMarkerBody((v) => `The value is ${v} right here!`, isVerticalSide)}
        />
      ) : (
        <LineAnnotation
          id="annotation_x"
          domainType={AnnotationDomainType.XDomain}
          dataValues={[{ dataValue: start.clone().add(metric, 'd').valueOf() }]}
          style={annotationStyle}
          hideTooltips
          marker={<EuiIcon type={iconMap[side]} />}
          markerBody={getMarkerBody((v) => moment(v).format('lll'), isVerticalSide)}
        />
      )}
      <HistogramBarSeries
        id="bars"
        xScaleType={ScaleType.Time}
        data={Array.from({ length: maxMetric })
          .fill(0)
          .map((_, i) => ({ x: start.clone().add(i, 'd').valueOf(), y: maxMetric }))}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
    info: {
      text: `The \`markerBody\` on the \`LineAnnotationSpec\` will be dynamically positioned to show content that would otherwise be hidden or overflow the chart.
        The \`marker\` prop (also on the \`LineAnnotationSpec\`) however, will always be positioned centered on the given \`dataValue\`.
        These can be used interchangeably to provide a content-rich annotation without losing the data reference.
        **Note: you will need to provide the necessary axis padding for the \`markerBody\` content as this is _not_ currently accounted for in the chart dimensioning**`,
    },
  },
};
