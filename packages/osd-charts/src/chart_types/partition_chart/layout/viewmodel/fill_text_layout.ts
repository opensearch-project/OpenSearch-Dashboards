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

import { TAU } from '../../../../common/constants';
import {
  Coordinate,
  Distance,
  Pixels,
  PointTuple,
  Radian,
  Ratio,
  RingSectorConstruction,
  trueBearingToStandardPositionAngle,
  wrapToTau,
} from '../../../../common/geometry';
import { logarithm } from '../../../../common/math';
import { Box, Font, PartialFont, TextMeasure, VerticalAlignments } from '../../../../common/text_utils';
import { integerSnap, monotonicHillClimb } from '../../../../solvers/monotonic_hill_climb';
import { ValueFormatter } from '../../../../utils/common';
import { Layer } from '../../specs';
import { Config, Padding } from '../types/config_types';
import {
  QuadViewModel,
  RawTextGetter,
  RowBox,
  RowSet,
  RowSpace,
  ShapeTreeNode,
  ValueGetterFunction,
} from '../types/viewmodel_types';
import { conjunctiveConstraint, INFINITY_RADIUS, makeRowCircline } from '../utils/circline_geometry';
import { RectangleConstruction } from './viewmodel';

/**
 * todo pick a better unique key for the slices (D3 doesn't keep track of an index)
 * @internal
 */
export function nodeId(node: ShapeTreeNode): string {
  return `${node.x0}|${node.y0}`;
}

/** @internal */
export const getSectorRowGeometry: GetShapeRowGeometry<RingSectorConstruction> = (
  ringSector,
  cx,
  cy,
  totalRowCount,
  linePitch,
  rowIndex,
  fontSize,
  rotation,
) => {
  const offset = (totalRowCount / 2) * fontSize + fontSize / 2 - linePitch * rowIndex;

  const topCircline = makeRowCircline(cx, cy, offset, rotation, fontSize, 1);
  const bottomCircline = makeRowCircline(cx, cy, offset, rotation, fontSize, -1);
  const midCircline = makeRowCircline(cx, cy, offset, rotation, 0, 0);

  const valid1 = conjunctiveConstraint(ringSector, { ...topCircline, from: 0, to: TAU })[0];
  if (!valid1) return { rowAnchorX: cx, rowAnchorY: cy, maximumRowLength: 0 };
  const valid2 = conjunctiveConstraint(ringSector, { ...bottomCircline, from: 0, to: TAU })[0];
  if (!valid2) return { rowAnchorX: cx, rowAnchorY: cy, maximumRowLength: 0 };
  const from = Math.max(valid1.from, valid2.from);
  const to = Math.min(valid1.to, valid2.to);
  const midAngle = (from + to) / 2;
  const cheapTangent = Math.max(0, to - from); /* Math.tan(Math.max(0, to - from)) */ // https://en.wikipedia.org/wiki/Small-angle_approximation
  const rowAnchorX = midCircline.r * Math.cos(midAngle) + midCircline.x;
  const rowAnchorY = midCircline.r * Math.sin(midAngle) + midCircline.y;
  const maximumRowLength = cheapTangent * INFINITY_RADIUS;
  return { rowAnchorX, rowAnchorY, maximumRowLength };
};

function getVerticalAlignment(
  container: RectangleConstruction,
  verticalAlignment: VerticalAlignments,
  linePitch: Pixels,
  totalRowCount: number,
  rowIndex: number,
  paddingTop: Pixels,
  paddingBottom: Pixels,
  fontSize: Pixels,
  overhang: Ratio,
) {
  switch (verticalAlignment) {
    case VerticalAlignments.top:
      return -(container.y0 + linePitch * rowIndex + paddingTop + fontSize * overhang);
    case VerticalAlignments.bottom:
      return -(container.y1 - linePitch * (totalRowCount - 1 - rowIndex) - paddingBottom - fontSize * overhang);
    default:
      return -((container.y0 + container.y1) / 2 + (linePitch * (rowIndex + 1 - totalRowCount)) / 2);
  }
}

