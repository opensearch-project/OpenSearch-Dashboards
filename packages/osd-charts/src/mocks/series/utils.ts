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

import { DataSeriesDatum } from '../../chart_types/xy_chart/utils/series';
import { getYValue } from '../../chart_types/xy_chart/rendering/rendering';

/**
 * Helper function to return array of rendered y1 values
 * @internal
 */
export const getFilledNullData = (data: DataSeriesDatum[]): (number | undefined)[] => {
  return data.filter(({ y1 }) => y1 === null).map(({ filled }) => filled && filled.y1);
};

/**
 * Helper function to return array of rendered y1 values
 * @internal
 */
export const getFilledNonNullData = (data: DataSeriesDatum[]): (number | undefined)[] => {
  return data.filter(({ y1 }) => y1 !== null).map(({ filled }) => filled && filled.y1);
};

/**
 * Helper function to return array of rendered x values
 * @internal
 */
export const getXValueData = (data: DataSeriesDatum[]): (number | string)[] => {
  return data.map(({ x }) => x);
};

/**
 * Returns value of `y1` or `filled.y1` or null
 * @internal
 */
export const getYResolvedData = (data: DataSeriesDatum[]): (number | null)[] => {
  return data.map(getYValue);
};
