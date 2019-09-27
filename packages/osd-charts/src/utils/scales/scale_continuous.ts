import { bisectLeft } from 'd3-array';
import {
  scaleLinear,
  scaleLog,
  scaleSqrt,
  scaleUtc,
  ScaleLinear,
  ScaleLogarithmic,
  ScalePower,
  ScaleTime,
} from 'd3-scale';
import { DateTime } from 'luxon';

import { clamp, mergePartial } from '../commons';
import { ScaleContinuousType, ScaleType, Scale } from './scales';

/**
 * d3 scales excluding time scale
 */
type D3ScaleNonTime = ScaleLinear<any, any> | ScaleLogarithmic<any, any> | ScalePower<any, any>;

/**
 * All possible d3 scales
 */
type D3Scale = D3ScaleNonTime | ScaleTime<any, any>;

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
interface ScaleData {
  /** The Type of continuous scale */
  type: ScaleContinuousType;
  /** The data input domain */
  domain: any[];
  /** The data output range */
  range: [number, number];
}

interface ScaleOptions {
  /**
   * The desidered bandwidth for a linear band scale.
   * @default 0
   */
  bandwidth: number;
  /**
   * The min interval computed on the XDomain. Not available for yDomains.
   * @default 0
   */
  minInterval: number;
  /**
   * A time zone identifier. Can be any IANA zone supported by he host environment,
   * or a fixed-offset name of the form 'utc+3', or the strings 'local' or 'utc'.
   * @default 'utc'
   */
  timeZone: string;
  /**
   * The number of bars in the cluster. Used to correctly compute scales when
   * using padding between bars.
   * @default 1
   */
  totalBarsInCluster: number;
  /**
   * The proportion of the range that is reserved for blank space between bands
   * A number between 0 and 1.
   * @default 0
   */
  barsPadding: number;
  /**
   * The approximated number of ticks.
   * @default 10
   */
  ticks: number;
  /** true if the scale was adjusted to fit one single value histogram */
  isSingleValueHistogram: boolean;
  /** Show only integer values **/
  integersOnly?: boolean;
}
const defaultScaleOptions: ScaleOptions = {
  bandwidth: 0,
  minInterval: 0,
  timeZone: 'utc',
  totalBarsInCluster: 1,
  barsPadding: 0,
  ticks: 10,
  isSingleValueHistogram: false,
  integersOnly: false,
};
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
  readonly isSingleValueHistogram: boolean;
  private readonly d3Scale: D3Scale;

  constructor(scaleData: ScaleData, options?: Partial<ScaleOptions>) {
    const { type, domain, range } = scaleData;
    const {
      bandwidth,
      minInterval,
      timeZone,
      totalBarsInCluster,
      barsPadding,
      ticks,
      isSingleValueHistogram,
      integersOnly,
    } = mergePartial(defaultScaleOptions, options);

    this.d3Scale = SCALES[type]();
    const cleanDomain = type === ScaleType.Log ? limitLogScaleDomain(domain) : domain;
    this.domain = cleanDomain;
    this.d3Scale.domain(cleanDomain);

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
    this.isSingleValueHistogram = isSingleValueHistogram;
    if (type === ScaleType.Time) {
      const startDomain = DateTime.fromMillis(this.domain[0], { zone: this.timeZone });
      const endDomain = DateTime.fromMillis(this.domain[1], { zone: this.timeZone });
      const offset = startDomain.offset;
      const shiftedDomainMin = startDomain.plus({ minutes: offset }).toMillis();
      const shiftedDomainMax = endDomain.plus({ minutes: offset }).toMillis();
      const tzShiftedScale = scaleUtc().domain([shiftedDomainMin, shiftedDomainMax]);

      const rawTicks = tzShiftedScale.ticks(ticks);
      const timePerTick = (shiftedDomainMax - shiftedDomainMin) / rawTicks.length;
      const hasHourTicks = timePerTick < 1000 * 60 * 60 * 12;

      this.tickValues = rawTicks.map((d: Date) => {
        const currentDateTime = DateTime.fromJSDate(d, { zone: this.timeZone });
        const currentOffset = hasHourTicks ? offset : currentDateTime.offset;
        return currentDateTime.minus({ minutes: currentOffset }).toMillis();
      });
    } else {
      /**
       * This case is for the xScale (minInterval is > 0) when we want to show bars (bandwidth > 0)
       *
       * We want to avoid displaying inner ticks between bars in a bar chart when using linear x scale
       */
      if (minInterval > 0 && bandwidth > 0) {
        const intervalCount = Math.floor((this.domain[1] - this.domain[0]) / this.minInterval);
        this.tickValues = new Array(intervalCount + 1).fill(0).map((_, i) => {
          return this.domain[0] + i * this.minInterval;
        });
      } else {
        this.tickValues = this.getTicks(ticks, integersOnly!);
      }
    }
  }
  getTicks(ticks: number, integersOnly: boolean) {
    return integersOnly
      ? (this.d3Scale as D3ScaleNonTime)
          .ticks(ticks)
          .filter((item: number) => typeof item === 'number' && item % 1 === 0)
          .map((item: number) => parseInt(item.toFixed(0)))
      : (this.d3Scale as D3ScaleNonTime).ticks(ticks);
  }
  scale(value: any) {
    return this.d3Scale(value) + (this.bandwidthPadding / 2) * this.totalBarsInCluster;
  }
  pureScale(value: any) {
    if (this.bandwidth === 0) {
      return this.d3Scale(value);
    }
    return this.d3Scale(value + this.minInterval / 2);
  }
  ticks() {
    return this.tickValues;
  }
  invert(value: number): number {
    let invertedValue = this.d3Scale.invert(value);
    if (this.type === ScaleType.Time) {
      invertedValue = DateTime.fromJSDate(invertedValue as Date).toMillis();
    }

    return invertedValue as number;
  }
  invertWithStep(
    value: number,
    data: number[],
  ): {
    value: any;
    withinBandwidth: boolean;
  } {
    const invertedValue = this.invert(value);
    const bisectValue = this.bandwidth === 0 ? invertedValue + this.minInterval / 2 : invertedValue;
    const leftIndex = bisectLeft(data, bisectValue);

    if (leftIndex === 0) {
      if (invertedValue < data[0]) {
        return {
          value: data[0] - this.minInterval * Math.ceil((data[0] - invertedValue) / this.minInterval),
          withinBandwidth: false,
        };
      }
      return {
        value: data[0],
        withinBandwidth: true,
      };
    }
    const currentValue = data[leftIndex - 1];
    // pure linear scale
    if (this.minInterval === 0) {
      const nextValue = data[leftIndex];
      const nextDiff = Math.abs(nextValue - invertedValue);
      const prevDiff = Math.abs(invertedValue - currentValue);
      return {
        value: nextDiff <= prevDiff ? nextValue : currentValue,
        withinBandwidth: true,
      };
    }
    if (invertedValue - currentValue <= this.minInterval) {
      return {
        value: currentValue,
        withinBandwidth: true,
      };
    }
    return {
      value: currentValue + this.minInterval * Math.floor((invertedValue - currentValue) / this.minInterval),
      withinBandwidth: false,
    };
  }
  isSingleValue() {
    if (this.isSingleValueHistogram) {
      return true;
    }
    if (this.domain.length < 2) {
      return true;
    }

    const min = this.domain[0];
    const max = this.domain[this.domain.length - 1];
    return max === min;
  }
}

export function isContinuousScale(scale: Scale): scale is ScaleContinuous {
  return scale.type !== ScaleType.Ordinal;
}

export function isLogarithmicScale(scale: Scale) {
  return scale.type === ScaleType.Log;
}