/** @internal */
export const getRectangleRowGeometry: GetShapeRowGeometry<RectangleConstruction> = (
  container,
  cx,
  cy,
  totalRowCount,
  linePitch,
  rowIndex,
  fontSize,
  _rotation,
  verticalAlignment,
  padding,
) => {
  const defaultPad: Pixels = 2;
  const { top, right, bottom, left } =
    typeof padding === 'number'
      ? { top: padding, right: padding, bottom: padding, left: padding }
      : {
          ...{ top: defaultPad, right: defaultPad, bottom: defaultPad, left: defaultPad },
          ...padding,
        };

  const overhang = 0.05;
  const topPaddingAdjustment = fontSize < 6 ? 0 : Math.max(1, Math.min(2, fontSize / 16));
  const adjustedTop = top + topPaddingAdjustment; // taper out paddingTop with small fonts
  if ((container.y1 - container.y0 - adjustedTop - bottom) / totalRowCount < linePitch) {
    return {
      rowAnchorX: NaN,
      rowAnchorY: NaN,
      maximumRowLength: 0,
    };
  }

  const rowAnchorY = getVerticalAlignment(
    container,
    verticalAlignment,
    linePitch,
    totalRowCount,
    rowIndex,
    adjustedTop,
    bottom,
    fontSize,
    overhang,
  );
  return {
    rowAnchorX: cx + left / 2 - right / 2,
    rowAnchorY,
    maximumRowLength: container.x1 - container.x0 - left - right,
  };
};

function rowSetComplete(rowSet: RowSet, measuredBoxes: RowBox[]) {
  return (
    measuredBoxes.length === 0 &&
    !rowSet.rows.some(
      (r) => isNaN(r.length) || r.rowWords.length === 0 || r.rowWords.every((rw) => rw.text.length === 0),
    )
  );
}

function identityRowSet(): RowSet {
  return {
    id: '',
    rows: [],
    fontSize: NaN,
    fillTextColor: '',
    rotation: NaN,
    verticalAlignment: VerticalAlignments.middle,
    leftAlign: false,
  };
}

function getAllBoxes(
  rawTextGetter: RawTextGetter,
  valueGetter: ValueGetterFunction,
  valueFormatter: ValueFormatter,
  sizeInvariantFontShorthand: Font,
  valueFont: PartialFont,
  node: ShapeTreeNode,
): Box[] {
  return rawTextGetter(node)
    .split(' ')
    .filter(Boolean)
    .map((text) => ({ text, ...sizeInvariantFontShorthand }))
    .concat(
      valueFormatter(valueGetter(node))
        .split(' ')
        .filter(Boolean)
        .map((text) => ({ text, ...sizeInvariantFontShorthand, ...valueFont })),
    );
}

function getWordSpacing(fontSize: number) {
  return fontSize / 4;
}

type GetShapeRowGeometry<C> = (
  container: C,
  cx: Distance,
  cy: Distance,
  targetRowCount: number,
  linePitch: Pixels,
  currentRowIndex: number,
  fontSize: Pixels,
  rotation: Radian,
  verticalAlignment: VerticalAlignments,
  padding: Padding,
) => RowSpace;

type ShapeConstructor<C> = (n: ShapeTreeNode) => C;

type NodeWithOrigin = { node: QuadViewModel; origin: PointTuple };

function fill<C>(
  shapeConstructor: ShapeConstructor<C>,
  getShapeRowGeometry: GetShapeRowGeometry<C>,
  getRotation: GetRotation,
) {
  return function fillClosure(
    config: Config,
    layers: Layer[],
    measure: TextMeasure,
    rawTextGetter: RawTextGetter,
    valueGetter: ValueGetterFunction,
    formatter: ValueFormatter,
    leftAlign: boolean,
    middleAlign: boolean,
  ) {
    const { maxRowCount, fillLabel } = config;
    return (allFontSizes: Pixels[][], textFillOrigin: PointTuple, node: QuadViewModel): RowSet => {
      const container = shapeConstructor(node);
      const rotation = getRotation(node);

      const layer = layers[node.depth - 1] || {};
      const verticalAlignment = middleAlign
        ? VerticalAlignments.middle
        : node.depth < layers.length
        ? VerticalAlignments.bottom
        : VerticalAlignments.top;
      const fontSizes = allFontSizes[Math.min(node.depth, allFontSizes.length) - 1];
      const { fontStyle, fontVariant, fontFamily, fontWeight, valueFormatter, padding, textOpacity, clipText } = {
        ...fillLabel,
        valueFormatter: formatter,
        ...layer.fillLabel,
        ...layer.shape,
      };

      const valueFont = {
        ...fillLabel,
        ...fillLabel.valueFont,
        ...layer.fillLabel,
        ...layer.fillLabel?.valueFont,
      };

      const sizeInvariantFont: Font = {
        fontStyle,
        fontVariant,
        fontWeight,
        fontFamily,
        textColor: node.textColor,
        textOpacity,
      };
      const allBoxes = getAllBoxes(rawTextGetter, valueGetter, valueFormatter, sizeInvariantFont, valueFont, node);
      const [cx, cy] = textFillOrigin;

      return {
        ...getRowSet(
          allBoxes,
          maxRowCount,
          fontSizes,
          measure,
          rotation,
          verticalAlignment,
          leftAlign,
          container,
          getShapeRowGeometry,
          cx,
          cy,
          padding,
          node,
          clipText,
        ),
        fillTextColor: node.textColor,
      };
    };
  };
}

