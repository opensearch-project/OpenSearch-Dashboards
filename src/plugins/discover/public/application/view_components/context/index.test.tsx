/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import React from 'react';
import { Subject } from 'rxjs';
import { ViewProps } from '../../../../../data_explorer/public';

import DiscoverContext from './index';

// Mock the heavy dependencies so we can focus on the page-context registration logic.
jest.mock('../utils/use_search', () => ({
  useSearch: jest.fn(() => ({})),
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: {} }),
  OpenSearchDashboardsContextProvider: ({ children }: any) => children,
}));

jest.mock('../../../../../data/common', () => ({
  buildOpenSearchQuery: jest.fn((_index, _queries, filters, _config) => {
    if ((global as any).__forceEmptyBool) {
      return { bool: { must: [], filter: [], should: [], must_not: [] } };
    }
    return {
      bool: {
        must: [],
        filter: filters.map((f: any) => ({ term: { [f.meta?.key || 'field']: f.meta?.value } })),
        should: [],
        must_not: [],
      },
    };
  }),
  getOpenSearchQueryConfig: jest.fn(() => ({})),
}));

const mockGetServices = jest.fn();
jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: () => mockGetServices(),
}));

// Observable subjects to simulate store updates
const filterUpdates$ = new Subject<void>();
const timeUpdates$ = new Subject<void>();
const queryUpdates$ = new Subject<void>();

const mockAddContext = jest.fn();
const mockRemoveContextById = jest.fn();
const mockSuppressDefaultPageContext = jest.fn();
const mockUnsuppressDefaultPageContext = jest.fn();

function createMockServices(overrides: any = {}) {
  return {
    data: {
      query: {
        filterManager: {
          getFilters: jest.fn(() => overrides.filters ?? []),
          getUpdates$: () => filterUpdates$,
        },
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => overrides.timeRange ?? { from: 'now-15m', to: 'now' }),
            getTimeUpdate$: () => timeUpdates$,
          },
        },
        queryString: {
          getQuery: jest.fn(
            () =>
              overrides.query ?? {
                query: '',
                language: overrides.language ?? 'kuery',
                dataset: overrides.dataset ?? { id: 'test-index' },
              }
          ),
          getLanguageService: jest.fn(() => ({
            getLanguage: jest.fn((lang: string) => {
              if (overrides.languageConfig === null) return undefined;
              if (lang === 'SQL') return { hideDatePicker: true, fields: { filterable: false } };
              return (
                overrides.languageConfig ?? { hideDatePicker: false, fields: { filterable: true } }
              );
            }),
          })),
          getUpdates$: () => queryUpdates$,
        },
      },
    },
    uiSettings: {
      get: jest.fn(),
    },
    contextProvider:
      'contextProvider' in overrides
        ? overrides.contextProvider
        : {
            getAssistantContextStore: () => ({
              addContext: mockAddContext,
              removeContextById: mockRemoveContextById,
            }),
            actions: {
              suppressDefaultPageContext: mockSuppressDefaultPageContext,
              unsuppressDefaultPageContext: mockUnsuppressDefaultPageContext,
            },
          },
    ...overrides.extraServices,
  };
}

// Minimal ViewProps for rendering
const renderContext = (container: HTMLElement) => {
  act(() => {
    render(
      React.createElement(DiscoverContext, { onAppLeave: () => {} } as unknown as ViewProps),
      container
    );
  });
};

