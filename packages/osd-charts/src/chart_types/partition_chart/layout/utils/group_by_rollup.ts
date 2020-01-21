import { Relation } from '../types/types';

export const AGGREGATE_KEY = 'value'; // todo later switch back to 'aggregate'
export const DEPTH_KEY = 'depth';
export const CHILDREN_KEY = 'children';

interface NodeDescriptor {
  [AGGREGATE_KEY]: number;
  [DEPTH_KEY]: number;
}

export type ArrayEntry = [Key, ArrayNode];
export type HierarchyOfArrays = Array<ArrayEntry>;
interface ArrayNode extends NodeDescriptor {
  [CHILDREN_KEY]?: HierarchyOfArrays;
}

type HierarchyOfMaps = Map<Key, MapNode>;
interface MapNode extends NodeDescriptor {
  [CHILDREN_KEY]?: HierarchyOfMaps;
}

export type PrimitiveValue = string | number | null; // there could be more but sufficient for now
type Key = PrimitiveValue;
type Sorter = (a: number, b: number) => number;
type NodeSorter = (a: ArrayEntry, b: ArrayEntry) => number;

export type Tuple = Record<string, any>; // this is a row like {country: 'US', gdp: 20392090, ...} from ES; we don't know its properties, todo
export const entryKey = ([key]: ArrayEntry) => key;
export const entryValue = ([, value]: ArrayEntry) => value;
export function depthAccessor(n: ArrayEntry) {
  return entryValue(n)[DEPTH_KEY];
}
export function aggregateAccessor(n: ArrayEntry) {
  return entryValue(n)[AGGREGATE_KEY];
}
export function childrenAccessor(n: ArrayEntry) {
  return entryValue(n)[CHILDREN_KEY];
}
const ascending: Sorter = (a, b) => a - b;
const descending: Sorter = (a, b) => b - a;

export function groupByRollup(
  keyAccessors: Array<((a: Tuple) => Key) | ((a: Tuple, i: number) => Key)>,
  valueAccessor: Function,
  {
    reducer,
    identity,
  }: {
    reducer: (prev: number, next: number) => number;
    identity: Function;
  },
  factTable: Relation,
) {
  const reductionMap = factTable.reduce((p: HierarchyOfMaps, n, index) => {
    const keyCount = keyAccessors.length;
    let pointer: HierarchyOfMaps = p;
    keyAccessors.forEach((keyAccessor, i) => {
      const key = keyAccessor(n, index);
      const keyExists = pointer.has(key);
      const last = i === keyCount - 1;
      const node = keyExists && pointer.get(key);
      const childrenMap = node ? node[CHILDREN_KEY] : new Map();
      const aggregate = node ? node[AGGREGATE_KEY] : identity();
      const reductionValue = reducer(aggregate, valueAccessor(n));
      pointer.set(key, {
        [AGGREGATE_KEY]: reductionValue,
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
  return reductionMap;
}

export function mapsToArrays(root: HierarchyOfMaps, sorter: NodeSorter): HierarchyOfArrays {
  const groupByMap = (node: HierarchyOfMaps) =>
    Array.from(
      node,
      ([key, value]: [Key, MapNode]): ArrayEntry => {
        const valueElement = value[CHILDREN_KEY];
        const newValue: ArrayNode = Object.assign(
          {},
          value,
          valueElement && { [CHILDREN_KEY]: groupByMap(valueElement) },
        );
        return [key, newValue];
      },
    ).sort(sorter); // with the current algo, decreasing order is important
  return groupByMap(root);
}

export function mapEntryValue(entry: ArrayEntry) {
  return entryValue(entry)[AGGREGATE_KEY];
}

export function aggregateComparator(accessor: Function, sorter: Sorter): NodeSorter {
  return (a, b) => sorter(accessor(a), accessor(b));
}

export const childOrders = {
  ascending,
  descending,
};

/*
type MeanReduction = { sum: number; count: number };
type MedianReduction = Array<number>;
*/

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
  /* // todo more TS typing is needed to use these
  mean: {
    identity: (): MeanReduction => ({ sum: 0, count: 0 }),
    reducer: (r: MeanReduction, n: number) => {
      r.sum += n;
      r.count++;
      return r;
    },
    finalizer: (r: MeanReduction): number => r.sum / r.count,
  },
  median: {
    identity: (): MedianReduction => [],
    reducer: (r: MedianReduction, n: number) => {
      r.push(n);
      return r;
    },
    finalizer: (r: MedianReduction): number => {
      const sorted = r.sort(ascending);
      const len = r.length;
      const even = len === len % 2;
      const half = len / 2;
      return even ? (sorted[half - 1] + sorted[half]) / 2 : sorted[half - 0.5];
    },
  },
*/
};
