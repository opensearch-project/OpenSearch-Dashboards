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
 * under the License.
 */

import { getOnPaperColorSet } from '../../../../common/color_calcs';
import { TAU } from '../../../../common/constants';
import {
  Distance,
  meanAngle,
  Pixels,
  PointTuple,
  PointTuples,
  trueBearingToStandardPositionAngle,
} from '../../../../common/geometry';
import { cutToLength, fitText, Font, measureOneBoxWidth, TextMeasure } from '../../../../common/text_utils';
import { Color, ValueFormatter } from '../../../../utils/common';
import { Point } from '../../../../utils/point';
import { Config, LinkLabelConfig } from '../types/config_types';
import { LinkLabelVM, RawTextGetter, ShapeTreeNode, ValueGetterFunction } from '../types/viewmodel_types';

/** @internal */
export interface LinkLabelsViewModelSpec {
  linkLabels: LinkLabelVM[];
  labelFontSpec: Font;
  valueFontSpec: Font;
  strokeColor?: Color;
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
  containerBackgroundColor?: Color,
): LinkLabelsViewModelSpec {
  const { linkLabel, sectorLineStroke } = config;
  const maxDepth = nodesWithoutRoom.reduce((p: number, n: ShapeTreeNode) => Math.max(p, n.depth), 0);
  const yRelativeIncrement = Math.sin(linkLabel.stemAngle) * linkLabel.minimumStemLength;
  const rowPitch = linkLabel.fontSize + linkLabel.spacing;

  const { contrastTextColor, strokeColor } = getOnPaperColorSet(
    linkLabel.textColor,
    sectorLineStroke,
    containerBackgroundColor,
  );
  const labelFontSpec: Font = { ...linkLabel, textColor: contrastTextColor };
  const valueFontSpec: Font = { ...linkLabel, ...linkLabel.valueFont, textColor: contrastTextColor };

  const linkLabels: LinkLabelVM[] = nodesWithoutRoom
    .filter((n: ShapeTreeNode) => n.depth === maxDepth) // only the outermost ring can have links
    .sort((n1: ShapeTreeNode, n2: ShapeTreeNode) => Math.abs(n2.x0 - n2.x1) - Math.abs(n1.x0 - n1.x1))
    .slice(0, linkLabel.maxCount) // largest linkLabel.MaxCount slices
    .sort(linkLabelCompare)
    .map(
      nodeToLinkLabel({
        linkLabel,
        anchorRadius,
        currentY,
        rowPitch,
        yRelativeIncrement,
        rawTextGetter,
        maxTextLength,
        valueFormatter,
        valueGetter,
        measure,
        rectWidth,
        rectHeight,
        diskCenter,
      }),
    )
    .filter(({ text }) => text !== ''); // cull linked labels whose text was truncated to nothing;

  return { linkLabels, valueFontSpec, labelFontSpec, strokeColor };
}

function linkLabelCompare(n1: ShapeTreeNode, n2: ShapeTreeNode) {
  const mid1 = meanAngle(n1.x0, n1.x1);
  const mid2 = meanAngle(n2.x0, n2.x1);
  const dist1 = Math.min(Math.abs(mid1 - TAU / 4), Math.abs(mid1 - (3 * TAU) / 4));
  const dist2 = Math.min(Math.abs(mid2 - TAU / 4), Math.abs(mid2 - (3 * TAU) / 4));
  return dist1 - dist2;
}

function nodeToLinkLabel({
  linkLabel,
  anchorRadius,
  currentY,
  rowPitch,
  yRelativeIncrement,
  rawTextGetter,
  maxTextLength,
  valueFormatter,
  valueGetter,
  measure,
  rectWidth,
  rectHeight,
  diskCenter,
}: {
  linkLabel: LinkLabelConfig;
  anchorRadius: Distance;
  currentY: Distance[];
  rowPitch: Pixels;
  yRelativeIncrement: Distance;
  rawTextGetter: RawTextGetter;
  maxTextLength: number;
  valueFormatter: ValueFormatter;
  valueGetter: ValueGetterFunction;
  measure: TextMeasure;
  rectWidth: Distance;
  rectHeight: Distance;
  diskCenter: Point;
}) {
  const labelFont: Font = linkLabel; // only interested in the font properties
  const valueFont: Font = { ...labelFont, ...linkLabel.valueFont }; // only interested in the font properties
  return function nodeToLinkLabelMap(node: ShapeTreeNode): LinkLabelVM {
    // geometry
    const midAngle = trueBearingToStandardPositionAngle((node.x0 + node.x1) / 2);
    const north = midAngle < TAU / 2 ? 1 : -1;
    const rightSide = TAU / 4 < midAngle && midAngle < (3 * TAU) / 4 ? 0 : 1;
    const west = rightSide ? 1 : -1;
    const cos = Math.cos(midAngle);
    const sin = Math.sin(midAngle);
    const x0 = cos * anchorRadius;
    const y0 = sin * anchorRadius;
    const x = cos * (anchorRadius + linkLabel.radiusPadding);
    const y = sin * (anchorRadius + linkLabel.radiusPadding);
    const stemFromX = x; // might be different in the future, eg. to allow a small gap: doc purpose
    const stemFromY = y; // might be different in the future, eg. to allow a small gap: doc purpose

    // calculate and remember vertical offset, as linked labels accrete
    const poolIndex = rightSide + (1 - north);
    const relativeY = north * y;
    const yOffset = Math.max(currentY[poolIndex] + rowPitch, relativeY + yRelativeIncrement, rowPitch / 2);
    currentY[poolIndex] = yOffset;

    // more geometry: the part that depends on vertical position
    const cy = north * yOffset;
    const stemToX = x + north * west * cy - west * relativeY;
    const stemToY = cy;
    const translateX = stemToX + west * (linkLabel.horizontalStemLength + linkLabel.gap);
    const translate: PointTuple = [translateX, stemToY];

    // the path points of the label link, ie. a polyline
    const linkLabels: PointTuples = [
      [x0, y0],
      [stemFromX, stemFromY],
      [stemToX, stemToY],
      [stemToX + west * linkLabel.horizontalStemLength, stemToY],
    ];

    // value text is simple: the full, formatted value is always shown, not truncated
    const valueText = valueFormatter(valueGetter(node));
    const valueWidth = measureOneBoxWidth(measure, linkLabel.fontSize, { ...valueFont, text: valueText });
    const widthAdjustment = valueWidth + 2 * linkLabel.fontSize; // gap between label and value, plus possibly 2em wide ellipsis

    // label text removes space allotted for value and gaps, then tries to fit as much as possible
    const labelText = cutToLength(rawTextGetter(node), maxTextLength);
    const allottedLabelWidth = Math.max(
      0,
      rightSide ? rectWidth - diskCenter.x - translateX - widthAdjustment : diskCenter.x + translateX - widthAdjustment,
    );
    const { text, width, verticalOffset } =
      linkLabel.fontSize / 2 <= cy + diskCenter.y && cy + diskCenter.y <= rectHeight - linkLabel.fontSize / 2
        ? fitText(measure, labelText, allottedLabelWidth, linkLabel.fontSize, labelFont)
        : { text: '', width: 0, verticalOffset: 0 };

    return {
      linkLabels,
      translate,
      text,
      valueText,
      width,
      valueWidth,
      verticalOffset,
      textAlign: rightSide ? 'left' : 'right',
    };
  };
}
