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

describe('Tooltips', () => {
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
    it('shows tooltip on sunburst', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--sunburst-slice-clicks',
        {
          x: 350,
          y: 100,
        },
      );
    });
    it('show rectangular brush selection', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool',
        { x: 100, y: 100 },
        { x: 250, y: 250 },
      );
    });
    it('show y brush selection', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=y&knob-chartRotation=0',
        { x: 100, y: 100 },
        { x: 250, y: 250 },
      );
    });
    it('show x brush selection', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=x&knob-chartRotation=0',
        { x: 100, y: 100 },
        { x: 250, y: 250 },
      );
    });

    it('show rectangular brush selection -90 degree', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=both&knob-chartRotation=-90',
        { x: 100, y: 100 },
        { x: 250, y: 250 },
      );
    });
    it('show y brush selection -90 degree', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=y&knob-chartRotation=-90',
        { x: 100, y: 100 },
        { x: 250, y: 250 },
      );
    });
    it('show x brush selection -90 degree', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=x&knob-chartRotation=-90',
        { x: 100, y: 100 },
        { x: 250, y: 250 },
      );
    });
  });
  it('should render corrent tooltip for split and y accessors', async () => {
    await common.expectChartWithMouseAtUrlToMatchScreenshot(
      'http://localhost:9001/iframe.html?id=bar-chart--bar-chart-2-y-2-g',
      {
        x: 330,
        y: 40,
      },
    );
  });
});
