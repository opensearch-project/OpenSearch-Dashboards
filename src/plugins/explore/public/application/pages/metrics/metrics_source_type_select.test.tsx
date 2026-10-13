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
const mockDispatch = jest.fn();
const mockClearEditors = jest.fn();
const mockSetQuery = jest.fn();
const mockCacheDataset = jest.fn();
const mockAddWarning = jest.fn();

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
jest.mock('../../hooks', () => ({ useClearEditors: () => mockClearEditors }));
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: {
            setQuery: mockSetQuery,
            getQuery: () => ({}),
            getInitialQueryByDataset: (dataset: any) => ({
              query: 'x',
              language: 'PROMQL',
              dataset,
            }),
            getDatasetService: () => ({
              cacheDataset: mockCacheDataset,
              getDefault: () => undefined,
            }),
          },
        },
      },
      notifications: { toasts: { addWarning: mockAddWarning, addError: jest.fn() } },
    },
  }),
}));

const cloudWatch = { id: 'cloudwatch-metrics::us-west-2', type: 'CW' };

const register = (resolved: unknown = cloudWatch) => {
  const registry = new SourceTypeRegistryService();
  registry.register({
    id: 'cw',
    label: 'CloudWatch Metrics',
    datasetTypes: ['CW'],
    flavors: [ExploreFlavor.Metrics],
    resolveDefaultDataset: async () => resolved as any,
  });
  setSourceTypeRegistry(registry);
};

describe('MetricsSourceTypeSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataset = undefined;
  });
  afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  it('renders nothing with only the built-in source', () => {
    setSourceTypeRegistry(new SourceTypeRegistryService());
    const { container } = render(<MetricsSourceTypeSelect />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the active source and switches to another one', async () => {
    register();
    render(<MetricsSourceTypeSelect />);
    const button = screen.getByTestId('metricsSourceTypeSelect');
    expect(button).toHaveTextContent('Prometheus');

    fireEvent.click(button);
    fireEvent.click(screen.getByTestId('metricsSourceType-cw'));

    await waitFor(() =>
      expect(mockSetQuery).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: cloudWatch, query: '', language: 'PROMQL' })
      )
    );
    expect(mockCacheDataset).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
    expect(mockClearEditors).toHaveBeenCalled();
  });

  it('switches back to Prometheus even without a connection', async () => {
    register();
    mockDataset = cloudWatch;
    render(<MetricsSourceTypeSelect />);
    expect(screen.getByTestId('metricsSourceTypeSelect')).toHaveTextContent('CloudWatch Metrics');

    fireEvent.click(screen.getByTestId('metricsSourceTypeSelect'));
    fireEvent.click(screen.getByTestId('metricsSourceType-opensearch'));

    await waitFor(() =>
      expect(mockSetQuery).toHaveBeenCalledWith({
        query: '',
        language: 'PROMQL',
        dataset: undefined,
      })
    );
  });

  it('warns when a registered source has nothing to open', async () => {
    register(null);
    render(<MetricsSourceTypeSelect />);
    fireEvent.click(screen.getByTestId('metricsSourceTypeSelect'));
    fireEvent.click(screen.getByTestId('metricsSourceType-cw'));
    await waitFor(() => expect(mockAddWarning).toHaveBeenCalled());
    expect(mockSetQuery).not.toHaveBeenCalled();
  });
});
