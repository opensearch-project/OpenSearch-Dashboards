/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isSignalTypeCompatible,
  getRequiredSignalType,
  queryExecution,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
  showMissingDatasetWarning,
  handleAgentError,
  resolveDatasetLanguage,
  getInitialQueryString,
} from './utils';
import { SupportLanguageType } from './query_builder';
import type { Dataset } from '../../../../../data/common';
import type { QueryStringContract } from '../../../../../data/public';
import { AgentError, ProhibitedQueryError } from '../../../components/query_panel/utils/error';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import {
  createSearchSourceWithQuery,
  shouldSkipQueryExecution,
} from '../../../application/utils/state_management/actions/query_actions';

jest.mock('./query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));

jest.mock('../../../application/utils/state_management/utils/redux_persistence', () => ({
  fetchFirstAvailableDataset: jest.fn(),
}));

jest.mock('../../../application/utils/state_management/actions/query_actions', () => ({
  createSearchSourceWithQuery: jest.fn(),
  shouldSkipQueryExecution: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getResponseInspectorStats: jest.fn().mockReturnValue({}),
}));

const mockToasts = {
  addWarning: jest.fn(),
  addError: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('isSignalTypeCompatible', () => {
  it('returns true when signal type matches required', () => {
    expect(isSignalTypeCompatible('metrics', 'metrics')).toBe(true);
  });

  it('returns false when signal type does not match required', () => {
    expect(isSignalTypeCompatible('logs', 'metrics')).toBe(false);
  });
});

describe('getRequiredSignalType', () => {
  it('returns METRICS for promQL', () => {
    expect(getRequiredSignalType(SupportLanguageType.promQL)).toBe('metrics');
  });

  it('returns LOGS and TRACES for ppl', () => {
    expect(getRequiredSignalType(SupportLanguageType.ppl)).toEqual(['logs', 'traces']);
  });
});

describe('toast helpers', () => {
  it('calls addWarning for showPromptModeNotAvailableWarning', () => {
    showPromptModeNotAvailableWarning(mockToasts as any);
    expect(mockToasts.addWarning).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'queryAssist-not-available' })
    );
  });

  it('calls addWarning for showMissingPromptWarning', () => {
    showMissingPromptWarning(mockToasts as any);
    expect(mockToasts.addWarning).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'missing-prompt-warning' })
    );
  });

  it('calls addWarning for showMissingDatasetWarning', () => {
    showMissingDatasetWarning(mockToasts as any);
    expect(mockToasts.addWarning).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'missing-dataset-warning' })
    );
  });
});

describe('handleAgentError', () => {
  it('calls addError for ProhibitedQueryError', () => {
    handleAgentError(mockToasts as any, new ProhibitedQueryError('blocked'));
    expect(mockToasts.addError).toHaveBeenCalledWith(
      expect.any(ProhibitedQueryError),
      expect.objectContaining({ id: 'prohibited-query-error' })
    );
  });

  it('calls addError for AgentError', () => {
    const agentError = new AgentError({
      error: { reason: 'r', details: 'd', type: 't' },
      status: 500,
    });
    handleAgentError(mockToasts as any, agentError);
    expect(mockToasts.addError).toHaveBeenCalledWith(
      expect.any(AgentError),
      expect.objectContaining({ id: 'agent-error' })
    );
  });

  it('calls addError with miscellaneous-prompt-error id for generic errors', () => {
    handleAgentError(mockToasts as any, new Error('oops'));
    expect(mockToasts.addError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ id: 'miscellaneous-prompt-error' })
    );
  });
});

const mockDataset = { id: 'ds1', title: 'my-index', type: 'INDEX_PATTERN' };

