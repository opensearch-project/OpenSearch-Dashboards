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

import { WordcloudSpec } from '../../specs';
import { Config } from '../types/config_types';
import { WordcloudViewModel, PickFunction, ShapeViewModel } from '../types/viewmodel_types';

/** @internal */
export function shapeViewModel(spec: WordcloudSpec, config: Config): ShapeViewModel {
  const { width, height, margin } = config;

  const innerWidth = width * (1 - Math.min(1, margin.left + margin.right));
  const innerHeight = height * (1 - Math.min(1, margin.top + margin.bottom));

  const chartCenter = {
    x: width * margin.left + innerWidth / 2,
    y: height * margin.top + innerHeight / 2,
  };

  const {
    startAngle,
    endAngle,
    angleCount,
    padding,
    fontWeight,
    fontFamily,
    fontStyle,
    minFontSize,
    maxFontSize,
    spiral,
    exponent,
    data,
    weightFn,
    outOfRoomCallback,
  } = spec;

  const wordcloudViewModel: WordcloudViewModel = {
    startAngle,
    endAngle,
    angleCount,
    padding,
    fontWeight,
    fontFamily,
    fontStyle,
    minFontSize,
    maxFontSize,
    spiral,
    exponent,
    data,
    weightFn,
    outOfRoomCallback,
  };

  const pickQuads: PickFunction = (x, y) =>
    -innerWidth / 2 <= x && x <= innerWidth / 2 && -innerHeight / 2 <= y && y <= innerHeight / 2
      ? [wordcloudViewModel]
      : [];

  // combined viewModel
  return {
    config,
    chartCenter,
    wordcloudViewModel,
    pickQuads,
  };
}
