/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisFieldType } from '../types';

interface ChartTypePossibleMapping {
  columnMatch: [number, number, number];
  mapping: Array<Partial<Record<AxisRole, { type: VisFieldType; index: number }>>>;
}

export const BAR_POSSIBLE_SELECTIONS: ChartTypePossibleMapping[] = [
  {
    columnMatch: [1, 1, 0],
    mapping: [
      // TODO the first one should be default?
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
    ],
  },
  {
    columnMatch: [1, 0, 1],
    mapping: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
    ],
  },
  {
    columnMatch: [1, 1, 1],
    mapping: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
    ],
  },
  {
    columnMatch: [1, 2, 1],
    mapping: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
      },
    ],
  },
  {
    columnMatch: [1, 2, 0],
    mapping: [
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
      },
    ],
  },
];