function tryFontSize<C>(
  measure: TextMeasure,
  rotation: Radian,
  verticalAlignment: VerticalAlignments,
  leftAlign: boolean,
  container: C,
  getShapeRowGeometry: GetShapeRowGeometry<C>,
  cx: Coordinate,
  cy: Coordinate,
  padding: Padding,
  node: ShapeTreeNode,
  boxes: Box[],
  maxRowCount: number,
  clipText?: boolean,
) {
  return function tryFontSizeFn(initialRowSet: RowSet, fontSize: Pixels): { rowSet: RowSet; completed: boolean } {
    let rowSet: RowSet = initialRowSet;

    const wordSpacing = getWordSpacing(fontSize);

    // model text pieces, obtaining their width at the current font size
    const measurements = measure(fontSize, boxes);
    const allMeasuredBoxes: RowBox[] = measurements.map(
      ({ width, emHeightDescent, emHeightAscent }: TextMetrics, i: number) => ({
        width,
        verticalOffset: -(emHeightDescent + emHeightAscent) / 2, // meaning, `middle`,
        wordBeginning: NaN,
        ...boxes[i],
        fontSize, // iterated fontSize overrides a possible more global fontSize
      }),
    );
    const linePitch = fontSize;

    // rowSet building starts
    let targetRowCount = 0;
    let measuredBoxes = allMeasuredBoxes.slice();
    let innerCompleted = false;

    // iterate through possible target row counts
    while (++targetRowCount <= maxRowCount && !innerCompleted) {
      measuredBoxes = allMeasuredBoxes.slice();
      rowSet = {
        id: nodeId(node),
        fontSize,
        fillTextColor: '',
        rotation,
        verticalAlignment,
        leftAlign,
        clipText,
        rows: [...new Array(targetRowCount)].map(() => ({
          rowWords: [],
          rowAnchorX: NaN,
          rowAnchorY: NaN,
          maximumLength: NaN,
          length: NaN,
        })),
        container,
      };

      let currentRowIndex = 0;

      // iterate through rows
      while (currentRowIndex < targetRowCount) {
        const currentRow = rowSet.rows[currentRowIndex];
        const currentRowWords = currentRow.rowWords;

        // current row geometries
        const { maximumRowLength, rowAnchorX, rowAnchorY } = getShapeRowGeometry(
          container,
          cx,
          cy,
          targetRowCount,
          linePitch,
          currentRowIndex,
          fontSize,
          rotation,
          verticalAlignment,
          padding,
        );

        currentRow.rowAnchorX = rowAnchorX;
        currentRow.rowAnchorY = rowAnchorY;
        currentRow.maximumLength = maximumRowLength;

        // row building starts
        let currentRowLength = 0;
        let rowHasRoom = true;

        // iterate through words: keep adding words while there's room
        while (measuredBoxes.length > 0 && rowHasRoom) {
          // adding box to row
          const [currentBox] = measuredBoxes;

          const wordBeginning = currentRowLength;
          currentRowLength += currentBox.width + wordSpacing;

          if (clipText || currentRowLength <= currentRow.maximumLength) {
            currentRowWords.push({ ...currentBox, wordBeginning });
            currentRow.length = currentRowLength;
            measuredBoxes.shift();
          } else {
            rowHasRoom = false;
          }
        }

        currentRowIndex++;
      }

      innerCompleted = rowSetComplete(rowSet, measuredBoxes);
    }
    const completed = measuredBoxes.length === 0;
    return { rowSet, completed };
  };
}

