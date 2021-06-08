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

import { Datum, RecursivePartial } from '../../packages/charts/src';
import { Config } from '../../packages/charts/src/chart_types/partition_chart/layout/types/config_types';
import { PrimitiveValue } from '../../packages/charts/src/chart_types/partition_chart/layout/utils/group_by_rollup';
import { mocks } from '../../packages/charts/src/mocks/hierarchical';
import { discreteColor } from './utils';

const raw = mocks.observabilityTree;

interface Node {
  c?: Node[];
  n: string;
  v: number;
}

type Row = { [layerKey: string]: unknown; value: number; depth: number };

const flatTree = ({ c, n, v }: Node, depth: number): Row[] => {
  if (!c) {
    return [{ [`layer_${depth}`]: n, value: v, depth }];
  }
  // as of writing this, the test runner can't run c.flatMap(...)
  const childrenRows = c.reduce<Row[]>((a, child) => [...a, ...flatTree(child, depth + 1)], []);
  const childrenTotal = childrenRows.reduce((p, { value }) => p + value, 0);
  const missing = Math.max(0, v - childrenTotal);
  if (missing > 0) {
    childrenRows.unshift({ [`layer_${depth + 1}`]: undefined, value: missing / 2, depth });
    childrenRows.push({ [`layer_${depth + 1}`]: undefined, value: missing / 2, depth });
  }
  childrenRows.forEach((innerChild) => {
    innerChild[`layer_${depth}`] = n;
  });
  return childrenRows;
};

/** @internal */
export const getFlatData = () => flatTree(raw, 0);

/** @internal */
export const maxDepth = getFlatData().reduce((p, n) => Math.max(p, n.depth), 0);

/** @internal */
export const getLayerSpec = (color: [string, string, string][]) =>
  [...new Array(maxDepth + 1)].map((_, depth) => ({
    groupByRollup: (d: Datum) => d[`layer_${depth}`],
    nodeLabel: (d: PrimitiveValue) => String(d),
    showAccessor: (d: PrimitiveValue) => d !== undefined,
    shape: {
      fillColor: () => discreteColor(color, 0.8)(depth),
    },
  }));

/** @internal */
export const config: RecursivePartial<Config> = {
  fontFamily: 'Arial',
  fillLabel: {
    valueFormatter: (d: number) => d,
    textInvertible: true,
    fontWeight: 500,
  },
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
  minFontSize: 5,
  maxFontSize: 9,
  idealFontSizeJump: 1.01,
  backgroundColor: 'rgba(229,229,229,1)',
};
