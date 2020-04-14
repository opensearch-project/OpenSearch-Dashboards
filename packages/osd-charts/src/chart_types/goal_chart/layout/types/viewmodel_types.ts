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

import { Config } from './config_types';

import { Pixels, PointObject } from '../../../partition_chart/layout/types/geometry_types';
import { config } from '../config/config';
import { SpecTypes } from '../../../../specs/settings';
import { BandFillColorAccessorInput, GOAL_SUBTYPES } from '../../specs/index';

interface BandViewModel {
  value: number;
  fillColor: string;
}

interface TickViewModel {
  value: number;
  text: string;
}

/** @internal */
export interface BulletViewModel {
  subtype: string;
  base: number;
  target: number;
  actual: number;
  bands: Array<BandViewModel>;
  ticks: Array<TickViewModel>;
  labelMajor: string;
  labelMinor: string;
  centralMajor: string;
  centralMinor: string;
  highestValue: number;
  lowestValue: number;
  aboveBaseCount: number;
  belowBaseCount: number;
}

/** @internal */
export type PickFunction = (x: Pixels, y: Pixels) => Array<BulletViewModel>;

/** @internal */
export type ShapeViewModel = {
  config: Config;
  bulletViewModel: BulletViewModel;
  chartCenter: PointObject;
  pickQuads: PickFunction;
};

const commonDefaults = {
  specType: SpecTypes.Series,
  subtype: GOAL_SUBTYPES[0],
  base: 0,
  target: 100,
  actual: 50,
  ticks: [0, 25, 50, 75, 100],
};

/** @internal */
export const defaultGoalSpec = {
  ...commonDefaults,
  bands: [50, 75, 100],
  bandFillColor: ({ value, base, highestValue, lowestValue }: BandFillColorAccessorInput) => {
    const aboveBase = value > base;
    const ratio = aboveBase
      ? (value - base) / (Math.max(base, highestValue) - base)
      : (value - base) / (Math.min(base, lowestValue) - base);
    const level = Math.round(255 * ratio);
    return aboveBase ? `rgb(0, ${level}, 0)` : `rgb( ${level}, 0, 0)`;
  },
  tickValueFormatter: ({ value }: BandFillColorAccessorInput) => String(value),
  labelMajor: ({ base }: BandFillColorAccessorInput) => String(base),
  labelMinor: ({}: BandFillColorAccessorInput) => 'unit',
  centralMajor: ({ base }: BandFillColorAccessorInput) => String(base),
  centralMinor: ({ target }: BandFillColorAccessorInput) => String(target),
};

/** @internal */
export const nullGoalViewModel = {
  ...commonDefaults,
  bands: [],
  ticks: [],
  labelMajor: '',
  labelMinor: '',
  centralMajor: '',
  centralMinor: '',
  highestValue: 100,
  lowestValue: 0,
  aboveBaseCount: 0,
  belowBaseCount: 0,
};

/** @internal */
export const nullShapeViewModel = (specifiedConfig?: Config, chartCenter?: PointObject): ShapeViewModel => ({
  config: specifiedConfig || config,
  bulletViewModel: nullGoalViewModel,
  chartCenter: chartCenter || { x: 0, y: 0 },
  pickQuads: () => [],
});
