/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Main transformation functions
export { aggregate, aggregateByGroups } from './aggregate';
export { pivot } from './pivot';
export { flatten } from './flatten';
export { convertTo2DArray } from './convert';
export { sortByTime } from './sort';
export { transform, facetTransform } from './transform';
export type { TransformFn } from './transform';

// Utility functions (re-exported for convenience)
export { aggregateValues } from './utils/aggregation';
export { roundToTimeUnit } from './utils/time';
export { normalizeEmptyValue } from './utils/normalization';

export { map, pick } from './common';
