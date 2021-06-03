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

import { common } from '../page_objects/common';

describe('Styles', () => {
  it('should hide the value label with 0 borderWidth', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/bar-chart--with-value-label-advanced&knob-show value label=true&knob-alternating value label=&knob-contain value label within bar element=&knob-hide clipped value=&knob-debug=&knob-textInverted=&knob-value color=rgba(0,0,0,1)&knob-value border color=rgba(0,0,0,1)&knob-value border width=0&knob-Fixed font size=10&knob-Use fixed font size=&knob-Max font size=25&knob-Min font size=10&knob-offsetX=0&knob-offsetY=0&knob-data volume size=s&knob-split series=&knob-stacked series=&knob-chartRotation=0',
    );
  });
  it('should hide the value label with 0 textBorder', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/bar-chart--with-value-label-advanced&knob-show value label=true&knob-alternating value label=&knob-contain value label within bar element=&knob-hide clipped value=&knob-debug=&knob-textInverted=true&knob-value color=rgba(0,0,0,1)&knob-value border color=rgba(0,0,0,1)&knob-value border width=0&knob-Fixed font size=10&knob-Use fixed font size=&knob-Max font size=25&knob-Min font size=10&knob-offsetX=0&knob-offsetY=0&knob-data volume size=s&knob-split series=&knob-stacked series=&knob-chartRotation=0',
    );
  });
});
