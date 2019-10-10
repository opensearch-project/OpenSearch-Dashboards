export interface Scale {
  domain: any[];
  range: number[];
  ticks: () => any[];
  scale: (value: string | number) => number;
  pureScale: (value: any) => number;
  invert: (value: number) => any;
  invertWithStep: (
    value: number,
    data: any[],
  ) => {
    value: any;
    withinBandwidth: boolean;
  };
  isSingleValue: () => boolean;
  /** Check if the passed value is within the scale domain */
  isValueInDomain: (value: any) => boolean;
  bandwidth: number;
  minInterval: number;
  type: ScaleType;
  /**
   * @todo
   * designates unit of scale to compare to other Chart axis
   */
  unit?: string;
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
