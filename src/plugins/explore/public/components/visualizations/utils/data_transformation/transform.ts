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
  const { data, options } = state;
  const transformedData: Array<Array<Record<string, any>>> = [data];

  let byProductOptions = { ...(options ?? {}) };

  for (const fn of fns) {
    const transformed = fn(transformedData[transformedData.length - 1]);
    if (isTransformByproduct(transformed)) {
      byProductOptions = { ...byProductOptions, ...transformed[0] };
      continue;
    } else {
      transformedData.push(transformed);
    }
  }

  const lastValue = transformedData[transformedData?.length - 1];

  return { ...state, transformedData: lastValue, options: byProductOptions };
};

/**
 * Apply transformations to faceted data
 * @param facetColumn - Column to facet by
 * @param fns - Transformation functions to apply to each facet
 * @returns Function that applies transformations to each facet group
 */
export const facetTransform = (facetColumn: string, ...fns: TransformFn[]) => (
  state: EChartsSpecState
) => {
  const { data } = state;

  const grouped = data.reduce((acc, row) => {
    const facet = String(row[facetColumn]);
    acc[facet] ??= [];
    acc[facet].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  const facetNumbers = Object.keys(grouped).length;

  if (facetNumbers <= 1) return transform(...fns)(state);

  let options;

  const res = Object.entries(grouped).map(([_, facetData]) => {
    const facetState = { ...state, data: facetData };
    const singleRes = transform(...fns)(facetState);
    options ??= singleRes.options; // TODO each facet dataset should have its own yAxisExtend
    return singleRes.transformedData;
  });

  return { ...state, transformedData: res, options };
};

const isTransformByproduct = (data: Array<Record<string, any>>): boolean => {
  if (!data || !Array.isArray(data) || data.length !== 1) {
    return false;
  }

  const options = data[0];
  const byproductKeys = ['yAxisExtend'];
  return byproductKeys.some((key) => options.hasOwnProperty(key));
};
