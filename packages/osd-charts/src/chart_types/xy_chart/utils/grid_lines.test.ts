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

import { getGridLineForHorizontalAxisAt, getGridLineForVerticalAxisAt } from './grid_lines';

describe('Grid lines', () => {
  test('should compute positions for grid lines', () => {
    const tickPosition = 25;
    const panel = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
    };
    const verticalAxisGridLines = getGridLineForVerticalAxisAt(tickPosition, panel);
    expect(verticalAxisGridLines).toEqual({ x1: 0, y1: 25, x2: 100, y2: 25 });

    const horizontalAxisGridLines = getGridLineForHorizontalAxisAt(tickPosition, panel);
    expect(horizontalAxisGridLines).toEqual({ x1: 25, y1: 0, x2: 25, y2: 100 });
  });

  test('should compute axis grid line positions', () => {
    const panel = {
      width: 100,
      height: 200,
      top: 0,
      left: 0,
    };
    const tickPosition = 10;

    const verticalAxisGridLinePositions = getGridLineForVerticalAxisAt(tickPosition, panel);

    expect(verticalAxisGridLinePositions).toEqual({ x1: 0, y1: 10, x2: 100, y2: 10 });

    const horizontalAxisGridLinePositions = getGridLineForHorizontalAxisAt(tickPosition, panel);

    expect(horizontalAxisGridLinePositions).toEqual({ x1: 10, y1: 0, x2: 10, y2: 200 });
  });
});
