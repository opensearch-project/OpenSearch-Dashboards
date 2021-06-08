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

import { CategoryKey } from '../../../../common/category';
import { Relation } from '../../../../common/text_utils';
import { LegendPath } from '../../../../state/actions/legend';
import { Datum, ValueAccessor } from '../../../../utils/common';

/** @public */
export const AGGREGATE_KEY = 'value';
/** @public */
export const STATISTICS_KEY = 'statistics';
/** @public */
export const DEPTH_KEY = 'depth';
/** @public */
export const CHILDREN_KEY = 'children';
/** @public */
export const INPUT_KEY = 'inputIndex';
/** @public */
export const PARENT_KEY = 'parent';
/** @public */
export const SORT_INDEX_KEY = 'sortIndex';
/** @public */
export const PATH_KEY = 'path';

/** @public */
export interface Statistics {
  globalAggregate: number;
}

/** @public */
export interface NodeDescriptor {
  [AGGREGATE_KEY]: number;
  [DEPTH_KEY]: number;
  [STATISTICS_KEY]: Statistics;
  [INPUT_KEY]?: Array<number>;
}

/** @public */
export type ArrayEntry = [Key, ArrayNode];
/** @public */
export type HierarchyOfArrays = Array<ArrayEntry>;
/** @public */
export interface ArrayNode extends NodeDescriptor {
  [CHILDREN_KEY]: HierarchyOfArrays;
  [PARENT_KEY]: ArrayNode;
  [SORT_INDEX_KEY]: number;
  [PATH_KEY]: LegendPath;
}

type HierarchyOfMaps = Map<Key, MapNode>;
interface MapNode extends NodeDescriptor {
  [CHILDREN_KEY]?: HierarchyOfMaps;
  [PARENT_KEY]?: ArrayNode;
}

/** @internal */
export const HIERARCHY_ROOT_KEY: Key = '__root_key__';

/** @public */
export type PrimitiveValue = string | number | null; // there could be more but sufficient for now
/** @public */
export type Key = CategoryKey;
/** @public */
export type Sorter = (a: number, b: number) => number;

/**
 * Binary predicate function used for `[].sort`ing partitions represented as ArrayEntries
 * @public
 */
export type NodeSorter = (a: ArrayEntry, b: ArrayEntry) => number;

/** @public */
export const entryKey = ([key]: ArrayEntry) => key;
/** @public */
export const entryValue = ([, value]: ArrayEntry) => value;
/** @public */
export function depthAccessor(n: ArrayEntry) {
  return entryValue(n)[DEPTH_KEY];
}
/** @public */
export function aggregateAccessor(n: ArrayEntry): number {
  return entryValue(n)[AGGREGATE_KEY];
}
/** @public */
export function parentAccessor(n: ArrayEntry): ArrayNode {
  return entryValue(n)[PARENT_KEY];
}
/** @public */
export function childrenAccessor(n: ArrayEntry) {
  return entryValue(n)[CHILDREN_KEY];
}
/** @public */
export function sortIndexAccessor(n: ArrayEntry) {
  return entryValue(n)[SORT_INDEX_KEY];
}
/** @public */
export function pathAccessor(n: ArrayEntry) {
  return entryValue(n)[PATH_KEY];
}

/** @public */
export function getNodeName(node: ArrayNode) {
  const index = node[SORT_INDEX_KEY];
  const arrayEntry: ArrayEntry = node[PARENT_KEY][CHILDREN_KEY][index];
  return entryKey(arrayEntry);
}

/** @internal */
export function groupByRollup(
  keyAccessors: Array<((a: Datum) => Key) | ((a: Datum, i: number) => Key)>,
  valueAccessor: ValueAccessor,
  {
    reducer,
    identity,
  }: {
    reducer: (prev: number, next: number) => number;
    identity: () => any;
  },
  factTable: Relation,
): HierarchyOfMaps {
  const statistics: Statistics = {
    globalAggregate: NaN,
  };
  const reductionMap: HierarchyOfMaps = factTable.reduce((p: HierarchyOfMaps, n, index) => {
    const keyCount = keyAccessors.length;
    let pointer: HierarchyOfMaps = p;
    keyAccessors.forEach((keyAccessor, i) => {
      const key: Key = keyAccessor(n, index);
      const last = i === keyCount - 1;
      const node = pointer.get(key);
      const inputIndices = node?.[INPUT_KEY] ?? [];
      const childrenMap = node?.[CHILDREN_KEY] ?? new Map();
      const aggregate = node?.[AGGREGATE_KEY] ?? identity();
      const reductionValue = reducer(aggregate, valueAccessor(n));
      pointer.set(key, {
        [AGGREGATE_KEY]: reductionValue,
        [STATISTICS_KEY]: statistics,
        [INPUT_KEY]: [...inputIndices, index],
        [DEPTH_KEY]: i,
        ...(!last && { [CHILDREN_KEY]: childrenMap }),
      });
      if (childrenMap) {
        // will always be true except when exiting from forEach, ie. upon encountering the leaf node
        pointer = childrenMap;
      }
    });
    return p;
  }, new Map());
  if (reductionMap.get(HIERARCHY_ROOT_KEY) !== undefined) {
    statistics.globalAggregate = (reductionMap.get(HIERARCHY_ROOT_KEY) as MapNode)[AGGREGATE_KEY];
  }
  return reductionMap;
}

