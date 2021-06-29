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

import { Placement } from '../../packages/charts/src';
import { eachRotation } from '../helpers';
import { common } from '../page_objects';

describe('Interactions', () => {
  describe('Tooltips', () => {
    describe('Positioning', () => {
      const left = 20;
      const top = 20;
      const bottom = 20;
      const right = 20;

      describe.each<string>(['default', 'chart'])('Boundary El - %s', (boundary) => {
        eachRotation.describe((rotation) => {
          describe.each<Placement>([Placement.Right, Placement.Left, Placement.Top, Placement.Bottom])(
            'Placement - %s',
            (placement) => {
              const boundaryStr = boundary === 'default' ? '' : boundary;
              const url = `http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-Boundary Element=${boundaryStr}&knob-chartRotation=${rotation}&knob-Tooltip placement=${placement}`;
              it('shows tooltip in top-left corner', async () => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { left, top },
                  { screenshotSelector: 'body' },
                );
              });

              it('shows tooltip in top-right corner', async () => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { right, top },
                  { screenshotSelector: 'body' },
                );
              });

              it('shows tooltip in bottom-left corner', async () => {
                await common.expectChartWithMouseAtUrlToMatchScreenshot(
                  url,
                  { left, bottom },
                  { screenshotSelector: 'body' },
                );
              });

              it('shows tooltip in bottom-right corner', async () => {
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
        it('shows tooltip on first bar group - top', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { left: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - top', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { right: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on first bar group - bottom', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { left: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - bottom', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
            { left: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
      });

      describe('rotation 90', () => {
        it('shows tooltip on first bar group - top', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { left: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - top', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { left: 50, top: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on first bar group - bottom', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { left: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
        it('shows tooltip on last bar group - bottom', async () => {
          await common.expectChartWithMouseAtUrlToMatchScreenshot(
            'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
            { right: 50, bottom: 50 },
            { screenshotSelector: 'body' },
          );
        });
      });
    });

    it('should show tooltip on sunburst', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--sunburst-slice-clicks',
        { left: 350, top: 100 },
      );
    });

    it('should render custom tooltip', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-Custom Tooltip=true&knob-Show Legend=true',
        { left: 330, top: 40 },
        { screenshotSelector: 'body' },
      );
    });

    it('should render current tooltip for split and y accessors', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--bar-chart2y2g',
        { left: 330, top: 40 },
      );
    });

    it('should render current tooltip in dark theme', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/stylings--dark-theme',
        { left: 120, bottom: 80 },
      );
    });

    describe.each([
      // TODO: find why these vrt don't position tooltip wrt boundary
      // ['Root', 'root', 7],
      // ['Red', 'red', 6],
      // ['White', 'white', 5],
      // ['Blue', 'blue', 3],
      ['Chart', 'chart', 2],
    ])('Boundary - %s', (_, boundary, groups) => {
      it('should contain tooltip inside boundary near top', async () => {
        await common.expectChartWithMouseAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/bar-chart--tooltip-boundary&knob-Boundary Element=${boundary}&knob-Groups=${groups}&knob-Show axes=false`,
          { left: 100, top: 20 },
          { screenshotSelector: 'body' },
        );
      });
      it('should contain tooltip inside boundary near bottom', async () => {
        await common.expectChartWithMouseAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/bar-chart--tooltip-boundary&knob-Boundary Element=${boundary}&knob-Groups=${groups}&knob-Show axes=false`,
          { left: 100, bottom: 20 },
          { screenshotSelector: 'body' },
        );
      });
    });
  });

  describe('brushing', () => {
    it('show rectangular brush selection', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show y brush selection', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=y&knob-chartRotation=0',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show x brush selection', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=x&knob-chartRotation=0',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });

    it('show rectangular brush selection -90 degree', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=both&knob-chartRotation=-90',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show y brush selection -90 degree', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=y&knob-chartRotation=-90',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
    it('show x brush selection -90 degree', async () => {
      await common.expectChartWithDragAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--brush-tool&knob-brush axis=x&knob-chartRotation=-90',
        { left: 100, top: 100 },
        { left: 250, top: 250 },
      );
    });
  });

  describe('Tooltip sync', () => {
    it('show synced tooltips', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--cursor-update-action&knob-local%20tooltip%20type_Top%20Chart=vertical&knob-local%20tooltip%20type_Bottom%20Chart=vertical&knob-enable%20external%20tooltip_Top%20Chart=true&knob-enable%20external%20tooltip_Bottom%20Chart=true&knob-external%20tooltip%20placement_Top%20Chart=left&knob-external%20tooltip%20placement_Bottom%20Chart=left&knob-pointer update debounce=0',
        { right: 200, top: 80 },
        {
          screenshotSelector: '#story-root',
        },
      );
    });

    it('show synced crosshairs', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--cursor-update-action&knob-local%20tooltip%20type_Top%20Chart=vertical&knob-local%20tooltip%20type_Bottom%20Chart=vertical&knob-enable%20external%20tooltip_Top%20Chart=true&knob-enable%20external%20tooltip_Bottom%20Chart=false&knob-external%20tooltip%20placement_Top%20Chart=left&knob-external%20tooltip%20placement_Bottom%20Chart=left&knob-pointer update debounce=0',
        { right: 200, top: 80 },
        {
          screenshotSelector: '#story-root',
        },
      );
    });

    it('show synced extra values in legend', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/interactions--cursor-update-action&knob-Series type_Top Chart=line&knob-enable external tooltip_Top Chart=true&knob-Series type_Bottom Chart=line&knob-enable external tooltip_Bottom Chart=false&knob-pointer update debounce=0',
        { right: 200, top: 80 },
        {
          screenshotSelector: '#story-root',
        },
      );
    });
  });

  describe('Tooltip formatting', () => {
    it('should use all custom tick formatters', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show%20legend_Y%20axis=true&knob-Disable%20Axis%20tickFormat_Y%20axis=&knob-Axis%20value%20format_Y%20axis=0[.]0&knob-Axis%20unit_Y%20axis=pets&knob-Disable%20header%20tickFormat_X%20axis=&knob-Header%20unit_X%20axis=(header)&knob-Disable%20Axis%20tickFormat_X%20axis=&knob-Axis%20unit_X%20axis=(axis)&knob-Disable%20dog%20line%20tickFormat_Y%20axis=&knob-Dog%20line%20unit_Y%20axis=dogs&knob-Disable%20cat%20line%20tickFormat_Y%20axis=&knob-Cat%20line%20unit_Y%20axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use series tick formatter with no axis tick formatter', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show legend_Y axis=true&knob-Disable Axis tickFormat_Y axis=true&knob-Axis value format_Y axis=0[.]0&knob-Axis unit_Y axis=pets&knob-Disable header tickFormat_X axis=&knob-Header unit_X axis=(header)&knob-Disable Axis tickFormat_X axis=&knob-Axis unit_X axis=(axis)&knob-Disable dog line tickFormat_Y axis=&knob-Dog line unit_Y axis=dogs&knob-Disable cat line tickFormat_Y axis=&knob-Cat line unit_Y axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use series tick formatter with no axis tick formatter, missing series tick formatter', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show legend_Y axis=true&knob-Disable Axis tickFormat_Y axis=true&knob-Axis value format_Y axis=0[.]0&knob-Axis unit_Y axis=pets&knob-Disable header tickFormat_X axis=&knob-Header unit_X axis=(header)&knob-Disable Axis tickFormat_X axis=&knob-Axis unit_X axis=(axis)&knob-Disable dog line tickFormat_Y axis=true&knob-Dog line unit_Y axis=dogs&knob-Disable cat line tickFormat_Y axis=&knob-Cat line unit_Y axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use default tick formatter with no axis tick formatter, nor series tick formatter', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show legend_Y axis=true&knob-Disable Axis tickFormat_Y axis=true&knob-Axis value format_Y axis=0[.]0&knob-Axis unit_Y axis=pets&knob-Disable header tickFormat_X axis=&knob-Header unit_X axis=(header)&knob-Disable Axis tickFormat_X axis=&knob-Axis unit_X axis=(axis)&knob-Disable dog line tickFormat_Y axis=true&knob-Dog line unit_Y axis=dogs&knob-Disable cat line tickFormat_Y axis=true&knob-Cat line unit_Y axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use headerFormatter for x axis', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show legend_Y axis=true&knob-Disable Axis tickFormat_Y axis=&knob-Axis value format_Y axis=0[.]0&knob-Axis unit_Y axis=pets&knob-Disable header tickFormat_X axis=&knob-Header unit_X axis=(header)&knob-Disable Axis tickFormat_X axis=&knob-Axis unit_X axis=(axis)&knob-Disable dog line tickFormat_Y axis=&knob-Dog line unit_Y axis=dogs&knob-Disable cat line tickFormat_Y axis=&knob-Cat line unit_Y axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use axis tick formatter with no headerFormatter', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show legend_Y axis=true&knob-Disable Axis tickFormat_Y axis=&knob-Axis value format_Y axis=0[.]0&knob-Axis unit_Y axis=pets&knob-Disable header tickFormat_X axis=true&knob-Header unit_X axis=(header)&knob-Disable Axis tickFormat_X axis=&knob-Axis unit_X axis=(axis)&knob-Disable dog line tickFormat_Y axis=&knob-Dog line unit_Y axis=dogs&knob-Disable cat line tickFormat_Y axis=&knob-Cat line unit_Y axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use default tick formatter with no axis tick formatter nor headerFormatter', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/axes--different-tooltip-formatter&knob-Show legend_Y axis=true&knob-Disable Axis tickFormat_Y axis=&knob-Axis value format_Y axis=0[.]0&knob-Axis unit_Y axis=pets&knob-Disable header tickFormat_X axis=true&knob-Header unit_X axis=(header)&knob-Disable Axis tickFormat_X axis=true&knob-Axis unit_X axis=(axis)&knob-Disable dog line tickFormat_Y axis=&knob-Dog line unit_Y axis=dogs&knob-Disable cat line tickFormat_Y axis=&knob-Cat line unit_Y axis=cats',
        { left: 280, top: 80 },
      );
    });

    it('should use custom mark formatters', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/mixed-charts--mark-size-accessor',
        { left: 400, top: 80 },
      );
    });
  });
  it('should size legends with ordinal x axis', async () => {
    await common.expectChartWithMouseAtUrlToMatchScreenshot(
      'http://localhost:9001/iframe.html?id=axes--different-tooltip-formatter',
      { left: 350, top: 130 },
    );
  });

  describe('legend items with color picker clicking hidden or unhidden', () => {
    // eslint-disable-next-line jest/expect-expect
    it('legend items should not move when color picker series is hidden or unhidden', async () => {
      await common.moveMouse(0, 0);
      await common.expectChartWithKeyboardEventsAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/legend--color-picker',
        [
          {
            key: 'tab',
            count: 2,
          },
          {
            key: 'enter',
            count: 1,
          },
        ],
      );
    });
  });
});
