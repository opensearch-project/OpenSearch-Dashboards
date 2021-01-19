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

import { Spec } from '.';
import { ChartTypes } from '../chart_types';
import { getConnect, specComponentFactory } from '../state/spec_factory';
import { SpecTypes } from './constants';

/** @internal */
export const DEFAULT_SM_PANEL_PADDING: [number, number] = [0, 0.1];

/** @alpha */
export interface SmallMultiplesSpec extends Spec {
  splitHorizontally?: string;
  splitVertically?: string;
  style?: {
    verticalPanelPadding?: [number, number];
    horizontalPanelPadding?: [number, number];
  };
}

const DEFAULT_SMALL_MULTIPLES_PROPS = {
  id: '__global__small_multiples___',
  chartType: ChartTypes.Global,
  specType: SpecTypes.SmallMultiples,
};

/** @alpha */
export type SmallMultiplesProps = Partial<Omit<SmallMultiplesSpec, 'id' | 'chatType' | 'specType'>>;

/** @alpha */
export const SmallMultiples: React.FunctionComponent<SmallMultiplesProps> = getConnect()(
  specComponentFactory<SmallMultiplesSpec, 'id'>(DEFAULT_SMALL_MULTIPLES_PROPS),
);
