# Testing Strategy for Explore Plugin Redux Implementation

This document outlines the testing strategy for the Redux implementation in the Explore plugin. It covers unit testing, integration testing, and end-to-end testing approaches.

## Testing Levels

### 1. Unit Tests

Unit tests focus on testing individual components in isolation. For our Redux implementation, we'll test:

#### Reducers

Test each reducer function to ensure it correctly updates state based on actions:

```typescript
// ui_slice.test.ts
import { uiReducer, setActiveTab, setLoading } from './ui_slice';

describe('UI Reducer', () => {
  it('should handle initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual({
      activeTabId: 'logs',
      flavor: 'log',
      isLoading: false,
      error: null,
      queryPanel: {
        promptQuery: '',
      },
    });
  });

  it('should handle setActiveTab', () => {
    const actual = uiReducer(
      { activeTabId: 'logs', flavor: 'log', isLoading: false, error: null, queryPanel: { promptQuery: '' } },
      setActiveTab('metrics')
    );
    expect(actual.activeTabId).toEqual('metrics');
  });

  it('should handle setLoading', () => {
    const actual = uiReducer(
      { activeTabId: 'logs', flavor: 'log', isLoading: false, error: null, queryPanel: { promptQuery: '' } },
      setLoading(true)
    );
    expect(actual.isLoading).toEqual(true);
  });
});
```

#### Action Creators

Test synchronous action creators to ensure they return the correct action objects:

```typescript
// query_actions.test.ts
import { setQuery, setQueryString, setLanguage } from './query_slice';

describe('Query Actions', () => {
  it('should create an action to set query', () => {
    const query = { query: 'test', language: 'lucene' };
    const expectedAction = {
      type: 'query/setQuery',
      payload: query,
    };
    expect(setQuery(query)).toEqual(expectedAction);
  });

  it('should create an action to set query string', () => {
    const queryString = 'test query';
    const expectedAction = {
      type: 'query/setQueryString',
      payload: queryString,
    };
    expect(setQueryString(queryString)).toEqual(expectedAction);
  });
});
```

#### Thunks

Test thunks using mock store and mock services:

```typescript
// query_actions.test.ts
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { executeTabQuery } from './query_actions';
import { setLoading, setError } from './ui_slice';
import { setResults } from './results_slice';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Query Thunks', () => {
  let store;
  let mockSearchSource;
  let mockServices;

  beforeEach(() => {
    mockSearchSource = {
      setField: jest.fn().mockReturnThis(),
      fetch: jest.fn().mockResolvedValue({ hits: { hits: [] } }),
    };

    mockServices = {
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
              createFilter: jest.fn().mockReturnValue(null),
            },
          },
        },
      },
      indexPattern: { fields: [] },
    };

    store = mockStore({
      query: { query: { query: 'test', language: 'lucene' } },
      ui: { activeTabId: 'logs' },
      services: mockServices,
      results: {},
    });
  });

  it('should execute a tab query and update results', async () => {
    await store.dispatch(executeTabQuery());

    const actions = store.getActions();
    expect(actions[0]).toEqual(setLoading(true));
    expect(actions[1].type).toEqual('results/setResults');
    expect(actions[2]).toEqual(setLoading(false));

    expect(mockSearchSource.setField).toHaveBeenCalledWith('query', {
      query: 'test',
      language: 'lucene',
    });
    expect(mockSearchSource.fetch).toHaveBeenCalled();
  });

  it('should handle errors during query execution', async () => {
    const error = new Error('Query failed');
    mockSearchSource.fetch.mockRejectedValue(error);

    try {
      await store.dispatch(executeTabQuery());
    } catch (e) {
      // Expected to throw
    }

    const actions = store.getActions();
    expect(actions[0]).toEqual(setLoading(true));
    expect(actions[1]).toEqual(setError(error));
    expect(actions[2]).toEqual(setLoading(false));
  });
});
```

#### Selectors

Test selectors to ensure they extract the correct data from state:

