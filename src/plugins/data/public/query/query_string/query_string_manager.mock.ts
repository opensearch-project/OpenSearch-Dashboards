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

import { of } from 'rxjs';
import { QueryStringContract } from '.';
import { Query, Dataset } from '../../../common';
import { datasetServiceMock } from './dataset_service/dataset_service.mock';
import { languageServiceMock } from './language_service/language_service.mock';

const createSetupContractMock = (isEnhancementsEnabled: boolean = false) => {
  const datasetService = datasetServiceMock.createSetupContract();
  const languageService = languageServiceMock.createSetupContract();

  const defaultQuery: Query = {
    query: '',
    language: 'kuery',
    ...(isEnhancementsEnabled ? { dataset: datasetService.getDefault() } : {}),
  };

  const queryStringManagerMock: jest.Mocked<QueryStringContract> = {
    getQuery: jest.fn().mockReturnValue(defaultQuery),
    setQuery: jest.fn(),
    getUpdates$: jest.fn().mockReturnValue(of(defaultQuery)),
    getDefaultQuery: jest.fn().mockReturnValue(defaultQuery),
    formatQuery: jest.fn(),
    clearQuery: jest.fn(),
    addToQueryHistory: jest.fn(),
    getQueryHistory: jest.fn().mockReturnValue([]),
    clearQueryHistory: jest.fn(),
    changeQueryHistory: jest.fn().mockReturnValue(() => {}),
    getInitialQuery: jest.fn().mockReturnValue(defaultQuery),
    getInitialQueryByLanguage: jest.fn().mockReturnValue(defaultQuery),
    getDatasetService: jest.fn().mockReturnValue(datasetService),
    getLanguageService: jest.fn().mockReturnValue(languageService),
    getInitialQueryByDataset: jest.fn().mockImplementation((newDataset: Dataset) => ({
      ...defaultQuery,
      dataset: newDataset,
    })),
  };

  return queryStringManagerMock;
};

export const queryStringManagerMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createSetupContractMock,
};
