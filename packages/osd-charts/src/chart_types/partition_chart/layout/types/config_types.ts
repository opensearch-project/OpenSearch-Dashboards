import { Distance, Pixels, Radian, Radius, Ratio, SizeRatio, TimeMs } from './geometry_types';
import { Color, FontWeight } from './types';
import { $Values as Values } from 'utility-types';

export const PartitionLayout = Object.freeze({
  sunburst: 'sunburst',
  treemap: 'treemap',
});

export type PartitionLayout = Values<typeof PartitionLayout>; // could use ValuesType<typeof HierarchicalChartTypes>

export interface FillLabel {
  textColor: Color;
  textInvertible: boolean;
  textWeight: FontWeight;
  fontStyle: string;
  fontVariant: string;
  fontFamily: string;
  formatter: (x: number) => string;
}

// todo switch to `io-ts` style, generic way of combining static and runtime type info
export interface StaticConfig {
  // shape geometry
  width: number;
  height: number;
  margin: { left: SizeRatio; right: SizeRatio; top: SizeRatio; bottom: SizeRatio };
  emptySizeRatio: SizeRatio;
  outerSizeRatio: SizeRatio;
  clockwiseSectors: boolean;
  specialFirstInnermostSector: boolean;
  partitionLayout: PartitionLayout;

  // general text config
  fontFamily: string;

  // fill text config
  minFontSize: Pixels;
  maxFontSize: Pixels;
  idealFontSizeJump: number;

  // fill text layout config
  circlePadding: Distance;
  radialPadding: Distance;
  horizontalTextAngleThreshold: Radian;
  horizontalTextEnforcer: Ratio;
  maxRowCount: number;
  fillOutside: boolean;
  radiusOutside: Radius;
  fillRectangleWidth: number;
  fillRectangleHeight: number;
  fillLabel: FillLabel;

  // linked labels (primarily: single-line)
  linkLabel: {
    maximumSection: number; // use linked labels below this limit
    fontSize: Pixels;
    gap: Pixels;
    spacing: Pixels;
    minimumStemLength: Distance;
    stemAngle: Radian;
    horizontalStemLength: Distance;
    radiusPadding: Distance;
    lineWidth: Pixels;
    maxCount: number;
    textColor: Color;
    textInvertible: boolean;
    textOpacity: number;
  };

  // other
  backgroundColor: Color;
  sectorLineWidth: Pixels;
}

export type EasingFunction = (x: Ratio) => Ratio;

export interface AnimKeyframe {
  time: number;
  easingFunction: EasingFunction;
  keyframeConfig: Partial<StaticConfig>;
}

export interface Config extends StaticConfig {
  animation: {
    duration: TimeMs;
    keyframes: Array<AnimKeyframe>;
  };
}

// switching to `io-ts` style, generic way of combining static and runtime type info - 1st step
class Type<A> {
  dflt: A;
  reconfigurable: boolean | string;
  documentation = 'string';

  constructor(dflt: A, reconfigurable: boolean | string, documentation: string) {
    this.dflt = dflt;
    this.reconfigurable = reconfigurable;
    this.documentation = documentation;
  }
}

export class Numeric extends Type<number> {
  min: number;
  max: number;
  type = 'number';

  constructor({
    dflt,
    min,
    max,
    reconfigurable,
    documentation,
  }: {
    dflt: number;
    min: number;
    max: number;
    reconfigurable: boolean | string;
    documentation: string;
  }) {
    super(dflt, reconfigurable, documentation);
    this.min = min;
    this.max = max;
  }
}
