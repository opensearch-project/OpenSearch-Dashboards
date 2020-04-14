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

import { ChartTypes } from '../../index';
import { config } from '../layout/config/config';
import { FunctionComponent } from 'react';
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { Spec, SpecTypes } from '../../../specs/index';
import { Config } from '../layout/types/config_types';
import { defaultGoalSpec } from '../layout/types/viewmodel_types';
import { Color, RecursivePartial } from '../../../utils/commons';

export const GOAL_SUBTYPES = Object.freeze(['goal', 'horizontalBullet', 'verticalBullet'] as const);
export type GoalSubtype = typeof GOAL_SUBTYPES[number];

export interface BandFillColorAccessorInput {
  value: number;
  index: number;
  base: number;
  target: number;
  highestValue: number;
  lowestValue: number;
  aboveBaseCount: number;
  belowBaseCount: number;
}

/** @alpha */
export type BandFillColorAccessor = (input: BandFillColorAccessorInput) => Color;

const defaultProps = {
  chartType: ChartTypes.Goal,
  specType: SpecTypes.Series,
  ...defaultGoalSpec,
  config,
};

/** @alpha */
export interface GoalSpec extends Spec {
  specType: typeof SpecTypes.Series;
  chartType: typeof ChartTypes.Goal;
  subtype: GoalSubtype;
  base: number;
  target: number;
  actual: number;
  bands: number[];
  ticks: number[];
  bandFillColor: BandFillColorAccessor;
  tickValueFormatter: BandFillColorAccessor;
  labelMajor: string | BandFillColorAccessor;
  labelMinor: string | BandFillColorAccessor;
  centralMajor: string | BandFillColorAccessor;
  centralMinor: string | BandFillColorAccessor;
  config: RecursivePartial<Config>;
}

type SpecRequiredProps = Pick<GoalSpec, 'id' | 'actual'>;
type SpecOptionalProps = Partial<Omit<GoalSpec, 'chartType' | 'specType' | 'id' | 'data'>>;

/** @alpha */
export const Goal: FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<
    GoalSpec,
    | 'config'
    | 'chartType'
    | 'subtype'
    | 'base'
    | 'target'
    | 'actual'
    | 'bands'
    | 'ticks'
    | 'bandFillColor'
    | 'tickValueFormatter'
    | 'labelMajor'
    | 'labelMinor'
    | 'centralMajor'
    | 'centralMinor'
  >(defaultProps),
);
