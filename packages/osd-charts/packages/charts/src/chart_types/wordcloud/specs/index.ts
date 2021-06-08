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

import React from 'react';

import { ChartType } from '../..';
import { Spec } from '../../../specs';
import { SpecType } from '../../../specs/constants';
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { RecursivePartial } from '../../../utils/common';
import { config } from '../layout/config/config';
import {
  WordModel,
  defaultWordcloudSpec,
  WeightFn,
  OutOfRoomCallback,
  Configs as WordcloudConfigs,
} from '../layout/types/viewmodel_types';

const defaultProps = {
  chartType: ChartType.Wordcloud,
  specType: SpecType.Series,
  ...defaultWordcloudSpec,
  config,
};

export { WordModel, WeightFn, OutOfRoomCallback, WordcloudConfigs };

/** @alpha */
export interface WordcloudSpec extends Spec {
  specType: typeof SpecType.Series;
  chartType: typeof ChartType.Wordcloud;
  config: RecursivePartial<WordcloudConfigs>;
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
}

type SpecRequiredProps = Pick<WordcloudSpec, 'id'>;
type SpecOptionalProps = Partial<Omit<WordcloudSpec, 'chartType' | 'specType' | 'id'>>;

/** @alpha */
export const Wordcloud: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<
    WordcloudSpec,
    | 'chartType'
    | 'startAngle'
    | 'config'
    | 'endAngle'
    | 'angleCount'
    | 'padding'
    | 'fontWeight'
    | 'fontFamily'
    | 'fontStyle'
    | 'minFontSize'
    | 'maxFontSize'
    | 'spiral'
    | 'exponent'
    | 'data'
    | 'weightFn'
    | 'outOfRoomCallback'
  >(defaultProps),
);