const buildServices = () =>
  ({
    data: {
      query: {
        getDefaultDataset: jest.fn().mockResolvedValue(undefined),
        queryString: {
          getQuery: jest.fn().mockReturnValue({ dataset: mockDataset, language: 'PPL' }),
          getDefaultQuery: jest.fn().mockReturnValue({}),
          getInitialQueryByDataset: jest
            .fn()
            .mockReturnValue({ query: '', language: 'PPL', dataset: mockDataset }),
        },
      },
      dataViews: {
        get: jest.fn().mockResolvedValue({ signalType: undefined }),
        ensureDefaultDataView: jest.fn().mockResolvedValue(undefined),
        getDefault: jest.fn().mockResolvedValue({ id: 'default' }),
        convertToDataset: jest.fn().mockReturnValue(mockDataset),
      },
    },
    inspectorAdapters: {
      requests: {
        reset: jest.fn(),
        start: jest.fn().mockReturnValue({
          stats: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
          ok: jest.fn().mockReturnThis(),
          getTime: jest.fn().mockReturnValue(100),
        }),
      },
    },
    uiSettings: { get: jest.fn().mockResolvedValue(false) },
    notifications: { toasts: { addError: jest.fn() } },
  }) as any;

describe('queryExecution', () => {
  const emptyQuery = { query: '', language: SupportLanguageType.ppl };
  const updateEditorStateFn = jest.fn();
  const updateResultFn = jest.fn();
  let activeQueryAbortController: AbortController;

  beforeEach(() => {
    jest.clearAllMocks();
    activeQueryAbortController = new AbortController();
  });

  it('skips execution when shouldSkipQueryExecution returns true', async () => {
    (shouldSkipQueryExecution as jest.Mock).mockReturnValueOnce(true);
    const services = buildServices();

    await queryExecution({
      services,
      query: emptyQuery,
      queryString: '| head 10',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController,
    });

    expect(updateEditorStateFn).not.toHaveBeenCalled();
  });

  it('sets LOADING then READY status on successful query', async () => {
    const services = buildServices();
    const mockSearchSource = {
      fetch: jest.fn().mockResolvedValue({ hits: { hits: [{ _id: '1' }] } }),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue({ schema: [] }),
    };
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(mockSearchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: emptyQuery,
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController,
    });

    expect(updateEditorStateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryStatus: expect.objectContaining({ status: QueryExecutionStatus.LOADING }),
      })
    );
    expect(updateEditorStateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryStatus: expect.objectContaining({ status: QueryExecutionStatus.READY }),
      })
    );
    expect(updateResultFn).toHaveBeenCalled();
  });

  it('sets NO_RESULTS status when query returns empty hits', async () => {
    const services = buildServices();
    const mockSearchSource = {
      fetch: jest.fn().mockResolvedValue({ hits: { hits: [] } }),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue({ schema: [] }),
    };
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(mockSearchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: emptyQuery,
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController,
    });

    expect(updateEditorStateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryStatus: expect.objectContaining({ status: QueryExecutionStatus.NO_RESULTS }),
      })
    );
  });

  it('sets UNINITIALIZED status on AbortError', async () => {
    const services = buildServices();
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const mockSearchSource = {
      fetch: jest.fn().mockRejectedValue(abortError),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue(null),
    };
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(mockSearchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: emptyQuery,
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController,
    });

    expect(updateEditorStateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryStatus: expect.objectContaining({ status: QueryExecutionStatus.UNINITIALIZED }),
      })
    );
  });

  it('sets ERROR status and rethrows on query failure', async () => {
    const services = buildServices();
    const queryError = Object.assign(new Error('error'), {
      body: { message: '{"error":{"reason":"r","details":"d","type":"t"}}', statusCode: 400 },
    });
    const mockSearchSource = {
      fetch: jest.fn().mockRejectedValue(queryError),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue(null),
    };
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(mockSearchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await expect(
      queryExecution({
        services,
        query: emptyQuery,
        queryString: 'source=logs',
        updateEditorStateFn,
        updateResultFn,
        activeQueryAbortController,
      })
    ).rejects.toThrow('error');

    expect(updateEditorStateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryStatus: expect.objectContaining({ status: QueryExecutionStatus.ERROR }),
      })
    );
  });

  const runFailingQuery = async (queryError: Error) => {
    const services = buildServices();
    const mockSearchSource = {
      fetch: jest.fn().mockRejectedValue(queryError),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue(null),
    };
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(mockSearchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });
    await queryExecution({
      services,
      query: { query: 'source=logs', language: 'PPL' } as any,
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController: new AbortController(),
    }).catch(() => {});
    const errorCall = [...updateEditorStateFn.mock.calls]
      .reverse()
      .find(([state]: [any]) => state.queryStatus?.status === QueryExecutionStatus.ERROR);
    return errorCall[0].queryStatus.error.message;
  };

  it('shows the message of an error without a body once, as the reason', async () => {
    const message = await runFailingQuery(new Error('The data source rejected the query'));
    expect(message.reason).toBe('The data source rejected the query');
    expect(message.details).toBe('');
  });

  it('keeps the details of an error whose body has them', async () => {
    const queryError = Object.assign(new Error('Bad Request'), {
      body: { message: 'Query failed', error: 'Syntax error at line 1' },
    });
    const message = await runFailingQuery(queryError);
    expect(message.reason).toBe('Query failed');
    expect(message.details).toBe('Syntax error at line 1');
  });

  it('shows a message that differs from the reason as the details', async () => {
    const queryError = Object.assign(new Error('Bad Request'), {
      body: { message: 'Query failed' },
    });
    const message = await runFailingQuery(queryError);
    expect(message.reason).toBe('Query failed');
    expect(message.details).toBe('Bad Request');
  });
});