```typescript
// selectors.test.ts
import { selectActiveTabId, selectIsLoading, selectRows } from './selectors';

describe('Selectors', () => {
  const state = {
    ui: { activeTabId: 'logs', isLoading: true },
    query: { query: { query: 'test' } },
    results: {
      'test_now-15m_now': {
        hits: { hits: [{ _id: '1' }, { _id: '2' }] },
      },
    },
    services: {
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTime: () => ({ from: 'now-15m', to: 'now' }),
            },
          },
        },
      },
    },
  };

  it('should select active tab ID', () => {
    expect(selectActiveTabId(state)).toEqual('logs');
  });

  it('should select loading state', () => {
    expect(selectIsLoading(state)).toEqual(true);
  });

  it('should select rows from results', () => {
    expect(selectRows(state)).toEqual([{ _id: '1' }, { _id: '2' }]);
  });
});
```

### 2. Integration Tests

Integration tests focus on testing how different parts of the system work together.

#### Store Integration

Test that the store is properly configured and that state changes propagate correctly:

```typescript
// store.test.ts
import { getExploreStore } from './store';
import { setQuery } from './slices/query_slice';
import { setActiveTab } from './slices/ui_slice';

describe('Explore Store', () => {
  let store;
  let unsubscribe;

  beforeEach(async () => {
    const mockServices = {
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
            },
          },
        },
      },
    };

    const result = await getExploreStore(mockServices);
    store = result.store;
    unsubscribe = result.unsubscribe;
  });

  afterEach(() => {
    unsubscribe();
  });

  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state.query.query).toEqual({ query: '', language: '' });
    expect(state.ui.activeTabId).toEqual('logs');
    expect(state.results).toEqual({});
  });

  it('should update state when actions are dispatched', () => {
    store.dispatch(setQuery({ query: 'test', language: 'lucene' }));
    store.dispatch(setActiveTab('metrics'));

    const state = store.getState();
    expect(state.query.query).toEqual({ query: 'test', language: 'lucene' });
    expect(state.ui.activeTabId).toEqual('metrics');
  });
});
```

#### URL State Persistence

Test that state is correctly persisted to and loaded from the URL:

