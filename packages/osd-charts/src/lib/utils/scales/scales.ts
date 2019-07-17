export interface Scale {
  domain: any[];
  range: number[];
  ticks: () => any[];
  scale: (value: any) => number;
  invert: (value: number) => any;
  invertWithStep: (value: number, data: any[]) => any;
  isSingleValue: () => boolean;
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
export const ScaleType = Object.freeze({
  Linear: 'linear' as 'linear',
  Ordinal: 'ordinal' as 'ordinal',
  Log: 'log' as 'log',
  Sqrt: 'sqrt' as 'sqrt',
  Time: 'time' as 'time',
});

export type ScaleType =
  | typeof ScaleType.Linear
  | typeof ScaleType.Sqrt
  | typeof ScaleType.Log
  | typeof ScaleType.Time
  | typeof ScaleType.Ordinal;

export interface ScaleConfig {
  accessor: (value: any) => any;
  domain: any[];
  type: ScaleType;
  clamp?: boolean;
}

export type ScaleContinuousType =
  | typeof ScaleType.Linear
  | typeof ScaleType.Sqrt
  | typeof ScaleType.Log
  | typeof ScaleType.Time;
export type ScaleOrdinalType = typeof ScaleType.Ordinal;
export type ScaleTypes = ScaleContinuousType | ScaleOrdinalType;
