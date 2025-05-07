/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Chart {
  values: Array<{
    x: number;
    y: number;
  }>;
  xAxisOrderedValues: number[];
  xAxisFormat: Dimension['format'];
  xAxisLabel: Column['name'];
  yAxisLabel?: Column['name'];
  ordered: Ordered;
}
