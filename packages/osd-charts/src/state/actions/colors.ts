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

import { SeriesKey } from '../../commons/series_id';
import { Color } from '../../utils/commons';

/** @internal */
export const CLEAR_TEMPORARY_COLORS = 'CLEAR_TEMPORARY_COLORS';

/** @internal */
export const SET_TEMPORARY_COLOR = 'SET_TEMPORARY_COLOR';

/** @internal */
export const SET_PERSISTED_COLOR = 'SET_PERSISTED_COLOR';

interface ClearTemporaryColors {
  type: typeof CLEAR_TEMPORARY_COLORS;
}

interface SetTemporaryColor {
  type: typeof SET_TEMPORARY_COLOR;
  key: SeriesKey;
  color: Color;
}

interface SetPersistedColor {
  type: typeof SET_PERSISTED_COLOR;
  key: SeriesKey;
  color: Color;
}

/** @internal */
export function clearTemporaryColors(): ClearTemporaryColors {
  return { type: CLEAR_TEMPORARY_COLORS };
}

/** @internal */
export function setTemporaryColor(key: SeriesKey, color: Color): SetTemporaryColor {
  return { type: SET_TEMPORARY_COLOR, key, color };
}

/** @internal */
export function setPersistedColor(key: SeriesKey, color: Color): SetPersistedColor {
  return { type: SET_PERSISTED_COLOR, key, color };
}

/** @internal */
export type ColorsActions = ClearTemporaryColors | SetTemporaryColor | SetPersistedColor;
