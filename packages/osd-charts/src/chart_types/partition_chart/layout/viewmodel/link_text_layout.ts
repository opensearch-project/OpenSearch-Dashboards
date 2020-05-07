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

import { Distance } from '../types/geometry_types';
import { Config } from '../types/config_types';
import { TAU, trueBearingToStandardPositionAngle } from '../utils/math';
import { LinkLabelVM, RawTextGetter, ShapeTreeNode, ValueGetterFunction } from '../types/viewmodel_types';
import { meanAngle } from '../geometry';
import { TextMeasure } from '../types/types';
import { ValueFormatter } from '../../../../utils/commons';

/** @internal */
export function linkTextLayout(
  measure: TextMeasure,
  config: Config,
  nodesWithoutRoom: ShapeTreeNode[],
  currentY: Distance[],
  anchorRadius: Distance,
  rawTextGetter: RawTextGetter,
  valueGetter: ValueGetterFunction,
  valueFormatter: ValueFormatter,
  maxTextLength: number,
): LinkLabelVM[] {
  const { linkLabel } = config;
  const maxDepth = nodesWithoutRoom.reduce((p: number, n: ShapeTreeNode) => Math.max(p, n.depth), 0);
  const yRelativeIncrement = Math.sin(linkLabel.stemAngle) * linkLabel.minimumStemLength;
  const rowPitch = linkLabel.fontSize + linkLabel.spacing;
  return nodesWithoutRoom
    .filter((n: ShapeTreeNode) => n.depth === maxDepth) // only the outermost ring can have links
    .sort((n1: ShapeTreeNode, n2: ShapeTreeNode) => Math.abs(n2.x0 - n2.x1) - Math.abs(n1.x0 - n1.x1))
    .slice(0, linkLabel.maxCount) // largest linkLabel.MaxCount slices
    .sort((n1: ShapeTreeNode, n2: ShapeTreeNode) => {
      const mid1 = meanAngle(n1.x0, n1.x1);
      const mid2 = meanAngle(n2.x0, n2.x1);
      const dist1 = Math.min(Math.abs(mid1 - TAU / 4), Math.abs(mid1 - (3 * TAU) / 4));
      const dist2 = Math.min(Math.abs(mid2 - TAU / 4), Math.abs(mid2 - (3 * TAU) / 4));
      return dist1 - dist2;
    })
    .map((node: ShapeTreeNode) => {
      const midAngle = trueBearingToStandardPositionAngle(meanAngle(node.x0, node.x1));
      const north = midAngle < TAU / 2 ? 1 : -1;
      const side = TAU / 4 < midAngle && midAngle < (3 * TAU) / 4 ? 0 : 1;
      const west = side ? 1 : -1;
      const cos = Math.cos(midAngle);
      const sin = Math.sin(midAngle);
      const x0 = cos * anchorRadius;
      const y0 = sin * anchorRadius;
      const x = cos * (anchorRadius + linkLabel.radiusPadding);
      const y = sin * (anchorRadius + linkLabel.radiusPadding);
      const poolIndex = side + (1 - north);
      const relativeY = north * y;
      currentY[poolIndex] = Math.max(currentY[poolIndex] + rowPitch, relativeY + yRelativeIncrement, rowPitch / 2);
      const cy = north * currentY[poolIndex];
      const stemFromX = x;
      const stemFromY = y;
      const stemToX = x + north * west * cy - west * relativeY;
      const stemToY = cy;
      const rawText = rawTextGetter(node);
      const text = rawText.length <= maxTextLength ? rawText : `${rawText.substr(0, maxTextLength - 1)}…`; // ellipsis is one char
      const valueText = valueFormatter(valueGetter(node));
      const labelFontSpec = {
        fontStyle: 'normal',
        fontVariant: 'normal',
        fontFamily: config.fontFamily,
        fontWeight: 'normal',
        ...linkLabel,
        text,
      };
      const valueFontSpec = {
        fontStyle: 'normal',
        fontVariant: 'normal',
        fontFamily: config.fontFamily,
        fontWeight: 'normal',
        ...linkLabel,
        ...linkLabel.valueFont,
        text: valueText,
      };
      const { width, emHeightAscent, emHeightDescent } = measure(linkLabel.fontSize, [labelFontSpec])[0];
      const { width: valueWidth } = measure(linkLabel.fontSize, [valueFontSpec])[0];
      return {
        link: [
          [x0, y0],
          [stemFromX, stemFromY],
          [stemToX, stemToY],
          [stemToX + west * linkLabel.horizontalStemLength, stemToY],
        ],
        translate: [stemToX + west * (linkLabel.horizontalStemLength + linkLabel.gap), stemToY],
        textAlign: side ? 'left' : 'right',
        text,
        valueText,
        width,
        valueWidth,
        verticalOffset: -(emHeightDescent + emHeightAscent) / 2, // meaning, `middle`
        labelFontSpec,
        valueFontSpec,
      };
    });
}
