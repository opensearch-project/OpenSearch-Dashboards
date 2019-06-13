import { extent, sum } from 'd3-array';
import { nest } from 'd3-collection';
import { Accessor, AccessorFn } from './accessor';
import { ScaleType } from './scales/scales';

export type Domain = any[];

export interface SpecDomain {
  accessor: Accessor;
  level: number;
  domain: Domain;
  scaleType: ScaleType;
  isStacked?: boolean;
}

export interface ColorDomain {
  accessors: Accessor[];
  yAccessors?: Accessor[];
  domain: string[];
  scaleType: ScaleType;
}

export interface SeriesScales {
  groupLevel: number;
  xDomain: Domain;
  yDomain?: Domain;
  xScaleType: ScaleType;
  yScaleType?: ScaleType;
  xAccessor: Accessor;
  yAccessor?: Accessor;
}

export function computeOrdinalDataDomain(
  data: any[],
  accessor: AccessorFn,
  sorted?: boolean,
  removeNull?: boolean,
): string[] | number[] {
  const domain = data.map(accessor).filter((d) => (removeNull ? d !== null : true));
  const uniqueValues = [...new Set(domain)];
  return sorted
    ? uniqueValues.sort((a, b) => {
        return `${a}`.localeCompare(`${b}`);
      })
    : uniqueValues;
}

export function computeDomainExtent(
  computedDomain: [number, number] | [undefined, undefined],
  scaleToExtent: boolean,
): [number, number] {
  const [start, end] = computedDomain;

  if (start != null && end != null) {
    if (start >= 0 && end >= 0) {
      return scaleToExtent ? [start, end] : [0, end];
    } else if (start < 0 && end < 0) {
      return scaleToExtent ? [start, end] : [start, 0];
    }
    return [start, end];
  }

  // if any of the values are null
  return [0, 0];
}

export function computeContinuousDataDomain(data: any[], accessor: AccessorFn, scaleToExtent = false): number[] {
  const range = extent(data, accessor);
  return computeDomainExtent(range, scaleToExtent);
}

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
