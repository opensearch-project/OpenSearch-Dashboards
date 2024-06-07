/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { UI_SETTINGS } from '../../../constants';
import { createDataFrame } from '../../../data_frames/utils';
import {
  GetConfigFn,
  GetDataFrameFn,
  GetDataFrameBySourceFn,
  SetDataFrameFn,
  DestroyDataFrameFn,
  // GetSessionFn,
} from '../../../types';
import { ISearchRequestParams } from '../../index';
import { SearchRequest } from './types';

const sessionId = Date.now();

export function getSearchParams(getConfig: GetConfigFn) {
  return {
    preference: getPreference(getConfig),
  };
}

export function getPreference(getConfig: GetConfigFn) {
  const setRequestPreference = getConfig(UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE);
  if (setRequestPreference === 'sessionId') return sessionId;
  return setRequestPreference === 'custom'
    ? getConfig(UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE)
    : undefined;
}

export async function getExternalSearchParamsFromRequest(
  searchRequest: SearchRequest,
  dependencies: {
    getConfig: GetConfigFn;
    getDataFrame: GetDataFrameFn;
    getDataFrameBySource: GetDataFrameBySourceFn;
    setDataFrame: SetDataFrameFn;
  }
): Promise<ISearchRequestParams> {
  const { getConfig, getDataFrame, getDataFrameBySource, setDataFrame } = dependencies;
  const searchParams = getSearchParams(getConfig);
  // TODO: MQL Datasources: We should probably setting the data source in the search source index.
  const indexTitle = searchRequest.index.title || searchRequest.index;
  const dataSource = searchRequest.dataSource;
  // TODO: MQL Async: Verify
  // Checks if df exists if not then checks if it exists in dataframes cache. If not then creates a new one.
  // However, TODO: need to fix the df creation to not get mappings for fields for index when creating the temp index pattern if not 'default'
  const dataFrame =
    getDataFrame() ??
    (dataSource?.name ? getDataFrameBySource(dataSource.name) : null) ??
    (await setDataFrame(createDataFrame({ name: dataSource?.name ?? '', fields: [] })));

  return {
    index: indexTitle,
    body: {
      ...searchRequest.body,
      ...(dataFrame ? { df: dataFrame } : {}),
    },
    ...searchParams,
  };
}

/** @public */
// TODO: Could provide this on runtime contract with dependencies
// already wired up.
export function getSearchParamsFromRequest(
  searchRequest: SearchRequest,
  dependencies: {
    getConfig: GetConfigFn;
    getDataFrame?: GetDataFrameFn;
    destroyDataFrame?: DestroyDataFrameFn;
  }
): ISearchRequestParams {
  const { getConfig, getDataFrame, destroyDataFrame } = dependencies;
  const searchParams = getSearchParams(getConfig);

  if (getDataFrame && destroyDataFrame) {
    if (getDataFrame()) {
      delete searchRequest.body.df;
      delete searchRequest.indexType;
      destroyDataFrame();
    }
  }

  return {
    index: searchRequest.index.title || searchRequest.index,
    body: searchRequest.body,
    ...searchParams,
  };
}
