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

import { createEnsureDefaultIndexPattern } from './ensure_default_index_pattern';
import { IndexPatternsContract } from './index_patterns';
import { SavedObjectsClientCommon, UiSettingsCommon } from '../types';

const mockUiSettingsGet = jest.fn();
const mockUiSettingsSet = jest.fn();
const mockUiSettings: UiSettingsCommon = ({
  get: mockUiSettingsGet,
  set: mockUiSettingsSet,
} as unknown) as UiSettingsCommon;

const mockSavedObjectsClientFind = jest.fn();
const mockSavedObjectsClientGet = jest.fn();
const mockSavedObjectsClient: SavedObjectsClientCommon = ({
  find: mockSavedObjectsClientFind,
  get: mockSavedObjectsClientGet,
} as unknown) as SavedObjectsClientCommon;

const mockOnRedirectNoIndexPattern = jest.fn();

const mockIndexPatternsContractGet = jest.fn();
const mockIndexPatternsContractGetDataSource = jest.fn();
const mockIndexPatternsContract: IndexPatternsContract = ({
  get: mockIndexPatternsContractGet,
  getDataSource: mockIndexPatternsContractGetDataSource,
} as unknown) as IndexPatternsContract;

describe('createEnsureDefaultIndexPattern', () => {
  let ensureDefaultIndexPattern: () => Promise<unknown | void>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve(null);
      if (key === 'query:enhancements:enabled') return Promise.resolve(false);
      return Promise.resolve(undefined);
    });
    mockUiSettingsSet.mockResolvedValue(undefined);
    mockSavedObjectsClientFind.mockResolvedValue([]);
    mockSavedObjectsClientGet.mockResolvedValue({});
    mockOnRedirectNoIndexPattern.mockResolvedValue(undefined);
    mockIndexPatternsContractGet.mockResolvedValue({ dataSourceRef: null });
    mockIndexPatternsContractGetDataSource.mockResolvedValue({});

    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      mockUiSettings,
      mockOnRedirectNoIndexPattern,
      true,
      mockSavedObjectsClient
    );
  });

  test('does nothing if canUpdateUiSetting is false', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      mockUiSettings,
      mockOnRedirectNoIndexPattern,
      false,
      mockSavedObjectsClient
    );

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).not.toHaveBeenCalled();
    expect(mockIndexPatternsContractGet).not.toHaveBeenCalled();
    expect(mockOnRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('does nothing if default index pattern is set and valid with local data source', async () => {
    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve('index-pattern-1');
      return Promise.resolve(undefined);
    });

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockIndexPatternsContractGet).toHaveBeenCalledWith('index-pattern-1');
    expect(mockIndexPatternsContractGetDataSource).not.toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
    expect(mockOnRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('does nothing if default index pattern is set and external data source is valid', async () => {
    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve('index-pattern-1');
      return Promise.resolve(undefined);
    });
    mockIndexPatternsContractGet.mockResolvedValue({
      dataSourceRef: { id: 'data-source-1' },
    });
    mockIndexPatternsContractGetDataSource.mockResolvedValue({ error: null });

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockIndexPatternsContractGet).toHaveBeenCalledWith('index-pattern-1');
    expect(mockIndexPatternsContractGetDataSource).toHaveBeenCalledWith('data-source-1');
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
    expect(mockOnRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('redirects or does nothing when no default index pattern is set', async () => {
    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve(null);
      if (key === 'query:enhancements:enabled') return Promise.resolve(false);
      return Promise.resolve(undefined);
    });
    mockSavedObjectsClientFind.mockResolvedValue([]);

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockUiSettingsGet).toHaveBeenCalledWith('query:enhancements:enabled');
    expect(mockSavedObjectsClientFind).not.toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
    expect(mockOnRedirectNoIndexPattern).toHaveBeenCalled();
  });

  test('redirects if no valid index patterns and enhancements are disabled', async () => {
    mockSavedObjectsClientFind.mockResolvedValue([]);

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockUiSettingsGet).toHaveBeenCalledWith('query:enhancements:enabled');
    expect(mockOnRedirectNoIndexPattern).toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
  });

  test('does not redirect if enhancements are enabled', async () => {
    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve(null);
      if (key === 'query:enhancements:enabled') return Promise.resolve(true);
      return Promise.resolve(undefined);
    });
    mockSavedObjectsClientFind.mockResolvedValue([]);

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockUiSettingsGet).toHaveBeenCalledWith('query:enhancements:enabled');
    expect(mockOnRedirectNoIndexPattern).not.toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
  });

  test('sets new default index pattern if default index pattern has invalid data source (403)', async () => {
    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve('index-pattern-1');
      return Promise.resolve(undefined);
    });
    mockIndexPatternsContractGet.mockResolvedValue({
      dataSourceRef: { id: 'data-source-1' },
    });
    mockIndexPatternsContractGetDataSource.mockResolvedValue({ error: { statusCode: 403 } });
    mockSavedObjectsClientFind
      .mockResolvedValueOnce([{ id: 'data-source-2' }])
      .mockResolvedValueOnce([
        { id: 'index-pattern-2', references: [{ id: 'data-source-2', type: 'data-source' }] },
      ]);

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockIndexPatternsContractGet).toHaveBeenCalledWith('index-pattern-1');
    expect(mockIndexPatternsContractGetDataSource).toHaveBeenCalledWith('data-source-1');
    expect(mockSavedObjectsClientFind).toHaveBeenCalledTimes(2);
    expect(mockUiSettingsSet).toHaveBeenCalledWith('defaultIndex', 'index-pattern-2');
    expect(mockOnRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('redirects if default index pattern has invalid data source and no other valid patterns', async () => {
    mockUiSettingsGet.mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve('index-pattern-1');
      return Promise.resolve(undefined);
    });
    mockIndexPatternsContractGet.mockResolvedValue({
      dataSourceRef: { id: 'data-source-1' },
    });
    mockIndexPatternsContractGetDataSource.mockResolvedValue({ error: { statusCode: 404 } });
    mockSavedObjectsClientFind.mockResolvedValue([]);

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockIndexPatternsContractGet).toHaveBeenCalledWith('index-pattern-1');
    expect(mockIndexPatternsContractGetDataSource).toHaveBeenCalledWith('data-source-1');
    expect(mockSavedObjectsClientFind).toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
    expect(mockOnRedirectNoIndexPattern).toHaveBeenCalled();
  });
});
