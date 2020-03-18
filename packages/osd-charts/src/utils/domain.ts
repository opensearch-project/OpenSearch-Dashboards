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
 * under the License. */

import { extent, sum } from 'd3-array';
import { nest } from 'd3-collection';
import { AccessorFn } from './accessor';

export type Domain = any[];

/** @internal */
export function computeOrdinalDataDomain(
  data: any[],
  accessor: AccessorFn,
  sorted?: boolean,
  removeNull?: boolean,
): string[] | number[] {
  // TODO: Check for empty data before computing domain
  if (data.length === 0) {
    return [0];
  }

  const domain = data.map(accessor).filter((d) => (removeNull ? d !== null : true));
  const uniqueValues = [...new Set(domain)];
  return sorted
    ? uniqueValues.sort((a, b) => {
        return `${a}`.localeCompare(`${b}`);
      })
    : uniqueValues;
}

function computeFittedDomain(start?: number, end?: number) {
  if (start === undefined || end === undefined) {
    return [start, end];
  }

  const delta = Math.abs(end - start);
  const padding = (delta === 0 ? end - 0 : delta) / 12;
  const newStart = start - padding;
  const newEnd = end + padding;

  return [start >= 0 && newStart < 0 ? 0 : newStart, end <= 0 && newEnd > 0 ? 0 : newEnd];
}

/** @internal */
export function computeDomainExtent(
  computedDomain: [number, number] | [undefined, undefined],
  scaleToExtent: boolean,
  fitToExtent: boolean = false,
): [number, number] {
  const [start, end] = fitToExtent && !scaleToExtent ? computeFittedDomain(...computedDomain) : computedDomain;

  if (start != null && end != null) {
    if (start >= 0 && end >= 0) {
      return scaleToExtent || fitToExtent ? [start, end] : [0, end];
    } else if (start < 0 && end < 0) {
      return scaleToExtent || fitToExtent ? [start, end] : [start, 0];
    }
    return [start, end];
  }

  // if any of the values are null
  return [0, 0];
}

/** @internal */
export function computeContinuousDataDomain(
  data: any[],
  accessor: (n: any) => number,
  scaleToExtent = false,
  fitToExtent = false,
): number[] {
  const range = extent<any, number>(data, accessor);

  return computeDomainExtent(range, scaleToExtent, fitToExtent);
}

// TODO: remove or incorporate this function
/** @internal */
export function computeStackedContinuousDomain(
  data: any[],
  xAccessor: AccessorFn,
  yAccessor: AccessorFn,
  scaleToExtent = false,
): any {
  const groups = nest<any, number>()
    .key((datum: any) => `${xAccessor(datum)}`)
    .rollup((values: any) => {
      return sum(values, yAccessor);
    })
    .entries(data);
  const cumulativeSumAccessor = (d: any) => d.value;
  return computeContinuousDataDomain(groups, cumulativeSumAccessor, scaleToExtent);
}
