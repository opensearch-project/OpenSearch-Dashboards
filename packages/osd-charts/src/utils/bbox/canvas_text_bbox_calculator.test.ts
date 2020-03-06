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

import { CanvasTextBBoxCalculator } from './canvas_text_bbox_calculator';

describe('CanvasTextBBoxCalculator', () => {
  test('can create a canvas for computing text measurement values', () => {
    const canvasBboxCalculator = new CanvasTextBBoxCalculator();
    const bbox = canvasBboxCalculator.compute('foo', 0);
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);
  });
});
