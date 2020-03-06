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

describe('Area series stories', () => {
  it('stacked as NOT percentage', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/area-chart--stacked-percentage&knob-stacked as percentage=',
    );
  });
  describe('accessorFormats', () => {
    it('should show custom format', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/area-chart--band-area&knob-scale to extent=&knob-y0AccessorFormat= [min]&knob-y1AccessorFormat= [max]',
      );
    });
  });
  describe('scale to extents', () => {
    describe('scaleyScaleToDataExtent is true', () => {
      it('should show correct extents - Banded', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band&knob-scale to extent=true',
        );
      });
      it('should show correct extents - stacked', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band&knob-scale to extent=true',
        );
      });
    });
    describe('scaleyScaleToDataExtent is false', () => {
      it('should show correct extents - Banded', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band&knob-scale to extent=false',
        );
      });
      it('should show correct extents - stacked', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band&knob-scale to extent=false',
        );
      });
    });
  });
});
