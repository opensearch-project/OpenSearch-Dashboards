/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { ViewProps } from '../../../../../data_explorer/public';

import DiscoverContext from './index';

// Mock the heavy dependencies so we can focus on the page-context registration logic.
jest.mock('../utils/use_search', () => ({
  useSearch: jest.fn(() => ({})),
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: {} }),
  OpenSearchDashboardsContextProvider: () => null,
}));

const mockUsePageContext = jest.fn();
const mockGetServices = jest.fn();
jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: () => mockGetServices(),
}));

// DiscoverContext is mounted by the router with full ViewProps (AppMountParameters);
// for these unit tests we only care about the page-context side effect, so we cast a
// minimal props object and let the mocked hooks handle the rest.
const renderContext = () =>
  render(
    <DiscoverContext {...({} as ViewProps)}>
      <div>child</div>
    </DiscoverContext>
  );

describe('DiscoverContext page context registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers page context with the contextProvider hook when available', () => {
    mockGetServices.mockReturnValue({
      contextProvider: { hooks: { usePageContext: mockUsePageContext } },
    });

    renderContext();

    expect(mockUsePageContext).toHaveBeenCalledTimes(1);
    const options = mockUsePageContext.mock.calls[0][0];
    expect(options.description).toBe('Discover application page context');
    expect(options.categories).toEqual(['page', 'static']);
    expect(typeof options.convert).toBe('function');
  });

  it('maps url state to the expected page context shape via convert', () => {
    mockGetServices.mockReturnValue({
      contextProvider: { hooks: { usePageContext: mockUsePageContext } },
    });

    renderContext();

    const { convert } = mockUsePageContext.mock.calls[0][0];

    const dataset = { id: 'logs-*', title: 'logs-*', type: 'INDEX_PATTERN' };
    const result = convert({
      _g: { time: { from: 'now-15m', to: 'now' } },
      _q: { query: { query: 'status:200', language: 'PPL', dataset } },
    });

    expect(result).toEqual({
      appId: 'discover',
      timeRange: { from: 'now-15m', to: 'now' },
      query: { query: 'status:200', language: 'PPL' },
      dataset,
    });
  });

  it('falls back to safe defaults when url state is empty', () => {
    mockGetServices.mockReturnValue({
      contextProvider: { hooks: { usePageContext: mockUsePageContext } },
    });

    renderContext();

    const { convert } = mockUsePageContext.mock.calls[0][0];
    const result = convert({});

    expect(result).toEqual({
      appId: 'discover',
      timeRange: undefined,
      query: { query: '', language: 'kuery' },
      dataset: undefined,
    });
  });

  it('does not throw when the contextProvider plugin is unavailable (NOOP fallback)', () => {
    mockGetServices.mockReturnValue({});

    expect(() => renderContext()).not.toThrow();
    expect(mockUsePageContext).not.toHaveBeenCalled();
  });
});
