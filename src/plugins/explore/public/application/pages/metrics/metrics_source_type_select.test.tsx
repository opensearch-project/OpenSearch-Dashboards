/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MetricsSourceTypeSelect } from './metrics_source_type_select';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';
import { ExploreFlavor } from '../../../../common';

let mockDataset: { id: string; type: string } | undefined;
let mockDefaultDataset: Record<string, unknown> | undefined;
let mockCurrentQuery: Record<string, unknown>;
const mockDispatch = jest.fn();
const mockClearEditors = jest.fn();
const mockSetQuery = jest.fn((query: Record<string, unknown>) => {
  mockCurrentQuery = { ...mockCurrentQuery, ...query };
});
const mockCacheDataset = jest.fn();
const mockAddWarning = jest.fn();
const mockSetUserQueryLanguage = jest.fn();
const mockRun = jest.fn((_services: unknown, query: string) => ({ type: 'run', query }));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));
jest.mock('../../utils/state_management/selectors', () => ({
  selectDataset: () => mockDataset,
}));
jest.mock('../../utils/state_management/slices', () => ({
  setQueryWithHistory: (query: unknown) => ({ type: 'setQueryWithHistory', payload: query }),
}));
jest.mock('../../utils/state_management/actions/query_editor/on_editor_run/on_editor_run', () => ({
  onEditorRunActionCreator: (...args: [unknown, string]) => mockRun(...args),
}));
jest.mock('../../hooks', () => ({
  useSwitchSourceType: (...args: unknown[]) =>
    jest
      .requireActual('../../hooks/editor_hooks/use_switch_source_type/use_switch_source_type')
      .useSwitchSourceType(...args),
}));
jest.mock('../../hooks/editor_hooks/use_clear_editors', () => ({
  useClearEditors: () => mockClearEditors,
}));
jest.mock('../../hooks/editor_hooks/use_editor_focus', () => ({
  useEditorFocus: () => jest.fn(),
}));
// The data plugin's query manager, as far as switching uses it: the initial query takes the
// dataset's language, else keeps the current one.
jest.mock('../../../services/services', () => ({
  getServices: () => ({
    data: {
      query: {
        queryString: {
          setQuery: mockSetQuery,
          getQuery: () => mockCurrentQuery,
          getInitialQueryByDataset: (dataset: { language?: string }) => ({
            ...mockCurrentQuery,
            query: 'x',
            language: dataset.language || mockCurrentQuery.language,
            dataset,
          }),
          getLanguageService: () => ({
            setUserQueryLanguage: mockSetUserQueryLanguage,
            getLanguage: () => undefined,
          }),
          getDatasetService: () => ({
            cacheDataset: mockCacheDataset,
            getDefault: () => mockDefaultDataset,
          }),
        },
      },
    },
    notifications: { toasts: { addWarning: mockAddWarning, addError: jest.fn() } },
  }),
}));

const myMetrics = { id: 'my-metrics-source::default', type: 'MY_METRICS_TYPE', language: 'MyQL' };
const prometheus = { id: 'prom-1', type: 'PROMETHEUS', signalType: 'metrics' };

const register = (resolved: unknown = myMetrics) => {
  const registry = new SourceTypeRegistryService();
  registry.register({
    id: 'my-metrics-source',
    label: 'My Metrics Source',
    datasetTypes: ['MY_METRICS_TYPE'],
    flavors: [ExploreFlavor.Metrics],
    resolveDefaultDataset: async () => resolved as any,
  });
  setSourceTypeRegistry(registry);
};

describe('MetricsSourceTypeSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataset = undefined;
    mockDefaultDataset = undefined;
    mockCurrentQuery = {
      query: 'up',
      language: 'PROMQL',
      queryOptions: { maxDataPoints: 500, perQueryOptions: [{ minStep: '1m' }] },
    };
  });
  afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  it('renders nothing with only the built-in source', () => {
    setSourceTypeRegistry(new SourceTypeRegistryService());
    const { container } = render(<MetricsSourceTypeSelect />);
    expect(container).toBeEmptyDOMElement();
  });

  it("switches to another source's dataset, language and an empty editor", async () => {
    register();
    render(<MetricsSourceTypeSelect />);
    const button = screen.getByTestId('metricsSourceTypeSelect');
    expect(button).toHaveTextContent('Prometheus');

    fireEvent.click(button);
    fireEvent.click(screen.getByTestId('metricsSourceType-my-metrics-source'));

    await waitFor(() => expect(mockRun).toHaveBeenCalledWith(expect.anything(), ''));
    // PromQL's options belong to the previous language.
    expect(mockSetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        dataset: myMetrics,
        query: '',
        language: 'MyQL',
        queryOptions: undefined,
      })
    );
    expect(mockCacheDataset).toHaveBeenCalled();
    expect(mockSetUserQueryLanguage).toHaveBeenCalledWith('MyQL');
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setQueryWithHistory' })
    );
    expect(mockClearEditors).toHaveBeenCalled();
  });

  it('switches back to a Prometheus connection in PromQL', async () => {
    register();
    mockDataset = myMetrics;
    mockDefaultDataset = prometheus;
    mockCurrentQuery = { query: 'SELECT 1', language: 'MyQL', dataset: myMetrics };
    render(<MetricsSourceTypeSelect />);
    expect(screen.getByTestId('metricsSourceTypeSelect')).toHaveTextContent('My Metrics Source');

    fireEvent.click(screen.getByTestId('metricsSourceTypeSelect'));
    fireEvent.click(screen.getByTestId('metricsSourceType-opensearch'));

    await waitFor(() =>
      expect(mockSetQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          language: 'PROMQL',
          dataset: { ...prometheus, language: 'PROMQL' },
        })
      )
    );
    expect(mockSetUserQueryLanguage).toHaveBeenCalledWith('PROMQL');
  });

  it('switches back to Prometheus even without a connection', async () => {
    register();
    mockDataset = myMetrics;
    render(<MetricsSourceTypeSelect />);

    fireEvent.click(screen.getByTestId('metricsSourceTypeSelect'));
    fireEvent.click(screen.getByTestId('metricsSourceType-opensearch'));

    await waitFor(() =>
      expect(mockSetQuery).toHaveBeenCalledWith({
        query: '',
        language: 'PROMQL',
        dataset: undefined,
        queryOptions: undefined,
      })
    );
  });

  it('switches even when the dataset cannot be cached, and says why', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockCacheDataset.mockRejectedValueOnce(new Error('no dataView'));
    register();
    render(<MetricsSourceTypeSelect />);
    fireEvent.click(screen.getByTestId('metricsSourceTypeSelect'));
    fireEvent.click(screen.getByTestId('metricsSourceType-my-metrics-source'));

    await waitFor(() =>
      expect(mockSetQuery).toHaveBeenCalledWith(expect.objectContaining({ dataset: myMetrics }))
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('my-metrics-source::default'),
      expect.any(Error)
    );
    warn.mockRestore();
  });

  it('warns when a registered source has nothing to open', async () => {
    register(null);
    render(<MetricsSourceTypeSelect />);
    fireEvent.click(screen.getByTestId('metricsSourceTypeSelect'));
    fireEvent.click(screen.getByTestId('metricsSourceType-my-metrics-source'));
    await waitFor(() => expect(mockAddWarning).toHaveBeenCalled());
    expect(mockSetQuery).not.toHaveBeenCalled();
  });
});
