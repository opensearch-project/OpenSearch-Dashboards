import { GroupId } from '../utils/ids';
import {
  createContinuousScale,
  createOrdinalScale,
  Scale,
  ScaleType,
} from '../utils/scales/scales';
import { XDomain } from './domains/x_domain';
import { YDomain } from './domains/y_domain';
import { FormattedDataSeries } from './series';

/**
 * Count the max number of bars in cluster value.
 * Doesn't take in consideration areas, lines or points.
 * @param stacked all the stacked formatted dataseries
 * @param nonStacked all the non-stacked formatted dataseries
 */
export function countBarsInCluster(
  stacked: FormattedDataSeries[],
  nonStacked: FormattedDataSeries[],
): {
  nonStackedBarsInCluster: number;
  stackedBarsInCluster: number;
  totalBarsInCluster: number;
} {
  // along x axis, we count one "space" per bar series.
  // we ignore the points, areas, lines as they are
  // aligned with the x value and doesn't occupy space
  const nonStackedBarsInCluster = nonStacked.reduce((acc, ns) => {
    return acc + ns.counts.barSeries;
  }, 0);
  // count stacked bars groups as 1 per group
  const stackedBarsInCluster = stacked.reduce((acc, ns) => {
    return acc + (ns.counts.barSeries > 0 ? 1 : 0);
  }, 0);
  const totalBarsInCluster = nonStackedBarsInCluster + stackedBarsInCluster;
  return {
    nonStackedBarsInCluster,
    stackedBarsInCluster,
    totalBarsInCluster,
  };
}

/**
 * Compute the x scale used to align geometries to the x axis.
 * @param xDomain the x domain
 * @param totalBarsInCluster the total number of grouped series
 * @param axisLength the length of the x axis
 */
export function computeXScale(
  xDomain: XDomain,
  totalBarsInCluster: number,
  minRange: number,
  maxRange: number,
): Scale {
  const { scaleType, minInterval, domain, isBandScale, timeZone } = xDomain;
  const rangeDiff = Math.abs(maxRange - minRange);
  const isInverse = maxRange < minRange;
  if (scaleType === ScaleType.Ordinal) {
    const dividend = totalBarsInCluster > 0 ? totalBarsInCluster : 1;
    const bandwidth = rangeDiff / (domain.length * dividend);
    return createOrdinalScale(domain, minRange, maxRange, 0, bandwidth);
  } else {
    if (isBandScale) {
      const intervalCount = (domain[1] - domain[0]) / minInterval;
      const bandwidth = rangeDiff / (intervalCount + 1);
      const start = isInverse ? minRange - bandwidth : minRange;
      const end = isInverse ? maxRange : maxRange - bandwidth;
      return createContinuousScale(
        scaleType,
        domain,
        start,
        end,
        bandwidth / totalBarsInCluster,
        false,
        minInterval,
        timeZone,
      );
    } else {
      return createContinuousScale(
        scaleType,
        domain,
        minRange,
        maxRange,
        0,
        undefined,
        minInterval,
        timeZone,
      );
    }
  }
}

/**
 * Compute the y scales, one per groupId for the y axis.
 * @param yDomains the y domains
 * @param axisLength the axisLength of the y axis
 */
export function computeYScales(
  yDomains: YDomain[],
  minRange: number,
  maxRange: number,
): Map<GroupId, Scale> {
  const yScales: Map<GroupId, Scale> = new Map();

  yDomains.forEach((yDomain) => {
    const yScale = createContinuousScale(yDomain.scaleType, yDomain.domain, minRange, maxRange);
    yScales.set(yDomain.groupId, yScale);
  });

  return yScales;
}
