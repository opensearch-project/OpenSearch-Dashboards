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

describe('Grid stories', () => {
  it('should render crosshair lines above grid lines', async () => {
    await common.expectChartWithMouseAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/grids--lines&knob-Stroke_Crosshair line=red&knob-Stroke width_Crosshair line=10&knob-Dash_Crosshair line[0]=0&knob-Dash_Crosshair line[1]=0&knob-Stroke_Crosshair cross line=red&knob-Stroke width_Crosshair cross line=10&knob-Dash_Crosshair cross line[0]=0&knob-Dash_Crosshair cross line[1]=0&knob-debug=&knob-Tooltip type=cross&knob-Show gridline_Left axis=true&knob-Opacity_Left axis=1&knob-Stroke_Left axis=rgba(0,0,0,1)&knob-Stroke width_Left axis=2&knob-Dash_Left axis[0]=4&knob-Dash_Left axis[1]=4&knob-Show gridline_Bottom axis=true&knob-Opacity_Bottom axis=1&knob-Stroke_Bottom axis=rgba(0,0,0,1)&knob-Stroke width_Bottom axis=2',
      { top: 115, right: 120 },
    );
  });
});
