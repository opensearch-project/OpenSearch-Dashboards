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

import { common } from '../page_objects';

describe.only('Tooltips', () => {
  describe('rotation 0', () => {
    it('shows tooltip on first x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 160,
          y: 25,
        },
      );
    });
    it('shows tooltip on last x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 660,
          y: 25,
        },
      );
    });
    it('shows tooltip on first x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 160,
          y: 280,
        },
      );
    });
    it('shows tooltip on last x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 660,
          y: 280,
        },
      );
    });
  });
  describe('rotation 90', () => {
    it('shows tooltip on first x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 125,
          y: 50,
        },
      );
    });
    it('shows tooltip on last x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 700,
          y: 50,
        },
      );
    });
    it('shows tooltip on first x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 125,
          y: 270,
        },
      );
    });
    it('shows tooltip on last x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 700,
          y: 270,
        },
      );
    });
  });
});
