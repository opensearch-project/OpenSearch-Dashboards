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

import { getBrushForXAxis, getBrushForYAxis, getBrushForBothAxis } from './get_brush_area';
import { Dimensions } from '../../../../utils/dimensions';

describe('getBrushArea Selector', () => {
  it('should return the brush area', () => {
    const chartDimensions: Dimensions = { left: 0, top: 0, width: 100, height: 110 };

    const xBrushArea = getBrushForXAxis(chartDimensions, 0, { x: 10, y: 10 }, { x: 30, y: 30 });
    expect(xBrushArea).toEqual({
      top: 0,
      left: 10,
      width: 20,
      height: 110,
    });
    const yBrushArea = getBrushForYAxis(chartDimensions, 0, { x: 10, y: 10 }, { x: 30, y: 30 });
    expect(yBrushArea).toEqual({
      top: 10,
      left: 0,
      width: 100,
      height: 20,
    });

    const bothBrushArea = getBrushForBothAxis(chartDimensions, { x: 10, y: 10 }, { x: 30, y: 30 });
    expect(bothBrushArea).toEqual({
      top: 10,
      left: 10,
      width: 20,
      height: 20,
    });
  });

  it('should return the brush area on rotated chart', () => {
    const chartDimensions: Dimensions = { left: 0, top: 0, width: 100, height: 110 };

    const brushArea = getBrushForXAxis(chartDimensions, 90, { x: 10, y: 10 }, { x: 30, y: 30 });
    expect(brushArea).toEqual({
      top: 10,
      left: 0,
      width: 100,
      height: 20,
    });

    const yBrushArea = getBrushForYAxis(chartDimensions, 90, { x: 10, y: 10 }, { x: 30, y: 30 });
    expect(yBrushArea).toEqual({
      top: 0,
      left: 10,
      width: 20,
      height: 110,
    });

    const bothBrushArea = getBrushForBothAxis(chartDimensions, { x: 10, y: 10 }, { x: 30, y: 30 });
    expect(bothBrushArea).toEqual({
      top: 10,
      left: 10,
      width: 20,
      height: 20,
    });
  });
});
