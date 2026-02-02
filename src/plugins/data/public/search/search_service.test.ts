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

import { coreMock } from '../../../../core/public/mocks';
import { CoreSetup, CoreStart } from '../../../../core/public';

import { SearchService, SearchServiceSetupDependencies } from './search_service';
import { IOpenSearchDashboardsSearchRequest } from '../../common';

describe('Search service', () => {
  let searchService: SearchService;
  let mockCoreSetup: MockedKeys<CoreSetup>;
  let mockCoreStart: MockedKeys<CoreStart>;
  const initializerContext = coreMock.createPluginInitializerContext();
  initializerContext.config.get = jest.fn().mockReturnValue({
    search: { aggs: { shardDelay: { enabled: false } } },
  });

  beforeEach(() => {
    mockCoreSetup = coreMock.createSetup();
    mockCoreStart = coreMock.createStart();
    searchService = new SearchService(initializerContext);
  });

  describe('setup()', () => {
    it('exposes proper contract', async () => {
      const setup = searchService.setup(mockCoreSetup, ({
        packageInfo: { version: '8' },
        expressions: { registerFunction: jest.fn(), registerType: jest.fn() },
      } as unknown) as SearchServiceSetupDependencies);
      expect(setup).toHaveProperty('aggs');
      expect(setup).toHaveProperty('usageCollector');
      expect(setup).toHaveProperty('__enhance');
    });
  });

  describe('start()', () => {
    it('exposes proper contract', async () => {
      const start = searchService.start(mockCoreStart, {
        fieldFormats: {},
        indexPatterns: {},
      } as any);
      expect(start).toHaveProperty('aggs');
      expect(start).toHaveProperty('search');
      expect(start).toHaveProperty('searchSource');
    });
  });

  describe('getLanguageId', () => {
    const getLanguageId = (request: IOpenSearchDashboardsSearchRequest) => {
      return (searchService as any).getLanguageId(request);
    };

    it('returns language from query.queries[0].language when available', () => {
      const request = {
        params: { body: { query: { queries: [{ language: 'PPL' }] } } },
      } as IOpenSearchDashboardsSearchRequest;

      expect(getLanguageId(request)).toBe('PPL');
    });

    it('returns "kuery" when query.bool is present', () => {
      const request = {
        params: { body: { query: { bool: { must: [] } } } },
      } as IOpenSearchDashboardsSearchRequest;

      expect(getLanguageId(request)).toBe('kuery');
    });

    it('returns undefined when neither query.queries[0].language nor query.bool is present', () => {
      const request = { params: { body: { query: {} } } } as IOpenSearchDashboardsSearchRequest;

      expect(getLanguageId(request)).toBeUndefined();
    });

    it('returns undefined when request.params.body.query has empty queries array', () => {
      const request = {
        params: { body: { query: { queries: [] } } },
      } as IOpenSearchDashboardsSearchRequest;

      expect(getLanguageId(request)).toBeUndefined();
    });
  });
});
