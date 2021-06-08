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

import { SeriesType } from '../../packages/charts/src';
import { common } from '../page_objects';

describe('Stylings stories', () => {
  describe('Texture', () => {
    describe.each([SeriesType.Bar, SeriesType.Area])('%s', (seriesType) => {
      it(`should use custom path`, async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/stylings--with-texture&knob-Use custom path_Texture=true&knob-Custom path_Texture=M -7.75 -2.5 l 5.9 0 l 1.85 -6.1 l 1.85 6.1 l 5.9 0 l -4.8 3.8 l 1.85 6.1 l -4.8 -3.8 l -4.8 3.8 l 1.85 -6.1 l -4.8 -3.8 z&knob-Use stroke color_Texture=true&knob-Stoke color_Texture=&knob-Stroke width_Texture=1&knob-Use fill color_Texture=true&knob-Fill color_Texture=&knob-Rotation (degrees)_Pattern=45&knob-Opacity_Texture=1&knob-Shape rotation (degrees)_Texture=0&knob-Shape size - custom path_Texture=20&knob-Shape spacing - x_Pattern=10&knob-Shape spacing - y_Pattern=0&knob-Pattern offset - x_Pattern=0&knob-Pattern offset - y_Pattern=0&knob-Apply offset along global coordinate axes_Pattern=true&knob-Series opacity_Series=1&knob-Show series fill_Series=&knob-Series color_Series=rgba(0,0,0,1)&knob-Series type_Series=${seriesType}`,
        );
      });

      it(`should render texture with lines as shape`, async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/stylings--with-texture&knob-Use custom path_Texture=&knob-Shape_Texture=line&knob-Use stroke color_Texture=true&knob-Stoke color_Texture=rgba(0,0,0,1)&knob-Stroke width_Texture=1&knob-Stroke dash_Texture[0]=10&knob-Stroke dash_Texture[1]= 5&knob-Use fill color_Texture=&knob-Fill color_Texture=rgba(30,165,147,0.28)&knob-Rotation (degrees)_Pattern=-45&knob-Opacity_Texture=1&knob-Shape rotation (degrees)_Texture=0&knob-Shape size_Texture=20&knob-Shape spacing - x_Pattern=0&knob-Shape spacing - y_Pattern=0&knob-Pattern offset - x_Pattern=0&knob-Pattern offset - y_Pattern=0&knob-Apply offset along global coordinate axes_Pattern=true&knob-Series opacity_Series=1&knob-Show series fill_Series=&knob-Series color_Series=rgba(0,0,0,1)&knob-Series type_Series=${seriesType}`,
        );
      });

      it(`should allow any random texture customization`, async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/stylings--texture-multiple-series&knob-Total series=4&knob-Show legend=&knob-Show series fill=&knob-Chart color=rgba(0,0,0,1)&knob-Shape_Randomized parameters=true&knob-Rotation_Randomized parameters=true&knob-Shape rotation_Randomized parameters=true&knob-Size_Randomized parameters=true&knob-X spacing_Randomized parameters=true&knob-Y spacing_Randomized parameters=true&knob-X offset_Randomized parameters=true&knob-Y offset_Randomized parameters=true&knob-Series type=${seriesType}&knob-Shape_Default parameters=circle&knob-Stroke width_Default parameters=1&knob-Rotation (degrees)_Default parameters=45&knob-Shape rotation (degrees)_Default parameters=0&knob-Shape size_Default parameters=20&knob-Opacity_Default parameters=1&knob-Shape spacing - x_Default parameters=10&knob-Shape spacing - y_Default parameters=10&knob-Pattern offset - x_Default parameters=0&knob-Pattern offset - y_Default parameters=0`,
        );
      });

      it(`should use hover opacity for texture`, async () => {
        await common.expectChartWithMouseAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/stylings--texture-multiple-series&knob-Total series=4&knob-Show legend=true&knob-Show series fill=&knob-Chart color=rgba(0,0,0,1)&knob-Shape_Randomized parameters=true&knob-Rotation_Randomized parameters=&knob-Shape rotation_Randomized parameters=&knob-Size_Randomized parameters=true&knob-X spacing_Randomized parameters=&knob-Y spacing_Randomized parameters=&knob-X offset_Randomized parameters=&knob-Y offset_Randomized parameters=&knob-Series type=${seriesType}&knob-Shape_Default parameters=circle&knob-Stroke width_Default parameters=1&knob-Rotation (degrees)_Default parameters=45&knob-Shape rotation (degrees)_Default parameters=0&knob-Shape size_Default parameters=20&knob-Opacity_Default parameters=1&knob-Shape spacing - x_Default parameters=10&knob-Shape spacing - y_Default parameters=10&knob-Pattern offset - x_Default parameters=0&knob-Pattern offset - y_Default parameters=0`,
          { top: 45, right: 40 },
        );
      });
    });
  });
});
