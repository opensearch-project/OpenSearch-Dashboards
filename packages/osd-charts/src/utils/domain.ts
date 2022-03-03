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

import { extent } from 'd3-array';

import { ScaleType } from '../scales/constants';
import { DomainPaddingUnit, YDomainRange } from '../specs';
import { AccessorFn } from './accessor';

/** @public */
export type OrdinalDomain = (number | string)[];
/** @public */
export type ContinuousDomain = [min: number, max: number];
/** @public */
export type Range = [min: number, max: number];

/**
 * Returns padded domain given constrain
 * @internal */
export function constrainPadding(
  start: number,
  end: number,
  newStart: number,
  newEnd: number,
  constrain: boolean = true,
): [number, number] {
  if (constrain) {
    if (start < end) {
      return [start >= 0 && newStart < 0 ? 0 : newStart, end <= 0 && newEnd > 0 ? 0 : newEnd];
    }

    return [end >= 0 && newEnd < 0 ? 0 : newEnd, start <= 0 && newStart > 0 ? 0 : newStart];
  }

  return [newStart, newEnd];
}

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
  return sorted ? uniqueValues.sort((a, b) => `${a}`.localeCompare(`${b}`)) : uniqueValues;
}

function getPaddedDomain(start: number, end: number, domainOptions?: YDomainRange): [number, number] {
  if (!domainOptions || !domainOptions.padding || domainOptions.paddingUnit === DomainPaddingUnit.Pixel) {
    return [start, end];
  }

  const { padding, paddingUnit = DomainPaddingUnit.Domain } = domainOptions;
  const absPadding = Math.abs(padding);
  const computedPadding = paddingUnit === DomainPaddingUnit.Domain ? absPadding : absPadding * Math.abs(end - start);

  if (computedPadding === 0) {
    return [start, end];
  }

  const newStart = start - computedPadding;
  const newEnd = end + computedPadding;

  return constrainPadding(start, end, newStart, newEnd, domainOptions.constrainPadding);
}

/** @internal */
export function computeDomainExtent(
  domain: [number, number] | [undefined, undefined],
  domainOptions?: YDomainRange,
): [number, number] {
  if (domain[0] == null || domain[1] == null) return [0, 0];

  const inverted = domain[0] > domain[1];
  const paddedDomain = (([start, end]: Range): Range => {
    const [paddedStart, paddedEnd] = getPaddedDomain(start, end, domainOptions);

    if (paddedStart >= 0 && paddedEnd >= 0) {
      return domainOptions?.fit ? [paddedStart, paddedEnd] : [0, paddedEnd];
    }
    if (paddedStart < 0 && paddedEnd < 0) {
      return domainOptions?.fit ? [paddedStart, paddedEnd] : [paddedStart, 0];
    }

    return [paddedStart, paddedEnd];
  })(inverted ? (domain.slice().reverse() as Range) : domain);

  return inverted ? (paddedDomain.slice().reverse() as Range) : paddedDomain;
}

/**
 * Get Continuous domain from data. May alters domain to constrain to zero baseline.
 *
 * when `domainOptions` is null the domain will not be altered
 * @internal
 */
export function computeContinuousDataDomain(
  data: any[],
  accessor: (n: any) => number,
  scaleType: ScaleType,
  domainOptions?: YDomainRange | null,
): ContinuousDomain {
  const filteredData = domainOptions?.fit && scaleType === ScaleType.Log ? data.filter((d) => accessor(d) !== 0) : data;
  const range = extent<any, number>(filteredData, accessor);

  if (domainOptions === null) {
    return [range[0] ?? 0, range[1] ?? 0];
  }

  return computeDomainExtent(range, domainOptions);
}