function getRootArrayNode(): ArrayNode {
  const children: HierarchyOfArrays = [];
  const bootstrap: Omit<ArrayNode, typeof PARENT_KEY> = {
    [AGGREGATE_KEY]: NaN,
    [DEPTH_KEY]: NaN,
    [CHILDREN_KEY]: children,
    [INPUT_KEY]: [] as number[],
    [PATH_KEY]: [] as LegendPath,
    [SORT_INDEX_KEY]: 0,
    [STATISTICS_KEY]: { globalAggregate: 0 },
  };
  (bootstrap as ArrayNode)[PARENT_KEY] = bootstrap as ArrayNode;
  return bootstrap as ArrayNode; // TS doesn't yet handle bootstrapping but the `Omit` above retains guarantee for all props except `[PARENT_KEY]`
}

/** @internal */
export function mapsToArrays(root: HierarchyOfMaps, sortSpecs: (NodeSorter | null)[]): HierarchyOfArrays {
  const groupByMap = (node: HierarchyOfMaps, parent: ArrayNode) => {
    const items = Array.from(
      node,
      ([key, value]: [Key, MapNode]): ArrayEntry => {
        const valueElement = value[CHILDREN_KEY];
        const resultNode: ArrayNode = {
          [AGGREGATE_KEY]: NaN,
          [STATISTICS_KEY]: { globalAggregate: NaN },
          [CHILDREN_KEY]: [],
          [DEPTH_KEY]: NaN,
          [SORT_INDEX_KEY]: NaN,
          [PARENT_KEY]: parent,
          [INPUT_KEY]: [],
          [PATH_KEY]: [],
        };
        const newValue: ArrayNode = Object.assign(
          resultNode,
          value,
          valueElement && { [CHILDREN_KEY]: groupByMap(valueElement, resultNode) },
        );
        return [key, newValue];
      },
    );
    if (sortSpecs.some((s) => s !== null)) {
      items.sort((e1: ArrayEntry, e2: ArrayEntry) => {
        const node1 = e1[1];
        const node2 = e2[1];
        if (node1[DEPTH_KEY] !== node2[DEPTH_KEY]) return node1[DEPTH_KEY] - node2[DEPTH_KEY];
        const depth = node1[DEPTH_KEY];
        const sorterWithinLayer = sortSpecs[depth];
        return sorterWithinLayer ? sorterWithinLayer(e1, e2) : node2.value - node1.value;
      });
    }
    return items.map((n: ArrayEntry, i) => {
      entryValue(n).sortIndex = i;
      return n;
    });
  }; // with the current algo, decreasing order is important
  const tree = groupByMap(root, getRootArrayNode());
  const buildPaths = ([key, mapNode]: ArrayEntry, currentPath: LegendPath) => {
    const newPath = [...currentPath, { index: mapNode[SORT_INDEX_KEY], value: key }];
    mapNode[PATH_KEY] = newPath; // in-place mutation, so disabled `no-param-reassign`
    mapNode.children.forEach((entry) => buildPaths(entry, newPath));
  };
  buildPaths(tree[0], []);
  return tree;
}

/** @internal */
export function mapEntryValue(entry: ArrayEntry) {
  return entryValue(entry)[AGGREGATE_KEY];
}

// type MeanReduction = { sum: number; count: number };
// type MedianReduction = Array<number>;

/** @internal */
export const aggregators = {
  one: {
    identity: () => 0,
    reducer: () => 1,
  },
  count: {
    identity: () => 0,
    reducer: (r: number) => r + 1,
  },
  sum: {
    identity: () => 0,
    reducer: (r: number, n: number) => r + n,
  },
  min: {
    identity: () => Infinity,
    reducer: (r: number, n: number) => Math.min(r, n),
  },
  max: {
    identity: () => -Infinity,
    reducer: (r: number, n: number) => Math.max(r, n),
  },
  min0: {
    identity: () => 0,
    reducer: (r: number, n: number) => Math.min(r, n),
  },
  max0: {
    identity: () => 0,
    reducer: (r: number, n: number) => Math.max(r, n),
  },
  // todo more TS typing is needed to use these
  // mean: {
  //   identity: (): MeanReduction => ({ sum: 0, count: 0 }),
  //   reducer: (r: MeanReduction, n: number) => {
  //     r.sum += n;
  //     r.count++;
  //     return r;
  //   },
  //   finalizer: (r: MeanReduction): number => r.sum / r.count,
  // },
  // median: {
  //   identity: (): MedianReduction => [],
  //   reducer: (r: MedianReduction, n: number) => {
  //     r.push(n);
  //     return r;
  //   },
  //   finalizer: (r: MedianReduction): number => {
  //     const sorted = r.sort(ascending);
  //     const len = r.length;
  //     const even = len === len % 2;
  //     const half = len / 2;
  //     return even ? (sorted[half - 1] + sorted[half]) / 2 : sorted[half - 0.5];
  //   },
  // },
};
