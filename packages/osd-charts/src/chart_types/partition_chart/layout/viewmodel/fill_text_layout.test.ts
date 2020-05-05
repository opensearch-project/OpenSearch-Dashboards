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

import { getRectangleRowGeometry } from './fill_text_layout';

describe('Test that getRectangleRowGeometry works with:', () => {
  const container = { x0: 0, y0: 0, x1: 200, y1: 100 };
  const cx = 0;
  const cy = 0;
  const totalRowCount = 1;
  const linePitch = 50;
  const rowIndex = 0;
  const fontSize = 50;
  const _rotation = 0;
  const verticalAlignment = 'top';

  const defaultPadding = 2;
  const overhangOffset = -4.5;

  test('scalar, zero padding', () => {
    const padding = 0;
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200,
      rowAnchorX: 0,
      rowAnchorY: overhangOffset,
    });
  });

  test('scalar, nonzero padding', () => {
    const padding = 10;
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200 - padding * 2,
      rowAnchorX: 0,
      rowAnchorY: overhangOffset - padding,
    });
  });

  test('per-side, fully specified padding', () => {
    const padding = { top: 5, bottom: 10, left: 20, right: 30 };
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200 - padding.left - padding.right,
      rowAnchorX: -5, // (left - right) / 2
      rowAnchorY: overhangOffset - padding.top,
    });
  });

  test('per-side, partially specified padding', () => {
    const padding = { bottom: 10, right: 30 };
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200 - defaultPadding - padding.right,
      rowAnchorX: -(30 /* right padding */ / 2 - 2 /* 2: default left padding */ / 2),
      rowAnchorY: overhangOffset - defaultPadding,
    });
  });

  test('not enough height with per-side, partially specified padding', () => {
    const padding = { top: 80, bottom: 80 };
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 0, // Height of 100 - 2 * 80 < 50
      rowAnchorX: NaN, // if text can't be placed, what is its anchor?
      rowAnchorY: NaN, // if text can't be placed, what is its anchor?
    });
  });

  test('not enough height with per-side, asymmetric padding', () => {
    const padding = { top: 10, bottom: 50 };
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 0,
      rowAnchorX: NaN, // if text can't be placed, what is its anchor?
      rowAnchorY: NaN, // if text can't be placed, what is its anchor?
    });
  });

  test('just enough height to fit row with per-side, asymmetric padding', () => {
    const padding = { top: 10, bottom: 30 };
    const result = getRectangleRowGeometry(
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
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200 - 2 * defaultPadding, // Height of 100 - 2 * 80 < 50
      rowAnchorX: 0,
      rowAnchorY: overhangOffset - padding.top,
    });
  });

  test('two half-height rows also fit into the same area', () => {
    const padding = { top: 10, bottom: 30 };
    const smallFontSize = 25;
    const smallLinePitch = 25;
    const totalRowCount2 = 2;
    const rowIndex = 0;
    const smallOverhangOffset = -2.8125;
    const result = getRectangleRowGeometry(
      container,
      cx,
      cy,
      totalRowCount2,
      smallLinePitch,
      rowIndex,
      smallFontSize,
      _rotation,
      verticalAlignment,
      padding,
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200 - 2 * defaultPadding, // Height of 100 - 2 * 80 < 50
      rowAnchorX: 0,
      rowAnchorY: smallOverhangOffset - padding.top,
    });
  });

  test('two half-height rows do not fit into the a slightly less high area', () => {
    const padding = { top: 10, bottom: 45 };
    const smallFontSize = 25;
    const smallLinePitch = 25;
    const totalRowCount2 = 2;
    const rowIndex = 0;
    const result = getRectangleRowGeometry(
      container,
      cx,
      cy,
      totalRowCount2,
      smallLinePitch,
      rowIndex,
      smallFontSize,
      _rotation,
      verticalAlignment,
      padding,
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 0, // Height of 100 - (10 + smallOverhangOffset) - 45  < totalRowCount2 * smallLinePitch
      rowAnchorX: NaN,
      rowAnchorY: NaN,
    });
  });

  test('paddingBottom correctly moves the row anchor with bottom alignment', () => {
    const padding = { top: 0, right: 0, bottom: 20, left: 0 };
    const smallFontSize = 25;
    const smallLinePitch = 25;
    const totalRowCount2 = 2;
    const rowIndex = 0;
    const result = getRectangleRowGeometry(
      container,
      cx,
      cy,
      totalRowCount2,
      smallLinePitch,
      rowIndex,
      smallFontSize,
      _rotation,
      'bottom',
      padding,
    );
    // full container width is available; small Y offset for overhang
    expect(result).toEqual({
      maximumRowLength: 200,
      rowAnchorX: 0,
      rowAnchorY: -(
        (
          100 /*y1*/ -
          smallLinePitch * (totalRowCount2 - 1 - rowIndex) -
          padding.bottom -
          smallFontSize * 0.05
        ) /* 0.05 = 5%: default overhang multiplier */
      ),
    });
  });
});
