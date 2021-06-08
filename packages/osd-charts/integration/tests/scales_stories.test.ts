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

import { LogBase } from '../../packages/charts/src/scales/scale_continuous';
import { common } from '../page_objects';

describe('Scales stories', () => {
  describe.each`
    polarity      | value
    ${'Negative'} | ${true}
    ${'Positive'} | ${false}
  `('$polarity values', ({ value: negative }) => {
    it.each(Object.values(LogBase))('should render proper ticks with %s base', async (base) => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/scales--log-scale-options&knob-Use negative values_Y - Axis=${negative}&knob-Log base_Y - Axis=${base}&knob-Fit domain_Y - Axis=true&knob-Use default limit_Y - Axis=true`,
      );
    });

    it('should render with baseline set to 1 if fit is false', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/scales--log-scale-options&knob-Use negative values_Y - Axis=${negative}&knob-Log base_Y - Axis=common&knob-Fit domain_Y - Axis=false&knob-Use default limit_Y - Axis=true`,
      );
    });

    it('should render with baseline set to 1 if fit is false and limit is set', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/scales--log-scale-options&knob-Use negative values_Y - Axis=${negative}&knob-Log base_Y - Axis=common&knob-Fit domain_Y - Axis=false&knob-Use default limit_Y - Axis=true&knob-Log min limit_Y - Axis=0.01`,
      );
    });

    it('should render values with log limit', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/scales--log-scale-options&knob-Use negative values_Y - Axis=${negative}&knob-Log base_Y - Axis=common&knob-Fit domain_Y - Axis=true&knob-Log min limit_Y - Axis=0.01&knob-Use default limit_Y - Axis=false`,
      );
    });
  });
});
