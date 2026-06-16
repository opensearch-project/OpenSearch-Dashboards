/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isSignalTypeCompatible,
  getRequiredSignalType,
  resolveDatasetByLanguage,
  getPreloadedQueryState,
  queryExecution,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
  showMissingDatasetWarning,
  handleAgentError,
} from './utils';
import { SupportLanguageType } from './query_builder';
import { AgentError, ProhibitedQueryError } from '../../../components/query_panel/utils/error';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { fetchFirstAvailableDataset } from '../../../application/utils/state_management/utils/redux_persistence';
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
  } as any);

describe('resolveDatasetByLanguage', () => {
  it('returns existing dataset when signal type is compatible', async () => {
    const services = buildServices();
    const result = await resolveDatasetByLanguage(services, SupportLanguageType.ppl, mockDataset);
    expect(result).toBe(mockDataset);
    expect(fetchFirstAvailableDataset).not.toHaveBeenCalled();
  });

  it('fetches first available dataset when existing dataset is incompatible', async () => {
    const services = buildServices();
    (services.data.dataViews.get as jest.Mock).mockResolvedValue({ signalType: 'metrics' });
    const availableDataset = { id: 'fallback', title: 'fallback-index', type: 'INDEX_PATTERN' };
    (fetchFirstAvailableDataset as jest.Mock).mockResolvedValue(availableDataset);

    const result = await resolveDatasetByLanguage(services, SupportLanguageType.ppl, mockDataset);
    expect(result).toBe(availableDataset);
  });

  it('fetches first available dataset when no existing dataset', async () => {
    const services = buildServices();
    services.data.query.queryString.getQuery.mockReturnValue({});
    services.data.query.queryString.getDefaultQuery.mockReturnValue({});
    const availableDataset = { id: 'fallback', title: 'fallback-index', type: 'INDEX_PATTERN' };
    (fetchFirstAvailableDataset as jest.Mock).mockResolvedValue(availableDataset);

    const result = await resolveDatasetByLanguage(services, SupportLanguageType.ppl);
    expect(result).toBe(availableDataset);
  });
});

describe('getPreloadedQueryState', () => {
  it('returns query state with dataset when dataset is resolved', async () => {
    const services = buildServices();
    (fetchFirstAvailableDataset as jest.Mock).mockResolvedValue(mockDataset);

    const result = await getPreloadedQueryState(services, SupportLanguageType.ppl);
    expect(result).toMatchObject({ query: '', dataset: mockDataset });
  });

  it('returns empty query state when no dataset is resolved', async () => {
    const services = buildServices();
    services.data.query.queryString.getQuery.mockReturnValue({});
    services.data.query.queryString.getDefaultQuery.mockReturnValue({});
    (fetchFirstAvailableDataset as jest.Mock).mockResolvedValue(undefined);

    const result = await getPreloadedQueryState(services, SupportLanguageType.ppl);
    expect(result).toEqual({ query: '', language: SupportLanguageType.ppl, dataset: undefined });
  });
});

describe('queryExecution', () => {
  const updateEditorStateFn = jest.fn();
  const updateResultFn = jest.fn();
  const activeQueryAbortControllers = new Map<string, AbortController>();

  beforeEach(() => {
    jest.clearAllMocks();
    activeQueryAbortControllers.clear();
  });

  it('skips execution when shouldSkipQueryExecution returns true', async () => {
    (shouldSkipQueryExecution as jest.Mock).mockReturnValueOnce(true);
    const services = buildServices();

    await queryExecution({
      services,
      queryString: '| head 10',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortControllers,
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
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortControllers,
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
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortControllers,
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
      queryString: 'source=logs',
      updateEditorStateFn,
      updateResultFn,
      activeQueryAbortControllers,
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
        queryString: 'source=logs',
        updateEditorStateFn,
        updateResultFn,
        activeQueryAbortControllers,
      })
    ).rejects.toThrow('error');

    expect(updateEditorStateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryStatus: expect.objectContaining({ status: QueryExecutionStatus.ERROR }),
      })
    );
  });
});
