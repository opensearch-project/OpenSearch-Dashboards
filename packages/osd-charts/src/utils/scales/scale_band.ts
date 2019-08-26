import { scaleBand, scaleQuantize, ScaleQuantize } from 'd3-scale';
import { clamp } from '../commons';
import { ScaleType, Scale } from './scales';

export class ScaleBand implements Scale {
  readonly bandwidth: number;
  readonly step: number;
  readonly type: ScaleType;
  readonly domain: any[];
  readonly range: number[];
  readonly isInverted: boolean;
  readonly invertedScale: ScaleQuantize<number>;
  readonly minInterval: number;
  readonly barsPadding: number;
  private readonly d3Scale: any;

  constructor(
    domain: any[],
    range: [number, number],
    overrideBandwidth?: number,
    /**
     * The proportion of the range that is reserved for blank space between bands
     * A number between 0 and 1.
     * @default 0
     */
    barsPadding: number = 0,
  ) {
    this.type = ScaleType.Ordinal;
    this.d3Scale = scaleBand();
    this.d3Scale.domain(domain);
    this.d3Scale.range(range);
    const safeBarPadding = clamp(barsPadding, 0, 1);
    this.barsPadding = safeBarPadding;
    this.d3Scale.paddingInner(safeBarPadding);
    this.d3Scale.paddingOuter(safeBarPadding / 2);
    this.bandwidth = this.d3Scale.bandwidth() || 0;

    this.step = this.d3Scale.step();
    this.domain = this.d3Scale.domain();
    this.range = range.slice();
    if (overrideBandwidth) {
      this.bandwidth = overrideBandwidth * (1 - safeBarPadding);
    }
    // TO FIX: we are assiming that it's ordered
    this.isInverted = this.domain[0] > this.domain[1];
    this.invertedScale = scaleQuantize()
      .domain(range)
      .range(this.domain);
    this.minInterval = 0;
  }

  scale(value: any) {
    return this.d3Scale(value);
  }
  pureScale(value: any) {
    return this.d3Scale(value);
  }

  ticks() {
    return this.domain;
  }
  invert(value: any) {
    return this.invertedScale(value);
  }
  invertWithStep(value: any) {
    return {
      value: this.invertedScale(value),
      withinBandwidth: true,
    };
  }
  isSingleValue() {
    return this.domain.length < 2;
  }
}

export function isOrdinalScale(scale: Scale): scale is ScaleBand {
  return scale.type === ScaleType.Ordinal;
}