describe('queryExecution per-row isolation', () => {
  const updateEditorStateFn = jest.fn();
  const updateResultFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSearchSource = () => ({
    fetch: jest.fn().mockResolvedValue({ hits: { hits: [{ _id: '1' }] } }),
    getSearchRequestBody: jest.fn().mockResolvedValue({}),
    getDataFrame: jest.fn().mockReturnValue({ schema: [] }),
  });

  it("sends the row's own query (not the global one) and drops non-metrics queryOptions", async () => {
    const services = buildServices();
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(mockSearchSource());
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: { query: 'source=logs', language: 'PPL', queryOptions: { maxDataPoints: 5 } } as any,
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController: new AbortController(),
    });

    const [preparedQuery, , , options] = (createSearchSourceWithQuery as jest.Mock).mock.calls[0];
    expect(options).toEqual({ useProvidedQuery: true });
    expect(preparedQuery).toMatchObject({ language: 'PPL', query: 'source=logs' });
    expect(preparedQuery.queryOptions).toBeUndefined();
  });

  it('uses the active abort controller for the request', async () => {
    const services = buildServices();
    const controller = new AbortController();
    let signalDuringFetch: AbortSignal | undefined;
    const searchSource = mockSearchSource();
    searchSource.fetch.mockImplementation(async ({ abortSignal }) => {
      signalDuringFetch = abortSignal;
      return { hits: { hits: [] } };
    });
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(searchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: { query: 'q', language: 'PPL' } as any,
      queryString: 'q',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController: controller,
    });

    expect(signalDuringFetch).toBe(controller.signal);
  });

  it('drops the response when the run is aborted while fetching', async () => {
    const services = buildServices();
    const controller = new AbortController();
    const searchSource = mockSearchSource();
    searchSource.fetch.mockImplementation(async () => {
      controller.abort();
      return { hits: { hits: [{ _id: '1' }] } };
    });
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(searchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: { query: 'q', language: 'PPL' } as any,
      queryString: 'q',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController: controller,
    });

    expect(updateResultFn).not.toHaveBeenCalled();
    // Only the LOADING update from before the fetch.
    expect(updateEditorStateFn).toHaveBeenCalledTimes(1);
  });

  it('writes nothing and does not throw when an aborted run fails', async () => {
    const services = buildServices();
    const controller = new AbortController();
    const searchSource = mockSearchSource();
    searchSource.fetch.mockImplementation(async () => {
      controller.abort();
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    });
    (createSearchSourceWithQuery as jest.Mock).mockResolvedValue(searchSource);
    services.data.query.queryString.getLanguageService = jest
      .fn()
      .mockReturnValue({ getLanguage: jest.fn().mockReturnValue({}) });

    await queryExecution({
      services,
      query: { query: 'q', language: 'PPL' } as any,
      queryString: 'q',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortController: controller,
    });

    expect(updateResultFn).not.toHaveBeenCalled();
    expect(updateEditorStateFn).toHaveBeenCalledTimes(1);
  });
});

