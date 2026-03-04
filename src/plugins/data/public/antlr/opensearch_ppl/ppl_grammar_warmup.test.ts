/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { createPplGrammarWarmupHandler } from './ppl_grammar_warmup';

describe('ppl_grammar_warmup', () => {
  const http = ({} as unknown) as HttpSetup;
  const savedObjectsClient = ({} as unknown) as SavedObjectsClientContract;

  const createCacheMock = () => ({
    invalidate: jest.fn(),
    warmUp: jest.fn(),
  });

  it('should skip warm-up when language is not PPL', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    handler({
      language: 'SQL',
      dataset: {
        dataSource: {
          id: 'ds-1',
          version: '3.6.0',
        },
      },
    });

    expect(cache.invalidate).not.toHaveBeenCalled();
    expect(cache.warmUp).not.toHaveBeenCalled();
  });

  it('should skip warm-up when PPL query has no selected dataset', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    handler({
      language: 'PPL',
    });

    expect(cache.invalidate).not.toHaveBeenCalled();
    expect(cache.warmUp).not.toHaveBeenCalled();
  });

  it('should warm up once for the first selected datasource', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: {
        dataSource: {
          id: 'ds-1',
          version: '3.6.0',
        },
      },
    });

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(cache.invalidate).toHaveBeenCalledWith('ds-1');
    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(http, savedObjectsClient, 'ds-1', '3.6.0');
  });

  it('should not re-warm when datasource id and version are unchanged', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    const selected = {
      language: 'PPL_Simplified',
      dataset: {
        dataSource: {
          id: 'ds-1',
          version: '3.6.0',
        },
      },
    };

    handler(selected);
    handler(selected);

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledTimes(1);
  });

  it('should not re-warm when datasource id is unchanged and version is unavailable', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    const selected = {
      language: 'PPL',
      dataset: {
        dataSource: {
          id: 'ds-1',
        },
      },
    };

    handler(selected);
    handler(selected);

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledTimes(1);
    expect(cache.warmUp).toHaveBeenCalledWith(http, savedObjectsClient, 'ds-1', undefined);
  });

  it('should re-warm when datasource version changes', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: {
        dataSource: {
          id: 'ds-1',
          version: '3.6.0',
        },
      },
    });
    handler({
      language: 'PPL',
      dataset: {
        dataSource: {
          id: 'ds-1',
          version: '3.7.0',
        },
      },
    });

    expect(cache.invalidate).toHaveBeenCalledTimes(2);
    expect(cache.warmUp).toHaveBeenCalledTimes(2);
    expect(cache.warmUp).toHaveBeenLastCalledWith(http, savedObjectsClient, 'ds-1', '3.7.0');
  });

  it('should re-warm when datasource id changes', () => {
    const cache = createCacheMock();
    const handler = createPplGrammarWarmupHandler(http, savedObjectsClient, cache);

    handler({
      language: 'PPL',
      dataset: {
        dataSource: {
          id: 'ds-1',
          version: '3.6.0',
        },
      },
    });
    handler({
      language: 'PPL',
      dataset: {
        dataSource: {
          id: 'ds-2',
          version: '3.6.0',
        },
      },
    });

    expect(cache.invalidate).toHaveBeenCalledTimes(2);
    expect(cache.warmUp).toHaveBeenCalledTimes(2);
    expect(cache.warmUp).toHaveBeenLastCalledWith(http, savedObjectsClient, 'ds-2', '3.6.0');
  });
});
