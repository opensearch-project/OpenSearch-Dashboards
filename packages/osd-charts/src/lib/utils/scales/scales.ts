export interface Scale {
  domain: any[];
  range: number[];
  ticks: () => any[];
  scale: (value: any) => number;
  invert: (value: number) => any;
  invertWithStep: (value: number, data: any[]) => any;
  bandwidth: number;
  minInterval: number;
  type: ScaleType;
  isInverted: boolean;
  barsPadding: number;
}
export type ScaleFunction = (value: any) => number;

/**
 * The scale type
 */
export const enum ScaleType {
  Linear = 'linear',
  Ordinal = 'ordinal',
  Log = 'log',
  Sqrt = 'sqrt',
  Time = 'time',
}

export interface ScaleConfig {
  accessor: (value: any) => any;
  domain: any[];
  type: ScaleType;
  clamp?: boolean;
}

export type ScaleContinuousType =
  | ScaleType.Linear
  | ScaleType.Sqrt
  | ScaleType.Log
  | ScaleType.Time;
export type ScaleOrdinalType = ScaleType.Ordinal;
export type ScaleTypes = ScaleContinuousType | ScaleOrdinalType;
