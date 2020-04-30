/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { Distance, Pixels, Radian, Radius, Ratio, SizeRatio, TimeMs } from './geometry_types';
import { Font, FontFamily, PartialFont } from './types';
import { $Values as Values } from 'utility-types';
import { Color, StrokeStyle, ValueFormatter } from '../../../../utils/commons';

export const PartitionLayout = Object.freeze({
  sunburst: 'sunburst' as 'sunburst',
  treemap: 'treemap' as 'treemap',
});

export type PartitionLayout = Values<typeof PartitionLayout>; // could use ValuesType<typeof HierarchicalChartTypes>

interface LabelConfig extends Font {
  textColor: Color;
  textInvertible: boolean;
  textOpacity: Ratio;
  valueFormatter: ValueFormatter;
  valueFont: PartialFont;
  padding: number;
}

export type FillLabelConfig = LabelConfig;

export interface LinkLabelConfig extends LabelConfig {
  fontSize: Pixels; // todo consider putting it in Font
  maximumSection: Distance; // use linked labels below this limit
  gap: Pixels;
  spacing: Pixels;
  minimumStemLength: Distance;
  stemAngle: Radian;
  horizontalStemLength: Distance;
  radiusPadding: Distance;
  lineWidth: Pixels;
  maxCount: number;
}

export interface FillFontSizeRange {
  minFontSize: Pixels;
  maxFontSize: Pixels;
  idealFontSizeJump: Ratio;
}

// todo switch to `io-ts` style, generic way of combining static and runtime type info
export interface StaticConfig extends FillFontSizeRange {
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
  fontFamily: FontFamily;

  // fill text layout config
  circlePadding: Distance;
  radialPadding: Distance;
  horizontalTextAngleThreshold: Radian;
  horizontalTextEnforcer: Ratio;
  maxRowCount: number;
  fillOutside: boolean;
  radiusOutside: Radius;
  fillRectangleWidth: Distance;
  fillRectangleHeight: Distance;
  fillLabel: FillLabelConfig;

  // linked labels (primarily: single-line)
  linkLabel: LinkLabelConfig;

  // global
  backgroundColor: Color;
  sectorLineWidth: Pixels;
  sectorLineStroke: StrokeStyle;
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