function getRowSet<C>(
  boxes: Box[],
  maxRowCount: number,
  fontSizes: Pixels[],
  measure: TextMeasure,
  rotation: Radian,
  verticalAlignment: VerticalAlignments,
  leftAlign: boolean,
  container: C,
  getShapeRowGeometry: GetShapeRowGeometry<C>,
  cx: Coordinate,
  cy: Coordinate,
  padding: Padding,
  node: ShapeTreeNode,
  clipText: boolean,
) {
  const tryFunction = tryFontSize(
    measure,
    rotation,
    verticalAlignment,
    leftAlign,
    container,
    getShapeRowGeometry,
    cx,
    cy,
    padding,
    node,
    boxes,
    maxRowCount,
    clipText,
  );

  // find largest fitting font size
  const largestIndex = fontSizes.length - 1;
  const response = (i: number) => i + (tryFunction(identityRowSet(), fontSizes[i]).completed ? 0 : largestIndex + 1);
  const fontSizeIndex = monotonicHillClimb(response, largestIndex, largestIndex, integerSnap);

  if (!(fontSizeIndex >= 0)) {
    return identityRowSet();
  }

  const { rowSet, completed } = tryFunction(identityRowSet(), fontSizes[fontSizeIndex]); // todo in the future, make the hill climber also yield the result to avoid this +1 call
  return { ...rowSet, rows: rowSet.rows.filter((r) => completed && !isNaN(r.length)) };
}

/** @internal */
export function inSectorRotation(horizontalTextEnforcer: number, horizontalTextAngleThreshold: number) {
  return (node: ShapeTreeNode): Radian => {
    let rotation = trueBearingToStandardPositionAngle((node.x0 + node.x1) / 2);
    if (Math.abs(node.x1 - node.x0) > horizontalTextAngleThreshold && horizontalTextEnforcer > 0)
      rotation *= 1 - horizontalTextEnforcer;
    if (TAU / 4 < rotation && rotation < (3 * TAU) / 4) rotation = wrapToTau(rotation - TAU / 2);
    return rotation;
  };
}

type GetRotation = (node: ShapeTreeNode) => Radian;

/** @internal */
export function fillTextLayout<C>(
  shapeConstructor: ShapeConstructor<C>,
  getShapeRowGeometry: GetShapeRowGeometry<C>,
  getRotation: GetRotation,
) {
  const specificFiller = fill(shapeConstructor, getShapeRowGeometry, getRotation);
  return function fillTextLayoutClosure(
    measure: TextMeasure,
    rawTextGetter: RawTextGetter,
    valueGetter: ValueGetterFunction,
    valueFormatter: ValueFormatter,
    childNodes: QuadViewModel[],
    config: Config,
    layers: Layer[],
    textFillOrigins: PointTuple[],
    leftAlign: boolean,
    middleAlign: boolean,
  ): RowSet[] {
    const allFontSizes: Pixels[][] = [];
    for (let l = 0; l <= layers.length; l++) {
      // get font size spec from config, which layer.fillLabel properties can override
      const { minFontSize, maxFontSize, idealFontSizeJump } = {
        ...config,
        ...(l < layers.length && layers[l].fillLabel),
      };
      const fontSizeMagnification = maxFontSize / minFontSize;
      const fontSizeJumpCount = Math.round(logarithm(idealFontSizeJump, fontSizeMagnification));
      const realFontSizeJump = Math.pow(fontSizeMagnification, 1 / fontSizeJumpCount);
      const fontSizes: Pixels[] = [];
      for (let i = 0; i <= fontSizeJumpCount; i++) {
        const fontSize = Math.round(minFontSize * Math.pow(realFontSizeJump, i));
        if (!fontSizes.includes(fontSize)) {
          fontSizes.push(fontSize);
        }
      }
      allFontSizes.push(fontSizes);
    }

    const filler = specificFiller(
      config,
      layers,
      measure,
      rawTextGetter,
      valueGetter,
      valueFormatter,
      leftAlign,
      middleAlign,
    );

    return childNodes
      .map((node: QuadViewModel, i: number) => ({ node, origin: textFillOrigins[i] }))
      .sort((a: NodeWithOrigin, b: NodeWithOrigin) => b.node.value - a.node.value)
      .reduce(
        (
          { rowSets, fontSizes }: { rowSets: RowSet[]; fontSizes: Pixels[][] },
          { node, origin }: { node: QuadViewModel; origin: [Pixels, Pixels] },
        ) => {
          const nextRowSet = filler(fontSizes, origin, node);
          const layerIndex = node.depth - 1;
          return {
            rowSets: [...rowSets, nextRowSet],
            fontSizes: fontSizes.map((layerFontSizes: Pixels[], index: number) =>
              !isNaN(nextRowSet.fontSize) && index === layerIndex && !layers[layerIndex]?.fillLabel?.maximizeFontSize
                ? layerFontSizes.filter((size: Pixels) => size <= nextRowSet.fontSize)
                : layerFontSizes,
            ),
          };
        },
        { rowSets: [] as RowSet[], fontSizes: allFontSizes },
      ).rowSets;
  };
}
