import { scaleLinear, scaleLog, scaleSqrt, scaleUtc } from 'd3-scale';
import { DateTime } from 'luxon';
import { clamp } from '../commons';
import { ScaleContinuousType, ScaleType } from './scales';
import { Scale } from './scales';

const SCALES = {
  [ScaleType.Linear]: scaleLinear,
  [ScaleType.Log]: scaleLog,
  [ScaleType.Sqrt]: scaleSqrt,
  [ScaleType.Time]: scaleUtc,
};

export function limitToMin(value: number, positive: boolean) {
  if (value === 0) {
    return positive ? 1 : -1;
  }
  return value;
}
/**
 * As log(0) = -Infinite, a log scale domain must be strictly-positive
 * or strictly-negative; the domain must not include or cross zero value.
 * We need to limit the domain scale to the right value on all possible cases.
 * @param domain the domain to limit
 */
export function limitLogScaleDomain(domain: any[]) {
  if (domain[0] === 0) {
    if (domain[1] > 0) {
      return [1, domain[1]];
    } else if (domain[1] < 0) {
      return [-1, domain[1]];
    } else {
      return [1, 1];
    }
  }
  if (domain[1] === 0) {
    if (domain[0] > 0) {
      return [domain[0], 1];
    } else if (domain[0] < 0) {
      return [domain[0], -1];
    } else {
      return [1, 1];
    }
  }
  if (domain[0] < 0 && domain[1] > 0) {
    const isD0Min = Math.abs(domain[1]) - Math.abs(domain[0]) >= 0;
    if (isD0Min) {
      return [1, domain[1]];
    } else {
      return [domain[0], -1];
    }
  }
  if (domain[0] > 0 && domain[1] < 0) {
    const isD0Max = Math.abs(domain[0]) - Math.abs(domain[1]) >= 0;
    if (isD0Max) {
      return [domain[0], 1];
    } else {
      return [-1, domain[1]];
    }
  }
  return domain;
}
export enum StepType {
  StepBefore = 'before',
  StepAfter = 'after',
  Step = 'half',
}

export class ScaleContinuous implements Scale {
  readonly bandwidth: number;
  readonly totalBarsInCluster: number;
  readonly bandwidthPadding: number;
  readonly minInterval: number;
  readonly step: number;
  readonly type: ScaleType;
  readonly domain: any[];
  readonly range: number[];
  readonly isInverted: boolean;
  readonly tickValues: number[];
  readonly timeZone: string;
  readonly barsPadding: number;
  private readonly d3Scale: any;

  constructor(
    type: ScaleContinuousType,
    domain: any[],
    range: [number, number],
    /**
     * The desidered bandwidth for a linear band scale.
     * @default 0
     */
    bandwidth: number = 0,
    /**
     * The min interval computed on the XDomain. Not available for yDomains.
     * @default 0
     */
    minInterval: number = 0,
    /**
     * A time zone identifier. Can be any IANA zone supported by he host environment,
     * or a fixed-offset name of the form 'utc+3', or the strings 'local' or 'utc'.
     * @default 'utc'
     */
    timeZone: string = 'utc',
    /**
     * The number of bars in the cluster. Used to correctly compute scales when
     * using padding between bars.
     * @default 1
     */
    totalBarsInCluster: number = 1,
    /**
     * The proportion of the range that is reserved for blank space between bands
     * A number between 0 and 1.
     * @default 0
     */
    barsPadding: number = 0,
  ) {
    this.d3Scale = SCALES[type]();
    if (type === ScaleType.Log) {
      this.domain = limitLogScaleDomain(domain);
      this.d3Scale.domain(this.domain);
    } else {
      this.domain = domain;
      this.d3Scale.domain(domain);
    }
    const safeBarPadding = clamp(barsPadding, 0, 1);
    this.barsPadding = safeBarPadding;
    this.bandwidth = bandwidth * (1 - safeBarPadding);
    this.bandwidthPadding = bandwidth * safeBarPadding;
    this.d3Scale.range(range);
    this.step = 0;
    this.type = type;
    this.range = range;
    this.minInterval = minInterval;
    this.isInverted = this.domain[0] > this.domain[1];
    this.timeZone = timeZone;
    this.totalBarsInCluster = totalBarsInCluster;
    if (type === ScaleType.Time) {
      const startDomain = DateTime.fromMillis(this.domain[0], { zone: this.timeZone });
      const endDomain = DateTime.fromMillis(this.domain[1], { zone: this.timeZone });
      const offset = startDomain.offset;
      const shiftedDomainMin = startDomain.plus({ minutes: offset }).toMillis();
      const shiftedDomainMax = endDomain.plus({ minutes: offset }).toMillis();
      const tzShiftedScale = scaleUtc().domain([shiftedDomainMin, shiftedDomainMax]);

      this.tickValues = tzShiftedScale.ticks().map((d: Date) => {
        return DateTime.fromMillis(d.getTime(), { zone: this.timeZone })
          .minus({ minutes: offset })
          .toMillis();
      });
    } else {
      if (this.minInterval > 0) {
        const intervalCount = (this.domain[1] - this.domain[0]) / this.minInterval;
        this.tickValues = new Array(intervalCount + 1).fill(0).map((d, i) => {
          return this.domain[0] + i * this.minInterval;
        });
      } else {
        this.tickValues = this.d3Scale.ticks();
      }
    }
  }