describe('resolveDatasetLanguage', () => {
  const servicesFor = (supported?: string[]) =>
    ({
      data: {
        query: {
          queryString: {
            getDatasetService: () => ({
              getType: () => (supported ? { supportedLanguages: () => supported } : undefined),
            }),
          },
        },
      },
    }) as any;
  const promDataset = { id: 'prom', title: 'prom', type: 'PROMETHEUS' } as any;
  const indexDataset = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' } as any;

  it('switches to a language the dataset can run when it carries none', () => {
    expect(resolveDatasetLanguage(servicesFor(['PROMQL']), promDataset, 'PPL')).toBe('PROMQL');
  });

  it('keeps the current language when the dataset can run it', () => {
    expect(
      resolveDatasetLanguage(servicesFor(['kuery', 'lucene', 'PPL']), indexDataset, 'PPL')
    ).toBe('PPL');
  });

  it("prefers the dataset's own language over the first supported one", () => {
    expect(
      resolveDatasetLanguage(
        servicesFor(['PPL', 'PROMQL']),
        { ...promDataset, language: 'PROMQL' },
        'AI'
      )
    ).toBe('PROMQL');
  });

  it('ignores languages the editor does not offer', () => {
    expect(resolveDatasetLanguage(servicesFor(['kuery', 'PPL']), indexDataset, 'kuery')).toBe(
      'PPL'
    );
  });

  it("falls back to the dataset's or current language for an unknown dataset type", () => {
    expect(resolveDatasetLanguage(servicesFor(undefined), indexDataset, 'PPL')).toBe('PPL');
    expect(
      resolveDatasetLanguage(servicesFor(undefined), { ...indexDataset, language: 'SQL' }, 'PPL')
    ).toBe('SQL');
  });
});

describe('getInitialQueryString', () => {
  const dataset = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' } as Dataset;
  const queryStringFor = () =>
    ({
      getInitialQueryByDataset: jest.fn(
        ({ language, title }: { language: string; title: string }) => ({
          query: language === 'SQL' ? `SELECT * FROM ${title} LIMIT 10` : `${language} on ${title}`,
        })
      ),
    }) as unknown as QueryStringContract;

  it('starts PPL empty', () => {
    const queryString = queryStringFor();
    expect(getInitialQueryString(queryString, dataset, 'PPL')).toBe('');
    expect(queryString.getInitialQueryByDataset).not.toHaveBeenCalled();
  });

  it("uses the language's own initial query on the dataset, e.g. SQL's base query", () => {
    const queryString = queryStringFor();
    expect(getInitialQueryString(queryString, dataset, 'SQL')).toBe('SELECT * FROM logs LIMIT 10');
    expect(queryString.getInitialQueryByDataset).toHaveBeenCalledWith({
      ...dataset,
      language: 'SQL',
    });
  });

  it("uses a registered language's own initial query", () => {
    expect(getInitialQueryString(queryStringFor(), dataset, 'my_language')).toBe(
      'my_language on logs'
    );
  });

  it('starts empty without a dataset', () => {
    expect(getInitialQueryString(queryStringFor(), undefined, 'SQL')).toBe('');
  });
});
