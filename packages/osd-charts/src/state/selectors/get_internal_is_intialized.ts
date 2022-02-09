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

import { $Values } from 'utility-types';

import { GlobalChartState } from '../chart_state';

/** @internal */
export const InitStatus = Object.freeze({
  ParentSizeInvalid: 'ParentSizeInvalid' as const,
  SpecNotInitialized: 'SpecNotInitialized' as const,
  MissingChartType: 'MissingChartType' as const,
  ChartNotInitialized: 'ChartNotInitialized' as const,
  Initialized: 'Initialized' as const,
});

/** @internal */
export type InitStatus = $Values<typeof InitStatus>;

/** @internal */
export const getInternalIsInitializedSelector = (state: GlobalChartState): InitStatus => {
  const {
    parentDimensions: { width, height },
    specsInitialized,
    internalChartState,
  } = state;

  if (!specsInitialized) {
    return InitStatus.SpecNotInitialized;
  }

  if (!internalChartState) {
    return InitStatus.MissingChartType;
  }

  if (width <= 0 || height <= 0) {
    return InitStatus.ParentSizeInvalid;
  }

  return internalChartState.isInitialized(state);
};
