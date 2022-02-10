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

import { Position } from '../../../utils/common';
import { isBounded, isVerticalAxis, isHorizontalAxis, isVerticalGrid, isHorizontalGrid } from './axis_type_utils';

describe('Axis type utils', () => {
  test('should determine orientation of axis position', () => {
    expect(isVerticalAxis(Position.Left)).toBe(true);
    expect(isVerticalAxis(Position.Right)).toBe(true);
    expect(isVerticalAxis(Position.Top)).toBe(false);
    expect(isVerticalAxis(Position.Bottom)).toBe(false);

    expect(isHorizontalAxis(Position.Left)).toBe(false);
    expect(isHorizontalAxis(Position.Right)).toBe(false);
    expect(isHorizontalAxis(Position.Top)).toBe(true);
    expect(isHorizontalAxis(Position.Bottom)).toBe(true);
  });

  test('should determine orientation of gridlines from axis position', () => {
    expect(isVerticalGrid(Position.Left)).toBe(false);
    expect(isVerticalGrid(Position.Right)).toBe(false);
    expect(isVerticalGrid(Position.Top)).toBe(true);
    expect(isVerticalGrid(Position.Bottom)).toBe(true);

    expect(isHorizontalGrid(Position.Left)).toBe(true);
    expect(isHorizontalGrid(Position.Right)).toBe(true);
    expect(isHorizontalGrid(Position.Top)).toBe(false);
    expect(isHorizontalGrid(Position.Bottom)).toBe(false);
  });

  test('should determine that a domain has at least one bound', () => {
    const lowerBounded = {
      min: 0,
    };

    const upperBounded = {
      max: 0,
    };

    expect(isBounded(lowerBounded)).toBe(true);
    expect(isBounded(upperBounded)).toBe(true);
  });
});
