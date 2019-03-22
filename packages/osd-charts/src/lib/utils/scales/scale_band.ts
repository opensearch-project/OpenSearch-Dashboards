import { scaleBand, scaleQuantize, ScaleQuantize } from 'd3-scale';
import { StepType } from './scale_continuous';
import { ScaleType } from './scales';
import { Scale } from './scales';

export class ScaleBand implements Scale {
  readonly bandwidth: number;
  readonly step: number;
  readonly type: ScaleType;
  readonly domain: any[];
  readonly range: number[];
  readonly isInverted: boolean;
  readonly invertedScale: ScaleQuantize<number>;
  readonly minInterval: number;
  private readonly d3Scale: any;

  constructor(
    domain: any[],
    range: [number, number],
    padding?: [number, number],
    round?: boolean,
    overrideBandwidth?: number,
  ) {
    this.type = ScaleType.Ordinal;
    this.d3Scale = scaleBand();
    this.d3Scale.domain(domain);
    this.d3Scale.range(range);
    if (padding) {
      this.d3Scale.paddingInner(padding[0]);
      this.d3Scale.paddingOuter(padding[1]);
    }
    if (round) {
      this.d3Scale.round(round);
    }
    this.bandwidth = this.d3Scale.bandwidth() || 0;
    this.step = this.d3Scale.step();
    this.domain = this.d3Scale.domain();
    this.range = range.slice();
    if (overrideBandwidth) {
      this.bandwidth = overrideBandwidth;
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

  ticks() {
    return this.domain;
  }
  invert(value: any) {
    return this.invertedScale(value);
  }
  invertWithStep(value: any, stepType?: StepType) {
    return this.invertedScale(value);
  }
}

export function isOrdinalScale(scale: Scale): scale is ScaleBand {
  return scale.type === ScaleType.Ordinal;
}
