import { scaleLinear, scaleLog, scaleSqrt, scaleTime } from 'd3-scale';
import { DateTime } from 'luxon';
import { ScaleContinuousType, ScaleType } from './scales';
import { Scale } from './scales';

const SCALES = {
  [ScaleType.Linear]: scaleLinear,
  [ScaleType.Log]: scaleLog,
  [ScaleType.Sqrt]: scaleSqrt,
  [ScaleType.Time]: scaleTime,
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
  readonly minInterval: number;
  readonly step: number;
  readonly type: ScaleType;
  readonly domain: any[];
  readonly range: number[];
  readonly isInverted: boolean;
  readonly tickValues: number[];
  private readonly d3Scale: any;

  constructor(
    domain: any[],
    range: [number, number],
    type: ScaleContinuousType,
    clamp: boolean = false,
    bandwidth: number = 0,
    /** the min interval computed on the XDomain, not available for yDomains */
    minInterval: number = 0,
  ) {
    this.d3Scale = SCALES[type]();
    if (type === ScaleType.Log) {
      this.domain = limitLogScaleDomain(domain);
      this.d3Scale.domain(this.domain);
    } else {
      this.domain = domain;
      this.d3Scale.domain(domain);
    }
    this.d3Scale.range(range);
    this.d3Scale.clamp(clamp);
    // this.d3Scale.nice();
    this.bandwidth = bandwidth;
    this.step = 0;
    this.type = type;
    this.range = range;
    this.minInterval = minInterval;
    this.isInverted = this.domain[0] > this.domain[1];
    if (type === ScaleType.Time) {
      this.tickValues = this.d3Scale.ticks().map((d: Date) => {
        return DateTime.fromJSDate(d).toMillis();
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
    return this.d3Scale(value);
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
    return invertValue(invertedValue, this.minInterval, forcedStep);
  }
}

export function isContinuousScale(scale: Scale): scale is ScaleContinuous {
  return scale.type !== ScaleType.Ordinal;
}

function invertValue(invertedValue: number, minInterval: number, stepType?: StepType) {
  if (minInterval > 0) {
    switch (stepType) {
      case StepType.StepAfter:
        return linearStepAfter(invertedValue, minInterval);
      case StepType.StepBefore:
        return linearStepBefore(invertedValue, minInterval);
      case StepType.Step:
      default:
        return linearStep(invertedValue, minInterval);
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
 * @param invertedValue the inverted value
 * @param minInterval the data minimum interval grether than 0
 */
export function linearStep(invertedValue: number, minInterval: number): number {
  const diff = invertedValue / minInterval;
  const base = diff - Math.floor(diff) > 0.5 ? 1 : 0;
  return Math.floor(diff) * minInterval + minInterval * base;
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
