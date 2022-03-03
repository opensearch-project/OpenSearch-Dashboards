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

import { eachRotation } from '../helpers';
import { common } from '../page_objects';

describe('Line series stories', () => {
  describe('rotation', () => {
    eachRotation.it(async (rotation) => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/line-chart--ordinal-with-axis&knob-chartRotation=${rotation}`,
      );
    });
  });

  describe('Line paths for ordered values', () => {
    it('should render correct line path - non-stacked', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--test-path-ordering&knob-enable orderOrdinalBinsBy=true&knob-Stacked=false',
      );
    });

    it('should render correct line path - stacked', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--test-path-ordering&knob-enable orderOrdinalBinsBy=true&knob-Stacked=true',
      );
    });
  });
  describe('Non-Stacked Linear Line with discontinuous data points', () => {
    it('with fit', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--discontinuous-data-points&knob-enable fit function=false&knob-switch to area=',
      );
    });

    it('no fit function', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--discontinuous-data-points&knob-enable fit function=true&knob-switch to area=',
      );
    });
  });

  describe('Line with mark accessor', () => {
    it('with hidden points, default point highlighter size', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--line-with-mark-accessor&knob-markSizeRatio=10&knob-show line points=false&knob-debug=',
        { left: 115, top: 170 },
        {
          screenshotSelector: '#story-root',
        },
      );
    });
  });
});
