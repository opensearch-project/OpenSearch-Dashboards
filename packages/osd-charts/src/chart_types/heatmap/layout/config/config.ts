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

import { Config } from '../types/config_types';

/** @internal */
export const config: Config = {
  width: 500,
  height: 500,
  margin: { left: 0.01, right: 0.01, top: 0.01, bottom: 0.01 },
  maxRowHeight: 30,
  maxColumnWidth: 30,

  fontFamily: 'Sans-Serif',

  onBrushEnd: undefined,

  brushArea: {
    visible: true,
    fill: 'black', // black === transparent
    stroke: '#69707D', // euiColorDarkShade,
    strokeWidth: 2,
  },
  brushMask: {
    visible: true,
    fill: 'rgb(115 115 115 / 50%)',
  },
  brushTool: {
    visible: false,
    fill: 'gray',
  },

  timeZone: 'UTC',

  xAxisLabel: {
    name: 'X Value',
    visible: true,
    width: 'auto',
    fill: 'black',
    fontSize: 12,
    fontFamily: 'Sans-Serif',
    fontStyle: 'normal',
    textColor: 'black',
    fontVariant: 'normal',
    fontWeight: 'normal',
    textOpacity: 1,
    align: 'center' as CanvasTextAlign,
    baseline: 'verticalAlign' as CanvasTextBaseline,
    padding: 6,
    formatter: String,
  },
  yAxisLabel: {
    name: 'Y Value',
    visible: true,
    width: 'auto',
    fill: 'black',
    fontSize: 12,
    fontFamily: 'Sans-Serif',
    fontStyle: 'normal',
    textColor: 'black',
    fontVariant: 'normal',
    fontWeight: 'normal',
    textOpacity: 1,
    baseline: 'verticalAlign' as CanvasTextBaseline,
    padding: 5,
    formatter: String,
  },
  grid: {
    cellWidth: {
      min: 0,
      max: 30,
    },
    cellHeight: {
      min: 12,
      max: 30,
    },
    stroke: {
      width: 1,
      color: 'gray',
    },
  },
  cell: {
    maxWidth: 'fill',
    maxHeight: 'fill',
    align: 'center',
    label: {
      visible: true,
      maxWidth: 'fill',
      fill: 'black',
      fontSize: 10,
      fontFamily: 'Sans-Serif',
      fontStyle: 'normal',
      textColor: 'black',
      fontVariant: 'normal',
      fontWeight: 'normal',
      textOpacity: 1,
      align: 'center' as CanvasTextAlign,
      baseline: 'verticalAlign' as CanvasTextBaseline,
    },
    border: {
      strokeWidth: 1,
      stroke: 'gray',
    },
  },
};
