/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, Dimension, Ordered } from '../utils';

export interface Chart {
  values: Array<{
    x: number;
    y: number;
  }>;
  xAxisOrderedValues: number[];
  // @ts-expect-error TS2304 TODO(ts-error): fixme
  xAxisFormat: Dimension['format'];
  // @ts-expect-error TS2304 TODO(ts-error): fixme
  xAxisLabel: Column['name'];
  // @ts-expect-error TS2304 TODO(ts-error): fixme
  yAxisLabel?: Column['name'];
  // @ts-expect-error TS2304 TODO(ts-error): fixme
  ordered: Ordered;
}