```typescript
// redux_persistence.test.ts
import { persistReduxState, loadStateFromUrl } from './utils/redux_persistence';

describe('Redux Persistence', () => {
  let originalLocation;
  let mockServices;

  beforeEach(() => {
    originalLocation = window.location;
    delete window.location;
    window.location = {
      href: 'http://localhost:5601/app/explore',
      hash: '',
      replace: jest.fn(),
    };

    mockServices = {
      data: {
        query: {
          state: {
            update: jest.fn(),
            get: jest.fn().mockReturnValue({
              query: { query: 'test', language: 'lucene' },
              filters: [],
            }),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
            },
          },
        },
      },
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should persist state to URL', () => {
    const state = {
      query: { query: { query: 'test', language: 'lucene' } },
      ui: { activeTabId: 'logs' },
      legacy: { columns: ['field1', 'field2'], sort: [], filters: [] },
      transaction: { inProgress: false },
      services: mockServices,
    };

    persistReduxState(state, mockServices);

    expect(mockServices.data.query.state.update).toHaveBeenCalled();
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it('should load state from URL', () => {
    const encodedState = btoa(JSON.stringify({
      query: { query: 'test', language: 'lucene' },
      tab: 'logs',
      columns: ['field1', 'field2'],
    }));

    window.location.hash = `#/view/${encodedState}`;

    const loadedState = loadStateFromUrl(mockServices);

    expect(loadedState).toEqual({
      query: { query: { query: 'test', language: 'lucene' } },
      ui: { activeTabId: 'logs' },
      legacy: {
        columns: ['field1', 'field2'],
        sort: [],
        filters: [],
        interval: 'auto',
        rowCount: 50,
      },
    });
  });
});
```

#### Component Integration

Test that components correctly interact with the Redux store:

```typescript
// discover_table.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DiscoverTable } from './discover_table';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('DiscoverTable', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      query: { query: { query: 'test', language: 'lucene' } },
      ui: { activeTabId: 'logs', isLoading: false },
      results: {
        'test_now-15m_now': {
          hits: { hits: [{ _id: '1', _source: { field1: 'value1' } }] },
        },
      },
      legacy: { columns: ['field1'], sort: [] },
      services: {
        data: {
          query: {
            timefilter: {
              timefilter: {
                getTime: () => ({ from: 'now-15m', to: 'now' }),
              },
            },
          },
        },
        indexPattern: { fields: [{ name: 'field1', type: 'string' }] },
      },
    });
  });

  it('should render table with data from Redux store', () => {
    render(
      <Provider store={store}>
        <DiscoverTable />
      </Provider>
    );

    expect(screen.getByText('value1')).toBeInTheDocument();
  });

  it('should dispatch actions when columns are added', () => {
    render(
      <Provider store={store}>
        <DiscoverTable />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add Column'));
    fireEvent.click(screen.getByText('field1'));

    const actions = store.getActions();
    expect(actions[0].type).toEqual('legacy/addColumn');
    expect(actions[0].payload).toEqual({ column: 'field1' });
  });
});
```

### 3. End-to-End Tests

End-to-end tests verify that the entire application works correctly from a user's perspective.

```typescript
// explore_e2e.test.ts
describe('Explore Plugin', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:5601/app/explore');
  });

  it('should execute a query and display results', async () => {
    // Enter a query
    await page.fill('[data-test-subj="queryInput"]', 'host:example.com');
    
    // Click the search button
    await page.click('[data-test-subj="querySubmitButton"]');
    
    // Wait for results to load
    await page.waitForSelector('[data-test-subj="docTable"]');
    
    // Verify results are displayed
    const rowCount = await page.$$eval('[data-test-subj="docTableRow"]', rows => rows.length);
    expect(rowCount).toBeGreaterThan(0);
  });

  it('should persist state to URL', async () => {
    // Enter a query
    await page.fill('[data-test-subj="queryInput"]', 'host:example.com');
    
    // Click the search button
    await page.click('[data-test-subj="querySubmitButton"]');
    
    // Wait for URL to update
    await page.waitForFunction(() => {
      return window.location.hash.includes('#/view/');
    });
    
    // Get current URL
    const url = await page.url();
    
    // Reload the page
    await page.reload();
    
    // Verify query is still set
    const queryValue = await page.$eval('[data-test-subj="queryInput"]', el => el.value);
    expect(queryValue).toEqual('host:example.com');
  });
});
```

## Test Coverage Goals

- **Unit Tests**: 80% coverage of all Redux-related code
- **Integration Tests**: Cover all major user flows
- **End-to-End Tests**: Cover critical user journeys

## Testing Tools

1. **Jest**: For unit and integration testing
2. **React Testing Library**: For component testing
3. **Redux Mock Store**: For testing Redux actions and thunks
4. **Playwright/Cypress**: For end-to-end testing

## Mocking Strategy

1. **Services**: Mock all OpenSearch Dashboards services
2. **API Calls**: Mock all API calls to OpenSearch
3. **Time**: Use fake timers for time-dependent tests

## Continuous Integration

1. Run unit and integration tests on every PR
2. Run end-to-end tests on merge to main branch
3. Generate coverage reports and enforce minimum coverage thresholds

## Test Organization

Organize tests to mirror the structure of the code:

```
src/
  plugins/
    explore/
      public/
        application/
          state_management/
            slices/
              ui_slice.ts
              ui_slice.test.ts
            actions/
              query_actions.ts
              query_actions.test.ts
            utils/
              redux_persistence.ts
              redux_persistence.test.ts
          components/
            discover_table.tsx
            discover_table.test.tsx
```

## Conclusion

This testing strategy ensures that our Redux implementation is thoroughly tested at all levels, from individual reducers to the entire application. By following this approach, we can have confidence in the reliability and correctness of our code.