  scale(value: any) {
    return this.d3Scale(value) + (this.bandwidthPadding / 2) * this.totalBarsInCluster;
  }

  ticks() {
    return this.tickValues;
  }
  invert(value: number) {
    let invertedValue = this.d3Scale.invert(value);
    if (this.type === ScaleType.Time) {
      invertedValue = DateTime.fromJSDate(invertedValue).toMillis();
    }
    return invertedValue;
  }
  invertWithStep(value: number, stepType?: StepType) {
    const invertedValue = this.invert(value);
    const forcedStep = this.bandwidth > 0 ? StepType.StepAfter : stepType;
    return invertValue(this.domain[0], invertedValue, this.minInterval, forcedStep);
  }
}

export function isContinuousScale(scale: Scale): scale is ScaleContinuous {
  return scale.type !== ScaleType.Ordinal;
}

export function isLogarithmicScale(scale: Scale) {
  return scale.type === ScaleType.Log;
}

function invertValue(
  domainMin: number,
  invertedValue: number,
  minInterval: number,
  stepType?: StepType,
) {
  if (minInterval > 0) {
    switch (stepType) {
      case StepType.StepAfter:
        return linearStepAfter(invertedValue, minInterval);
      case StepType.StepBefore:
        return linearStepBefore(invertedValue, minInterval);
      case StepType.Step:
      default:
        return linearStep(domainMin, invertedValue, minInterval);
    }
  }
  return invertedValue;
}

/**
 * Return an inverted value that is valid from the exact point of the scale
 * till the end of the interval. |--------|********|
 * @param invertedValue the inverted value
 * @param minInterval the data minimum interval grether than 0
 */
export function linearStepAfter(invertedValue: number, minInterval: number): number {
  return Math.floor(invertedValue / minInterval) * minInterval;
}

/**
 * Return an inverted value that is valid from the half point before and half point
 * after the value. |----****|*****----|
 * till the end of the interval.
 * @param domainMin the domain's minimum value
 * @param invertedValue the inverted value
 * @param minInterval the data minimum interval grether than 0
 */
export function linearStep(domainMin: number, invertedValue: number, minInterval: number): number {
  const diff = (invertedValue - domainMin) / minInterval;
  const base = diff - Math.floor(diff) > 0.5 ? 1 : 0;
  return domainMin + Math.floor(diff) * minInterval + minInterval * base;
}

/**
 * Return an inverted value that is valid from the half point before and half point
 * after the value. |********|--------|
 * till the end of the interval.
 * @param invertedValue the inverted value
 * @param minInterval the data minimum interval grether than 0
 */
export function linearStepBefore(invertedValue: number, minInterval: number): number {
  return Math.ceil(invertedValue / minInterval) * minInterval;
}
