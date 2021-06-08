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

import { boolean, number, select } from '@storybook/addon-knobs';
import { range } from 'lodash';
import React from 'react';

import {
  Chart,
  Axis,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  AreaSeries,
  CurveType,
  YDomainBase,
} from '../../packages/charts/src';
import { LogBase, LogScaleOptions } from '../../packages/charts/src/scales/scale_continuous';
import { logBaseMap, logFormatter } from '../utils/formatters';
import { getKnobsFromEnum } from '../utils/knobs';
import { SB_SOURCE_PANEL } from '../utils/storybook';

type LogKnobs = LogScaleOptions &
  Pick<YDomainBase, 'fit' | 'padding'> & {
    dataType: string;
    negative: boolean;
    scaleType: Extract<ScaleType, 'log' | 'linear'>;
  };

const getDataType = (group: string, defaultType = 'increasing') =>
  select(
    'Data type',
    {
      Increasing: 'increasing',
      Decreasing: 'decreasing',
      'Up Down': 'upDown',
      'Down Up': 'downUp',
    },
    defaultType,
    group,
  );

const getScaleType = (type: ScaleType, group: string) =>
  getKnobsFromEnum('Scale Type', ScaleType, type, { group, include: ['linear', 'log'] }) as Extract<
    ScaleType,
    'log' | 'linear'
  >;

const getLogKnobs = (isXAxis = false): LogKnobs => {
  const group = isXAxis ? 'X - Axis' : 'Y - Axis';
  const useDefaultLimit = boolean('Use default limit', isXAxis, group);
  const limit = number('Log min limit', 1, { min: 0 }, group);

  return {
    ...(!isXAxis && { fit: boolean('Fit domain', true, group) }),
    dataType: getDataType(group, isXAxis ? undefined : 'upDown'),
    negative: boolean('Use negative values', false, group),
    ...(!isXAxis && { logMinLimit: useDefaultLimit ? undefined : limit }),
    logBase: getKnobsFromEnum('Log base', LogBase, LogBase.Common as LogBase, {
      group,
      allowUndefined: true,
    }),
    scaleType: getScaleType(ScaleType.Log, group),
    ...(!isXAxis && { padding: number('Padding', 0, { min: 0 }, group) }),
  };
};

const getDataValue = (type: string, v: number, i: number, length: number) => {
  switch (type) {
    case 'increasing':
      return i - Math.round(length / 2);
    case 'decreasing':
      return -i + Math.round(length / 2);
    case 'upDown':
      return v;
    case 'downUp':
    default:
      return -v;
  }
};

const seriesMap = {
  line: LineSeries,
  area: AreaSeries,
};

const getSeriesType = () =>
  select<keyof typeof seriesMap>(
    'Series Type',
    {
      Line: 'line',
      Area: 'area',
    },
    'line',
  );

const getInitalData = (rows: number) => {
  const quart = Math.round(rows / 4);
  return [...range(quart, -quart, -1), ...range(-quart, quart + 1, 1)];
};

const getData = (rows: number, yLogKnobs: LogKnobs, xLogKnobs: LogKnobs) =>
  getInitalData(rows).map((v, i, { length }) => {
    const y0 = getDataValue(yLogKnobs.dataType, v, i, length);
    const x0 = getDataValue(xLogKnobs.dataType, v, i, length);
    return {
      y: Math.pow(logBaseMap[yLogKnobs.logBase ?? LogBase.Common], y0) * (yLogKnobs.negative ? -1 : 1),
      x: Math.pow(logBaseMap[xLogKnobs.logBase ?? LogBase.Common], x0) * (xLogKnobs.negative ? -1 : 1),
    };
  });

export const Example = () => {
  const rows = number('Rows in dataset', 11, { min: 5, step: 2, max: 21 });
  const yLogKnobs = getLogKnobs(false);
  const xLogKnobs = getLogKnobs(true);
  const data = getData(rows, yLogKnobs, xLogKnobs);
  const type = getSeriesType();
  const curve = getKnobsFromEnum('Curve type', CurveType, CurveType.CURVE_CARDINAL as CurveType);
  const Series = seriesMap[type];

  return (
    <Chart className="story-chart">
      <Settings xDomain={xLogKnobs} />
      <Axis id="y" position={Position.Left} domain={yLogKnobs} tickFormat={logFormatter(yLogKnobs.logBase)} />
      <Axis
        id="x"
        tickFormat={logFormatter(xLogKnobs.logBase)}
        position={Position.Bottom}
        style={{ tickLabel: { rotation: -90 } }}
      />
      <Series
        id="series"
        curve={curve}
        yScaleType={yLogKnobs.scaleType}
        xScaleType={xLogKnobs.scaleType}
        areaSeriesStyle={{ point: { visible: true } }}
        data={data}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `With the \`domain.fit\` option enabled, Log scales will try to best fit the y axis data without setting a baseline to a hardcoded value, currently 1.
      If you provide a \`logMinLimit\` on the \`Axis.domain\` prop, the scale will be limited to that value.
      This is _not_ the same as min domain value, such that if all values are greater than \`logMinLimit\`,
      the domain min will be determined solely by the dataset.\n\nThe \`domain.logBase\` and \`xDomain.logBase\` options
      provide a way to set the base of the log to one of following:
      [\`Common\`](https://en.wikipedia.org/wiki/Common_logarithm) (base 10),
      [\`Binary\`](https://en.wikipedia.org/wiki/Binary_logarithm) (base 2),
      [\`Natural\`](https://en.wikipedia.org/wiki/Natural_logarithm) (base e), the default is \`Common\``,
    },
  },
};
