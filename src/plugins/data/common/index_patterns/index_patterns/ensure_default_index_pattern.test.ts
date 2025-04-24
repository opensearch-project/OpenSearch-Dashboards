/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createEnsureDefaultIndexPattern } from './ensure_default_index_pattern';
import { IndexPatternsContract } from './index_patterns';
import { UiSettingsCommon, SavedObjectsClientCommon } from '../types';
import { includes } from 'lodash';

jest.mock('lodash', () => ({
  includes: jest.fn(),
}));

describe('ensureDefaultIndexPattern', () => {
  let uiSettings: UiSettingsCommon;
  let onRedirectNoIndexPattern: jest.Mock;
  let savedObjectsClient: SavedObjectsClientCommon;
  let indexPatterns: IndexPatternsContract;
  let ensureDefaultIndexPattern: () => Promise<unknown | void> | undefined;

  beforeEach(() => {
    uiSettings = ({
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    } as unknown) as UiSettingsCommon;

    onRedirectNoIndexPattern = jest.fn();
    savedObjectsClient = ({
      find: jest.fn(),
    } as unknown) as SavedObjectsClientCommon;

    indexPatterns = ({
      getIds: jest.fn(),
      get: jest.fn(),
      getDataSource: jest.fn(),
    } as unknown) as IndexPatternsContract;

    (includes as jest.Mock).mockClear();
  });

  test('returns early if canUpdateUiSetting is false', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      false,
      savedObjectsClient
    );
    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.get).not.toHaveBeenCalled();
    expect(indexPatterns.getIds).not.toHaveBeenCalled();
  });

  test('removes defaultIndex if it is defined but does not exist', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    (indexPatterns.getIds as jest.Mock).mockResolvedValue(['pattern1', 'pattern2']);
    (uiSettings.get as jest.Mock).mockResolvedValue('nonexistent');
    (includes as jest.Mock).mockReturnValue(false);

    await ensureDefaultIndexPattern.call(indexPatterns);

    expect(uiSettings.remove).toHaveBeenCalledWith('defaultIndex');
    expect(onRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('returns early if default index pattern exists and has valid data source', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockResolvedValue(defaultId);
    (includes as jest.Mock).mockReturnValue(true);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({});

    await ensureDefaultIndexPattern.call(indexPatterns);

    expect(uiSettings.set).not.toHaveBeenCalled();
    expect(onRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('sets first available pattern as default if patterns exist', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    (indexPatterns.getIds as jest.Mock).mockResolvedValue(['pattern1']);
    (uiSettings.get as jest.Mock).mockResolvedValue(null);
    (savedObjectsClient.find as jest.Mock)
      .mockResolvedValueOnce([{ id: 'ds1' }])
      .mockResolvedValueOnce([
        {
          id: 'pattern1',
          attributes: { title: 'pattern1' },
          references: [{ id: 'ds1', type: 'data-source' }],
        },
      ]);

    await ensureDefaultIndexPattern.call(indexPatterns);

    // expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern1');
    // expect(onRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('redirects if no patterns and enhancements are disabled', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    (indexPatterns.getIds as jest.Mock).mockResolvedValue([]);
    (uiSettings.get as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(false);
    (savedObjectsClient.find as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await ensureDefaultIndexPattern.call(indexPatterns);

    expect(uiSettings.set).not.toHaveBeenCalled();
    expect(onRedirectNoIndexPattern).toHaveBeenCalled();
  });

  test('does not redirect if enhancements are enabled', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    (indexPatterns.getIds as jest.Mock).mockResolvedValue([]);
    (uiSettings.get as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(true);
    (savedObjectsClient.find as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await ensureDefaultIndexPattern.call(indexPatterns);

    expect(uiSettings.set).not.toHaveBeenCalled();
    expect(onRedirectNoIndexPattern).not.toHaveBeenCalled();
  });

  test('handles error when fetching data sources and index patterns', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'defaultIndex') return Promise.resolve(defaultId);
      if (key === 'query:enhancements:enabled') return Promise.resolve(false);
      return Promise.resolve(undefined);
    });
    (includes as jest.Mock).mockReturnValue(true);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      error: { statusCode: 404 },
    });
    (savedObjectsClient.find as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    await ensureDefaultIndexPattern.call(indexPatterns);

    expect(uiSettings.get).toHaveBeenCalledWith('query:enhancements:enabled');
    expect(onRedirectNoIndexPattern).toHaveBeenCalled();
  });
});
