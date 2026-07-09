/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EChartsSpecState } from '../echarts_spec';

export type TransformFn = (data: Array<Record<string, any>>) => Array<Record<string, any>>;

/**
 * Apply a series of transformation functions to data
 * @param fns - Transformation functions to apply in sequence
 * @returns Function that applies all transformations to the state
 */
export const transform = (...fns: TransformFn[]) => (state: EChartsSpecState) => {
  const { data } = state;
  const transformedData: Array<Array<Record<string, any>>> = [data];

  for (const fn of fns) {
    const transformed = fn(transformedData[transformedData.length - 1]);
    transformedData.push(transformed);
  }

  const lastValue = transformedData[transformedData?.length - 1];
  return { ...state, transformedData: lastValue };
};