describe('DiscoverContext (iteration 3 - direct store subscription)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      unmountComponentAtNode(container);
    });
    document.body.removeChild(container);
    delete (global as any).__forceEmptyBool;
  });

  it('registers context and suppresses default page context on mount', () => {
    mockGetServices.mockReturnValue(createMockServices());
    renderContext(container);

    expect(mockSuppressDefaultPageContext).toHaveBeenCalledTimes(1);
    expect(mockAddContext).toHaveBeenCalledTimes(1);
    expect(mockAddContext).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'discover-page-context',
        description: 'Discover application page context',
        label: 'Page: Discover',
        categories: ['page', 'static'],
      })
    );
  });

  it('includes timeRange and query for DQL/Lucene', () => {
    mockGetServices.mockReturnValue(
      createMockServices({
        language: 'kuery',
        timeRange: { from: 'now-1h', to: 'now' },
      })
    );
    renderContext(container);

    const contextValue = mockAddContext.mock.calls[0][0].value;
    expect(contextValue.timeRange).toEqual({ from: 'now-1h', to: 'now' });
    expect(contextValue.query).toEqual({ query: '', language: 'kuery' });
    expect(contextValue.appId).toBe('discover');
  });

  it('omits timeRange and filters for SQL', () => {
    mockGetServices.mockReturnValue(
      createMockServices({
        language: 'SQL',
        filters: [{ meta: { key: 'status', value: 'active' } }],
      })
    );
    renderContext(container);

    const contextValue = mockAddContext.mock.calls[0][0].value;
    expect(contextValue.timeRange).toBeUndefined();
    expect(contextValue.filters).toBeUndefined();
    expect(contextValue.filtersNote).toBeUndefined();
    expect(contextValue.query.language).toBe('SQL');
  });

  it('includes filters as OpenSearch DSL with filtersNote for DQL', () => {
    mockGetServices.mockReturnValue(
      createMockServices({
        language: 'kuery',
        filters: [{ meta: { key: 'status', value: 'active' } }],
      })
    );
    renderContext(container);

    const contextValue = mockAddContext.mock.calls[0][0].value;
    expect(contextValue.filters).toEqual({
      must: [],
      filter: [{ term: { status: 'active' } }],
      should: [],
      must_not: [],
    });
    expect(contextValue.filtersNote).toContain('already applied');
  });

  it('omits filters key when rawFilters is empty (timeRange still included)', () => {
    mockGetServices.mockReturnValue(
      createMockServices({
        language: 'kuery',
        filters: [],
        timeRange: { from: 'now-7d', to: 'now' },
      })
    );
    renderContext(container);

    const contextValue = mockAddContext.mock.calls[0][0].value;
    expect(contextValue.filters).toBeUndefined();
    expect(contextValue.filtersNote).toBeUndefined();
    expect(contextValue.timeRange).toEqual({ from: 'now-7d', to: 'now' });
  });

  it('includes filters and filtersNote even when the DSL bool clause is empty (trusts buildOpenSearchQuery as-is)', () => {
    (global as any).__forceEmptyBool = true;
    mockGetServices.mockReturnValue(
      createMockServices({
        language: 'kuery',
        filters: [{ meta: { key: 'status', value: 'active', disabled: true } }],
      })
    );
    renderContext(container);

    const contextValue = mockAddContext.mock.calls[0][0].value;
    expect(contextValue.filters).toEqual({ must: [], filter: [], should: [], must_not: [] });
    expect(contextValue.filtersNote).toContain('already applied');
  });

  it('defaults to kuery when language service is unavailable', () => {
    mockGetServices.mockReturnValue(
      createMockServices({
        language: 'unknown-lang',
        languageConfig: null,
      })
    );
    renderContext(container);

    // With no language config, supportsTimeFilter defaults to true, supportsFilters to true
    const contextValue = mockAddContext.mock.calls[0][0].value;
    expect(contextValue.timeRange).toBeDefined();
    expect(contextValue.query.language).toBe('unknown-lang');
  });

  it('re-registers context when filterManager emits', () => {
    mockGetServices.mockReturnValue(createMockServices());
    renderContext(container);

    mockAddContext.mockClear();
    act(() => {
      filterUpdates$.next();
    });

    expect(mockAddContext).toHaveBeenCalledTimes(1);
  });

  it('re-registers context when timefilter emits', () => {
    mockGetServices.mockReturnValue(createMockServices());
    renderContext(container);

    mockAddContext.mockClear();
    act(() => {
      timeUpdates$.next();
    });

    expect(mockAddContext).toHaveBeenCalledTimes(1);
  });

  it('re-registers context when queryString emits', () => {
    mockGetServices.mockReturnValue(createMockServices());
    renderContext(container);

    mockAddContext.mockClear();
    act(() => {
      queryUpdates$.next();
    });

    expect(mockAddContext).toHaveBeenCalledTimes(1);
  });

  it('cleans up on unmount: unsubscribes, removes context, unsuppresses', () => {
    mockGetServices.mockReturnValue(createMockServices());
    renderContext(container);

    act(() => {
      unmountComponentAtNode(container);
    });

    expect(mockRemoveContextById).toHaveBeenCalledWith('discover-page-context');
    expect(mockUnsuppressDefaultPageContext).toHaveBeenCalledTimes(1);

    // Verify no further registration after unmount
    mockAddContext.mockClear();
    act(() => {
      filterUpdates$.next();
    });
    expect(mockAddContext).not.toHaveBeenCalled();
  });

  it('does nothing when contextProvider is absent', () => {
    mockGetServices.mockReturnValue(createMockServices({ contextProvider: undefined }));
    renderContext(container);

    expect(mockAddContext).not.toHaveBeenCalled();
    expect(mockSuppressDefaultPageContext).not.toHaveBeenCalled();
  });
});
