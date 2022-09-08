/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SchemaConfig } from '../../../../../visualizations/public';
import { ValueAxis } from '../../../../../vis_type_vislib/public';

interface ValueAxisConfig extends ValueAxis {
  style: any;
}

export const getValueAxes = (yAxes: SchemaConfig[]): ValueAxisConfig[] =>
  yAxes.map((y, index) => ({
    id: `ValueAxis-${index + 1}`,
    labels: {
      show: true,
    },
    name: `ValueAxis-${index + 1}`,
    position: 'left',
    scale: {
      type: 'linear',
      mode: 'normal',
    },
    show: true,
    style: {},
    title: {
      text: y.label,
    },
    type: 'value',
  }));
