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

import { $Values as Values } from 'utility-types';

import { Pixels, PointObject } from '../../../../common/geometry';
import { Color } from '../../../../utils/common';
import { config } from '../config/config';
import { Config } from './config_types';

/** @public */
export interface WordModel {
  text: string;
  weight: number;
  color: Color;
}

/** @public */
export const WeightFn = Object.freeze({
  log: 'log' as const,
  linear: 'linear' as const,
  exponential: 'exponential' as const,
  squareRoot: 'squareRoot' as const,
});

/** @public */
export type WeightFn = Values<typeof WeightFn>;

/** @internal */
export interface Word {
  color: string;
  font: string;
  fontFamily: string;
  fontWeight: number;
  hasText: boolean;
  height: number;
  padding: number;
  rotate: number;
  size: number;
  style: string;
  text: string;
  weight: number;
  x: number;
  x0: number;
  x1: number;
  xoff: number;
  y: number;
  y0: number;
  y1: number;
  yoff: number;
  datum: WordModel;
}

/** @public */
export interface Configs {
  count: number;
  endAngle: number;
  exponent: number;
  fontFamily: string;
  fontStyle: string;
  fontWeight: number;
  height: number;
  maxFontSize: number;
  minFontSize: number;
  padding: number;
  spiral: string;
  startAngle: number;
  weightFn: WeightFn;
  width: number;
}

/** @public */
export type OutOfRoomCallback = (wordCount: number, renderedWordCount: number, renderedWords: string[]) => void;

/** @internal */
export interface WordcloudViewModel {
  startAngle: number;
  endAngle: number;
  angleCount: number;
  padding: number;
  fontWeight: number;
  fontFamily: string;
  fontStyle: string;
  minFontSize: number;
  maxFontSize: number;
  spiral: string;
  exponent: number;
  data: WordModel[];
  weightFn: WeightFn;
  outOfRoomCallback: OutOfRoomCallback;
  // specType: string;
}

/** @internal */
export interface Datum {
  text: string;
  weight: number;
  color: string;
}

/** @internal */
export type PickFunction = (x: Pixels, y: Pixels) => Array<WordcloudViewModel>;

/** @internal */
export type ShapeViewModel = {
  config: Config;
  wordcloudViewModel: WordcloudViewModel;
  chartCenter: PointObject;
  pickQuads: PickFunction;
  specId: string;
};

const commonDefaults: WordcloudViewModel = {
  startAngle: -20,
  endAngle: 20,
  angleCount: 5,
  padding: 2,
  fontWeight: 300,
  fontFamily: 'Impact',
  fontStyle: 'italic',
  minFontSize: 10,
  maxFontSize: 50,
  spiral: 'archimedean',
  exponent: 3,
  data: [],
  weightFn: 'exponential',
  outOfRoomCallback: () => {},
};

/** @internal */
export const defaultWordcloudSpec = {
  ...commonDefaults,
};

/** @internal */
export const nullWordcloudViewModel: WordcloudViewModel = {
  ...commonDefaults,
  data: [],
};

/** @internal */
export const nullShapeViewModel = (specifiedConfig?: Config, chartCenter?: PointObject): ShapeViewModel => ({
  config: specifiedConfig || config,
  wordcloudViewModel: nullWordcloudViewModel,
  chartCenter: chartCenter || { x: 0, y: 0 },
  pickQuads: () => [],
  specId: 'empty',
});
