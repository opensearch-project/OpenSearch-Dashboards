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

import { Rotation, Placement } from '../../src';
import { common } from '../page_objects';

describe('Interactions', () => {
  describe('Tooltips', () => {
    describe('Positioning', () => {
      const left = 20;
      const top = 20;
      const bottom = 20;
      const right = 20;

      describe.each<string>(['default', 'chart'])('Boundary El - %s', (boundary) => {
        describe.each<[string, Rotation]>([
          ['0', 0],
          ['90', 90],
          ['180', 180],
          ['negative 90', -90],
        ])('rotation - %s', (_, rotation) => {
          describe.each<Placement>([Placement.Right, Placement.Left, Placement.Top, Placement.Bottom])(
            'Placement - %s',
            (placement) => {
              const boundaryStr = boundary === 'default' ? '' : boundary;
              const url = `http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-Boundary Element=${boundaryStr}&knob-chartRotation=${rotation}&knob-Tooltip placement=${placement}`;
              it('shows tooltip in top-left corner', async() => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { left, top },
                  { screenshotSelector: 'body' },
                );
              });

              it('shows tooltip in top-right corner', async() => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { right, top },
                  { screenshotSelector: 'body' },
                );
              });

              it('shows tooltip in bottom-left corner', async() => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { left, bottom },
                  { screenshotSelector: 'body' },
                );
              });

              it('shows tooltip in bottom-right corner', async() => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { right, bottom },
                  { screenshotSelector: 'body' },
                );
              });
            },
          );
        });
      });
    });

    describe('Hover over specific bars', () => {
      describe('rotation 0', () => {
        it('shows tooltip on first bar group - top', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { left: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - top', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { right: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on first bar group - bottom', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { left: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - bottom', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { left: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
      });

      describe('rotation 90', () => {
        it('shows tooltip on first bar group - top', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { left: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - top', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { left: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on first bar group - bottom', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { left: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - bottom', async() => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { right: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
      });
    });

    it('should show tooltip on sunburst', async() => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--sunburst-slice-clicks',
        { left: 350, top: 100 },
      );
    });

    it('should render custom tooltip', async() => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-Custom Tooltip=true&knob-Show Legend=true',
        { left: 330, top: 40 },
        { screenshotSelector: 'body' },
      );
    });

    it('should render corrent tooltip for split and y accessors', async() => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/iframe.html?id=bar-chart--bar-chart-2-y-2-g',
        { left: 330, top: 40 },
      );
    });

    it('should render corrent tooltip in dark theme', async() => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/stylings--dark-theme',
        { left: 120, bottom: 80 },
      );
    });
  });

  describe('brushing', () => {
    it('show rectangular brush selection', async() => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show y brush selection', async() => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=y&knob-chartRotation=0',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show x brush selection', async() => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=x&knob-chartRotation=0',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });

    it('show rectangular brush selection -90 degree', async() => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=both&knob-chartRotation=-90',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show y brush selection -90 degree', async() => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=y&knob-chartRotation=-90',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show x brush selection -90 degree', async() => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=x&knob-chartRotation=-90',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
  });

  describe('Tooltip sync', () => {
    it('show synced tooltips', async() => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--cursor-update-action',
        { left: 180, top: 80 },
        {
          screenshotSelector: '#story-root',
        }
      );
    });
  });
});
