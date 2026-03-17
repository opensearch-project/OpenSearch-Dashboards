/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpSetup,
  IUiSettingsClient,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import { createPplGrammarWarmupHandler } from './ppl_grammar_warmup';

describe('ppl_grammar_warmup', () => {
  const http = ({} as unknown) as HttpSetup;
  const uiSettings = ({ get: jest.fn().mockReturnValue(true) } as unknown) as IUiSettingsClient;
  const savedObjectsClient = ({} as unknown) as SavedObjectsClientContract;

  const createCacheMock = () => ({
    warmUp: jest.fn(),
  });

  it('should skip warm-up when language is not PPL', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'SQL',
      dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } },
    });

    expect(cache.warmUp).not.toHaveBeenCalled();
  });

  it('should skip warm-up when no dataset is selected', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({ language: 'PPL' });

    expect(cache.warmUp).not.toHaveBeenCalled();
  });

  it('should warm up for local cluster dataset without datasource id', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({ language: 'PPL', dataset: {} });

    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      undefined,
      undefined
    );
  });

  it('should warm up for the first selected datasource', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } },
    });

    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      'ds-1',
      '3.6.0'
    );
  });

  it('should forward repeated calls for the same datasource (cache handles dedup)', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    const selected = {
      language: 'PPL_Simplified',
      dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } },
    };

    handler(selected);
    handler(selected);

    // Handler forwards both calls; cache.warmUp itself deduplicates
    expect(cache.warmUp).toHaveBeenCalledTimes(2);
  });

  it('should forward calls when datasource id changes (cache auto-clears)', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } },
    });
    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-2', version: '3.6.0' } },
    });

    expect(cache.warmUp).toHaveBeenCalledTimes(2);
    expect(cache.warmUp).toHaveBeenLastCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      'ds-2',
      '3.6.0'
    );
  });

  it('should forward to warmUp even when version is old (cache handles version gating)', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-old', version: '2.17.0' } },
    });

    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      'ds-old',
      '2.17.0'
    );
  });

  it('should warm up when version is not provided (needs lookup)', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-unknown' } },
    });

    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      'ds-unknown',
      undefined
    );
  });

  it('should forward warmUp through rapid multi-datasource switching', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    // Simulate rapid switching: ds-1 (3.6) → ds-2 (2.17) → ds-3 (3.7) → localhost
    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });
    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-2', version: '2.17.0' } } });
    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-3', version: '3.7.0' } } });
    handler({ language: 'PPL', dataset: {} }); // localhost

    expect(cache.warmUp).toHaveBeenCalledTimes(4);
    expect(cache.warmUp).toHaveBeenNthCalledWith(
      1,
      http,
      uiSettings,
      savedObjectsClient,
      'ds-1',
      '3.6.0'
    );
    expect(cache.warmUp).toHaveBeenNthCalledWith(
      2,
      http,
      uiSettings,
      savedObjectsClient,
      'ds-2',
      '2.17.0'
    );
    expect(cache.warmUp).toHaveBeenNthCalledWith(
      3,
      http,
      uiSettings,
      savedObjectsClient,
      'ds-3',
      '3.7.0'
    );
    expect(cache.warmUp).toHaveBeenNthCalledWith(
      4,
      http,
      uiSettings,
      savedObjectsClient,
      undefined,
      undefined
    );
  });

  it('should not call warmUp when language changes away from PPL', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });
    handler({ language: 'SQL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });
    handler({ language: 'DQL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });

    expect(cache.warmUp).toHaveBeenCalledTimes(1); // only the PPL call
  });

  it('should handle dataset with dataSource object but no id or version', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({ language: 'PPL', dataset: { dataSource: {} } });

    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      undefined,
      undefined
    );
  });

  it('should handle multiple datasets from the same remote datasource', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    // Different datasets (different index patterns) but same datasource
    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });
    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });
    handler({ language: 'PPL', dataset: { dataSource: { id: 'ds-1', version: '3.6.0' } } });

    // Handler forwards all; cache deduplicates
    expect(cache.warmUp).toHaveBeenCalledTimes(3);
    // All calls use the same datasource id
    for (const call of cache.warmUp.mock.calls) {
      expect(call[3]).toBe('ds-1');
    }
  });

  it('should skip warmUp when query is null or undefined', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler(null as any);
    handler(undefined as any);
    handler({});

    expect(cache.warmUp).not.toHaveBeenCalled();
  });

  it('should handle SNAPSHOT versions from dataset', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-snap', version: '3.6.0-SNAPSHOT' } },
    });

    expect(cache.warmUp).toHaveBeenCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      'ds-snap',
      '3.6.0-SNAPSHOT'
    );
  });

  it('should forward warmUp when switching to old-version datasource (cache auto-clears)', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, uiSettings, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-new', version: '3.6.0' } },
    });
    handler({
      language: 'PPL',
      dataset: { dataSource: { id: 'ds-old', version: '2.17.0' } },
    });

    expect(cache.warmUp).toHaveBeenCalledTimes(2);
    expect(cache.warmUp).toHaveBeenLastCalledWith(
      http,
      uiSettings,
      savedObjectsClient,
      'ds-old',
      '2.17.0'
    );
  });
});
