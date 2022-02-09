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

import { ChartType } from '../chart_types';

/** @public */
export interface Spec {
  /** unique Spec identifier */
  id: string;
  /** Chart type define the type of chart that use this spec */
  chartType: ChartType;
  /** The type of spec, can be series, axis, annotation, settings etc */
  specType: string;
}

export * from './group_by';
export * from './small_multiples';
export * from './settings';
export * from './constants';
export * from '../chart_types/specs';
