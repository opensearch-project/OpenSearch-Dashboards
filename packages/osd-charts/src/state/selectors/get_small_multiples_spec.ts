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

import createCachedSelector from 're-reselect';

import { ChartType } from '../../chart_types';
import { SpecType } from '../../specs/constants';
import { SmallMultiplesSpec } from '../../specs/small_multiples';
import { getSpecsFromStore } from '../utils';
import { getChartIdSelector } from './get_chart_id';
import { getSpecs } from './get_settings_specs';

/**
 * Return the small multiple specs
 * @internal
 */
export const getSmallMultiplesSpecs = createCachedSelector([getSpecs], (specs) =>
  getSpecsFromStore<SmallMultiplesSpec>(specs, ChartType.Global, SpecType.SmallMultiples),
)(getChartIdSelector);

/**
 * Return the small multiple spec
 * @internal
 */
export const getSmallMultiplesSpec = createCachedSelector([getSmallMultiplesSpecs], (smallMultiples) =>
  smallMultiples.length === 1 ? smallMultiples : undefined,
)(getChartIdSelector);
