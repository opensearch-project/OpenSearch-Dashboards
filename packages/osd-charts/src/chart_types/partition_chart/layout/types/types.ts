import { ArrayEntry } from '../utils/group_by_rollup';

export type Color = string; // todo refine later (union type)

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; // the aliases are now excluded: 'normal' | 'bold' | 'lighter' | 'bolder';

export type TextMeasure = (font: string, texts: string[]) => TextMetrics[];

/**
 * Part-to-whole visualizations such as treemap, sunburst, pie hinge on an aggregation
 * function such that the value is independent of the order of how the constituents are aggregated
 * https://en.wikipedia.org/wiki/Associative_property
 * Hierarchical, space-filling part-to-whole visualizations also need that the
 * the value of a node is equal to the sum of the values of its children
 * https://mboehm7.github.io/teaching/ss19_dbs/04_RelationalAlgebra.pdf p21
 * It's now `count` and `sum` but subject to change
 */
export type AdditiveAggregation = 'count' | 'sum';

export type Relation = Array<object>;

export interface Origin {
  x0: number;
  y0: number;
}

export interface Rectangle extends Origin {
  x1: number;
  y1: number;
}

export interface Part extends Rectangle {
  node: ArrayEntry;
}
