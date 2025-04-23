/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
    mockUiSettingsGet.mockResolvedValueOnce('index-pattern-1');
    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);
    expect(mockUiSettingsGet).toHaveBeenCalledWith('defaultIndex');
    expect(mockIndexPatternsContractGet).toHaveBeenCalledWith('index-pattern-1');
    expect(mockIndexPatternsContractGetDataSource).not.toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
    expect(mockOnRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('does nothing if default index pattern is set and external data source is valid', async () => {
    mockUiSettingsGet.mockResolvedValueOnce('index-pattern-1');
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

  test('redirects when no default index pattern is set', async () => {
    mockSavedObjectsClientFind.mockResolvedValue([]);
    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);
    expect(mockOnRedirectNoIndexPattern).toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
  });

  test('redirects if no valid index patterns and enhancements are disabled', async () => {
    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);
    expect(mockOnRedirectNoIndexPattern).toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
  });

  test('does not redirect if enhancements are enabled', async () => {
    mockUiSettingsGet.mockResolvedValueOnce(null);
    mockUiSettingsGet.mockResolvedValueOnce(true);
    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

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
    mockUiSettingsGet.mockResolvedValueOnce('index-pattern-1');
    mockIndexPatternsContractGet.mockResolvedValue({
      dataSourceRef: { id: 'data-source-1' },
    });
    mockIndexPatternsContractGetDataSource.mockResolvedValue({ error: { statusCode: 404 } });
    mockSavedObjectsClientFind.mockResolvedValue([]);

    await ensureDefaultIndexPattern.call(mockIndexPatternsContract);

    expect(mockOnRedirectNoIndexPattern).toHaveBeenCalled();
    expect(mockUiSettingsSet).not.toHaveBeenCalled();
  });
});
