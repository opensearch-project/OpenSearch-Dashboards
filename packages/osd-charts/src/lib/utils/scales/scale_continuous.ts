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
    clamp?: boolean,
    bandwidth?: number,
    minInterval?: number,
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
    this.bandwidth = bandwidth || 0;
    this.step = 0;
    this.type = type;
    this.range = range;
    this.minInterval = minInterval || 0;
    this.isInverted = this.domain[0] > this.domain[1];
    if (type === ScaleType.Time) {
      this.tickValues = this.d3Scale.ticks().map((d: Date) => {
        return d.getTime();
      });
    } else {
      this.tickValues = this.d3Scale.ticks();
    }
  }

  scale(value: any) {
    return this.d3Scale(value);
  }

  ticks() {
    if (this.minInterval > 0) {
      const intervalCount = (this.domain[1] - this.domain[0]) / this.minInterval;
      return new Array(intervalCount + 1).fill(0).map((d, i) => {
        return this.domain[0] + i * this.minInterval;
      });
    }
    return this.tickValues;
  }
  invert(value: number) {
    if (this.type === ScaleType.Time) {
      const invertedDate = this.d3Scale.invert(value);
      return DateTime.fromJSDate(invertedDate).toISO();
    } else {
      return this.d3Scale.invert(value);
    }
  }
}
