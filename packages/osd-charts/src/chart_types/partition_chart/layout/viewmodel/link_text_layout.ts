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

import { Distance, PointTuple, PointTuples } from '../types/geometry_types';
import { Config } from '../types/config_types';
import { TAU, trueBearingToStandardPositionAngle } from '../utils/math';
import { LinkLabelVM, RawTextGetter, ShapeTreeNode, ValueGetterFunction } from '../types/viewmodel_types';
import { meanAngle } from '../geometry';
import { Box, Font, TextAlign, TextMeasure } from '../types/types';
import { ValueFormatter } from '../../../../utils/commons';
import { Point } from '../../../../utils/point';

function cutToLength(s: string, maxLength: number) {
  return s.length <= maxLength ? s : `${s.substr(0, maxLength - 1)}…`; // ellipsis is one char
}

/** @internal */
export function linkTextLayout(
  rectWidth: Distance,
  rectHeight: Distance,
  measure: TextMeasure,
  config: Config,
  nodesWithoutRoom: ShapeTreeNode[],
  currentY: Distance[],
  anchorRadius: Distance,
  rawTextGetter: RawTextGetter,
  valueGetter: ValueGetterFunction,
  valueFormatter: ValueFormatter,
  maxTextLength: number,
  diskCenter: Point,
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
      const rightSide = TAU / 4 < midAngle && midAngle < (3 * TAU) / 4 ? 0 : 1;
      const west = rightSide ? 1 : -1;
      const cos = Math.cos(midAngle);
      const sin = Math.sin(midAngle);
      const x0 = cos * anchorRadius;
      const y0 = sin * anchorRadius;
      const x = cos * (anchorRadius + linkLabel.radiusPadding);
      const y = sin * (anchorRadius + linkLabel.radiusPadding);
      const poolIndex = rightSide + (1 - north);
      const relativeY = north * y;
      currentY[poolIndex] = Math.max(currentY[poolIndex] + rowPitch, relativeY + yRelativeIncrement, rowPitch / 2);
      const cy = north * currentY[poolIndex];
      const stemFromX = x;
      const stemFromY = y;
      const stemToX = x + north * west * cy - west * relativeY;
      const stemToY = cy;
      const rawText = rawTextGetter(node);
      const labelText = cutToLength(rawText, maxTextLength);
      const valueText = valueFormatter(valueGetter(node));
      const labelFontSpec: Font = {
        fontStyle: 'normal',
        fontVariant: 'normal',
        fontFamily: config.fontFamily,
        fontWeight: 'normal',
        ...linkLabel,
      };
      const valueFontSpec: Font = {
        fontStyle: 'normal',
        fontVariant: 'normal',
        fontFamily: config.fontFamily,
        fontWeight: 'normal',
        ...linkLabel,
        ...linkLabel.valueFont,
      };
      const translateX = stemToX + west * (linkLabel.horizontalStemLength + linkLabel.gap);
      const { width: valueWidth } = measure(linkLabel.fontSize, [{ ...valueFontSpec, text: valueText }])[0];
      const widthAdjustment = valueWidth + 3 * linkLabel.fontSize; // gap between label and value, plus possibly 2em wide ellipsis
      const allottedLabelWidth = rightSide
        ? rectWidth - diskCenter.x - translateX - widthAdjustment
        : diskCenter.x + translateX - widthAdjustment;
      const { text, width, verticalOffset } =
        linkLabel.fontSize / 2 <= cy + diskCenter.y && cy + diskCenter.y <= rectHeight - linkLabel.fontSize / 2
          ? fitText(measure, labelText, allottedLabelWidth, linkLabel.fontSize, {
              ...labelFontSpec,
              text: labelText,
            })
          : { text: '', width: 0, verticalOffset: 0 };
      const link: PointTuples = [
        [x0, y0],
        [stemFromX, stemFromY],
        [stemToX, stemToY],
        [stemToX + west * linkLabel.horizontalStemLength, stemToY],
      ];
      const translate: PointTuple = [translateX, stemToY];
      const textAlign: TextAlign = rightSide ? 'left' : 'right';
      return {
        link,
        translate,
        textAlign,
        text,
        valueText,
        width,
        valueWidth,
        verticalOffset,
        labelFontSpec,
        valueFontSpec,
      };
    })
    .filter((l: LinkLabelVM) => l.text !== ''); // cull linked labels whose text was truncated to nothing
}

function monotonicMaximizer(
  test: (n: number) => number,
  maxVar: number,
  maxWidth: number,
  minVar: number = 0,
  minVarWidth: number = 0,
) {
  // Lowers iteration count by weakly assuming that there's a `pixelWidth(text) ~ charLength(text), ie. instead of pivoting
  // at the 50% midpoint like a basic binary search would do, it takes proportions into account. Still works if assumption is false.
  // It's usable for all problems where there's a monotonic relationship between the constrained output and the variable
  // (eg. can maximize font size etc.)
  let loVar = minVar;
  let loWidth = minVarWidth;

  let hiVar = maxVar;
  let hiWidth = test(hiVar);

  if (hiWidth <= maxWidth) return maxVar; // early bail if maxVar is compliant

  let pivotVar: number = NaN;
  while (loVar < hiVar && pivotVar !== loVar && pivotVar !== hiVar) {
    const newPivotVar = loVar + ((hiVar - loVar) * (maxWidth - loWidth)) / (hiWidth - loWidth);
    if (pivotVar === newPivotVar) {
      return loVar; // early bail if we're not making progress
    }
    pivotVar = newPivotVar;
    const pivotWidth = test(pivotVar);
    const pivotIsCompliant = pivotWidth <= maxWidth;
    if (pivotIsCompliant) {
      loVar = pivotVar;
      loWidth = pivotWidth;
    } else {
      hiVar = pivotVar;
      hiWidth = pivotWidth;
    }
  }
  return pivotVar;
}

function discreteLength(n: number) {
  return Math.round(n);
}

function fitText(measure: TextMeasure, desiredText: string, allottedWidth: number, fontSize: number, box: Box) {
  const desiredLength = desiredText.length;
  const visibleLength = discreteLength(
    monotonicMaximizer(
      (v: number) => measure(fontSize, [{ ...box, text: box.text.substr(0, discreteLength(v)) }])[0].width,
      desiredLength,
      allottedWidth,
    ),
  );
  const text = visibleLength < 2 && desiredLength >= 2 ? '' : cutToLength(box.text, visibleLength);
  const { width, emHeightAscent, emHeightDescent } = measure(fontSize, [{ ...box, text }])[0];
  return {
    width,
    verticalOffset: -(emHeightDescent + emHeightAscent) / 2, // meaning, `middle`
    text,
  };
}
