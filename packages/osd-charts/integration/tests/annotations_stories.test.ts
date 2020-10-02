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

import { common } from '../page_objects';

describe('Annotations stories', () => {
  describe('rotation', () => {
    it('rotation - 0', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-lines--single-bar-histogram&knob-debug=&knob-chartRotation=0',
      );
    });
    it('rotation - 90', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-lines--single-bar-histogram&knob-debug=&knob-chartRotation=90',
      );
    });
    it('rotation - negative 90', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-lines--single-bar-histogram&knob-debug=&knob-chartRotation=-90',
      );
    });
    it('rotation - 180', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-lines--single-bar-histogram&knob-debug=&knob-chartRotation=180',
      );
    });
  });
  describe('Render within domain', () => {
    it('cover from 0 to end domain', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--linear-bar-chart&knob-debug=&knob-chartRotation=0&knob-x0 coordinate=0&knob-x1 coordinate=none',
      );
    });
    it('cover from 0 to 1', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--linear-bar-chart&knob-debug=&knob-chartRotation=0&knob-x0 coordinate=0&knob-x1 coordinate=1',
      );
    });
    it('cover from 3 only on bar chart', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--linear-bar-chart&knob-debug=&knob-chartRotation=0&knob-x0 coordinate=3&knob-x1 coordinate=none',
      );
    });
    it('cover from 1 only on bar chart', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--linear-bar-chart&knob-debug=&knob-chartRotation=0&knob-x0 coordinate=1&knob-x1 coordinate=1',
      );
    });
    it("don't render outside domain", async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--linear-bar-chart&knob-debug=&knob-chartRotation=0&knob-x0 coordinate=3.1&knob-x1 coordinate=none',
      );
    });
  });
});
