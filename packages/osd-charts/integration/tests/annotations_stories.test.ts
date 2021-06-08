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

import { Position } from '../../packages/charts/src';
import { eachRotation } from '../helpers';
import { common } from '../page_objects';

describe('Annotations stories', () => {
  describe('rotation', () => {
    eachRotation.it(async (rotation) => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/annotations-lines--single-bar-histogram&knob-debug=&knob-chartRotation=${rotation}`,
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

  describe('Render with zero domain or fit to domain', () => {
    it('show annotation when yDomain is not zero value', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--zero-domain&knob-min y=0&knob-max y=20&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=&knob-y0=1&knob-y1=5',
      );
    });
    it('show annotation when yDomain is [0, 20] and y0 and y1 are specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--zero-domain&knob-min y=0&knob-max y=20&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=true&knob-y0=1&knob-y1=5',
      );
    });
    it('show annotation when yDomain is [0, 0]', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--zero-domain&knob-min y=0&knob-max y=0&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=&knob-y0=1&knob-y1=5&knob-fit to the domain=',
      );
    });
    it('show annotation when yDomain fit is true', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--zero-domain&knob-min y=10&knob-max y=10&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=&knob-y0=1&knob-y1=5&knob-fit to the domain=true',
      );
    });
    it('does not show annotation with yDomain is [0, 0] and y0 and y1 specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--zero-domain&knob-min y=0&knob-max y=0&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=true&knob-y0=1&knob-y1=5&knob-fit to the domain=',
      );
    });
    it('does not show annotation with yDomain is [20, 20] and y0 and y1 values are specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--zero-domain&knob-min y=20&knob-max y=20&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=true&knob-y0=1&knob-y1=5&knob-fit to the domain=true',
      );
    });
  });

  describe('Render with no group id provided', () => {
    it('show annotation when group id is provided no y0 nor y1 values specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--with-group-id&knob-enable annotation=true&knob-Annotation groupId=group1&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=',
      );
    });
    it('show annotation when group id is provided and y0 and y1 values specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--with-group-id&knob-enable annotation=true&knob-Annotation groupId=group1&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=true&knob-y0=2&knob-y1=3',
      );
    });
    it('show annotation when group id is provided y0 and y1 values specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--with-group-id&knob-enable annotation=true&knob-Annotation groupId=group1&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=true&knob-y0=0&knob-y1=3',
      );
    });
    it('show annotation when no group id provided and no y0 nor y1 values specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--with-group-id&knob-enable annotation=true&knob-Annotation groupId=none&knob-x0=5&knob-x1=10&knob-enable y0 and y1 values=',
      );
    });
    it('does not show annotation when no group id provided and y0 and y1 values specified', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations-rects--with-group-id&knob-enable%20annotation=true&knob-Annotation%20groupId=none&knob-x0=5&knob-x1=10&knob-enable%20y0%20and%20y1%20values=true&knob-y0=0&knob-y1=3',
      );
    });
  });

  describe('Advanced markers', () => {
    describe.each<Position>(Object.values(Position))('Annotation marker side - %s', (side) => {
      eachRotation.describe((rotation) => {
        it.each<number>([0, 15, 30])('renders marker annotation within chart canvas - metric: %i', async (metric) => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/annotations-lines--advanced-markers&knob-Debug=&knob-show legend=true&knob-chartRotation=${rotation}&knob-Side=${side}&knob-TickLine padding for markerBody=30&knob-Annotation metric=${metric}`,
          );
        });
      });
    });
  });
});
