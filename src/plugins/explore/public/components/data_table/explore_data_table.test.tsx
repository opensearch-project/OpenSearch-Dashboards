/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as useFlavorHooks from '../../helpers/use_flavor_id/use_flavor_id';
import { ExploreDataTable } from './explore_data_table';
import {
  setExpandAllJson,
  setShowJsonFormat,
  setWrapCellText,
} from '../../application/utils/state_management/slices';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  resultsReducer,
  resultsCache,
  clearResultsCache,
} from '../../application/utils/state_management/slices';
import { ExploreFlavor } from '../../../common';

// Mock the hooks and services
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: {
        get: jest.fn((setting) => {
          switch (setting) {
            case 'defaultColumns':
              return ['_source'];
            case 'doc_table:hideTimeColumn':
              return false;
            case 'discover:modifyColumnsOnSwitch':
              return true;
            case 'discover:sampleSize':
              return 500;
            case 'shortDots:enable':
              return false;
            default:
              return undefined;
          }
        }),
      },
    },
  })),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock('../../application/hooks', () => ({
  useChangeQueryEditor: jest.fn(() => ({
    onAddFilter: jest.fn(),
  })),
}));

jest.mock('../../application/context', () => ({
  useDatasetContext: jest.fn(() => ({
    dataset: {
      id: 'test-dataset',
      title: 'Test Dataset',
      timeFieldName: '@timestamp',
      fields: {
        getByName: jest.fn(() => ({ type: 'string', filterable: true })),
      },
      flattenHit: jest.fn(() => ({})),
      formatField: jest.fn(() => 'formatted-value'),
    },
  })),
}));

jest.mock('../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDocViewsRegistry: jest.fn(() => ({
    registry: [],
  })),
}));

jest.mock('./data_table', () => ({
  DataTable: ({ rows }: { rows: any[] }) => {
    // Reads the Table settings the way the cells do, so the test can see what reaches them.
    const { useContext } = jest.requireActual('react');
    const { JsonTreeSettingsContext } = jest.requireActual('../json_tree/json_tree');
    const { showJsonFormat, expandAllJson } = useContext(JsonTreeSettingsContext);
    return (
      <div
        data-test-subj="data-table"
        data-json-tree-settings={`${showJsonFormat},${expandAllJson}`}
      >
        Data Table with {rows.length} rows
        {/* Mirrors DataTable's markup, which the search for the row being read relies on. A row
            a test does not place reports jsdom's zero rect, so the search skips it. */}
        <table data-test-subj="docTable">
          <thead data-test-subj="mockHeader" />
          <tbody>
            <tr data-test-subj="mockFirstRow">
              <td />
            </tr>
            <tr data-test-subj="mockExpandedRow">
              <td data-test-subj="osdDocTableDetailsParent" />
            </tr>
            <tr data-test-subj="mockSecondRow">
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
}));

jest.mock('../../helpers/view_component_utils/filter_columns', () => ({
  filterColumns: jest.fn((columns) => columns || ['_source']),
}));

jest.mock('../../helpers/data_table_helper', () => ({
  getLegacyDisplayedColumns: jest.fn((columns) => columns),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn(() => 'test-cache-key'),
  defaultResultsProcessor: jest.fn(() => ({
    fieldCounts: { field1: 10, field2: 5 },
  })),
}));

const fullTestResult = {
  elapsedMs: 100,
  took: 10,
  timed_out: false,
  _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
  hits: {
    hits: [
      {
        _id: '1',
        _index: 'test-index',
        _type: '_doc',
        _score: 1.0,
        _source: { message: 'test message', '@timestamp': '2023-01-01T00:00:00Z' },
      },
    ],
    total: 1,
    max_score: 1.0,
  },
  fieldSchema: [],
};

describe('ExploreDataTable', () => {
  const createMockStore = (hasResults = true) => {
    if (hasResults) {
      resultsCache.set('test-cache-key', fullTestResult as any);
    }
    return configureStore({
      reducer: {
        legacy: legacyReducer,
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
      },
      preloadedState: {
        legacy: {
          savedSearch: 'test-search',
          savedQuery: undefined,
          columns: ['@timestamp', 'message'],
          sort: [],
          interval: '1h',
          isDirty: false,
          lineCount: undefined,
        },
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        ui: {
          activeTabId: 'logs',
          showHistogram: true,
        },
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: {
            id: 'test-dataset',
            title: 'test-dataset',
            type: 'INDEX_PATTERN',
          },
        },
        results: hasResults
          ? {
              'test-cache-key': {
                total: 1,
                elapsedMs: 100,
                fieldSchema: [],
                hasResults: true,
              },
            }
          : {},
      },
    });
  };

  const renderComponent = (hasResults = true) => {
    const store = createMockStore(hasResults);
    return render(
      <Provider store={store}>
        <ExploreDataTable />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.spyOn(useFlavorHooks, 'useFlavorId').mockReturnValue(ExploreFlavor.Logs);
  });

  afterEach(() => {
    clearResultsCache();
  });

  // The table's sticky column header ends at 130 px on screen, so rows show from 130 px down.
  const renderScrolledTable = (scrollTop = 1000) => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExploreDataTable />
      </Provider>
    );
    const container = screen.getByTestId('discoverTable');
    screen.getByTestId('mockHeader').getBoundingClientRect = () =>
      ({ top: 100, bottom: 130 }) as DOMRect;
    container.scrollTop = scrollTop;
    return { store, container };
  };
  // The rect is read on each call, so a row can report one place before the switch redraws the
  // table and another after.
  const placeRow = (id: string, rectFor: () => { top: number; bottom: number }) => {
    screen.getByTestId(id).getBoundingClientRect = () => rectFor() as DOMRect;
  };
  const drawnSettings = () => screen.getByTestId('data-table').dataset.jsonTreeSettings;

  it('passes the JSON Table settings from the store to the cells, Show on by default', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExploreDataTable />
      </Provider>
    );
    expect(drawnSettings()).toBe('true,false');

    act(() => {
      store.dispatch(setShowJsonFormat(false));
    });
    expect(drawnSettings()).toBe('false,false');
    act(() => {
      store.dispatch(setExpandAllJson(true));
    });
    expect(drawnSettings()).toBe('false,true');
    act(() => {
      store.dispatch(setShowJsonFormat(true));
    });
    expect(drawnSettings()).toBe('true,true');
  });

  it.each([
    ['Expand all turns on', setExpandAllJson(true), 'true,true'],
    ['Show as JSON format turns off', setShowJsonFormat(false), 'false,false'],
  ])('moves the row being read to the top of the table when %s', (_, action, settingsAfter) => {
    const { store, container } = renderScrolledTable();
    // The second row sits right below the header, where an earlier move leaves it, and the switch
    // grows the first row by 600 px. The table must scroll 600 px to bring the second row back.
    const secondRowTop = () => (drawnSettings() === settingsAfter ? 730 : 130);
    placeRow('mockFirstRow', () => ({ top: -400, bottom: secondRowTop() }));
    placeRow('mockSecondRow', () => ({ top: secondRowTop(), bottom: secondRowTop() + 40 }));

    act(() => {
      store.dispatch(action);
    });

    expect(container.scrollTop).toBe(1600);
  });

  it('ignores a sliver of a pixel or less that an earlier move left showing', () => {
    const { store, container } = renderScrolledTable();
    // Three quarters of a pixel of the first row still show below the header, which the reader
    // cannot see, so the second row is the one moved to the top of the table.
    const secondRowTop = () => (drawnSettings() === 'true,true' ? 730.75 : 130.75);
    placeRow('mockFirstRow', () => ({ top: -400, bottom: secondRowTop() }));
    placeRow('mockSecondRow', () => ({ top: secondRowTop(), bottom: secondRowTop() + 40 }));

    act(() => {
      store.dispatch(setExpandAllJson(true));
    });

    expect(container.scrollTop).toBe(1600.75);
  });

  it('counts a row with two pixels still showing below the header', () => {
    const { store, container } = renderScrolledTable();
    // Two pixels of the first row show below the header, so the reader is still on it. The switch
    // grows it by 600 px, and its top moves 530 px down to the top of the table.
    const firstRowBottom = () => (drawnSettings() === 'true,true' ? 732 : 132);
    placeRow('mockFirstRow', () => ({ top: -400, bottom: firstRowBottom() }));
    placeRow('mockSecondRow', () => ({ top: firstRowBottom(), bottom: firstRowBottom() + 40 }));

    act(() => {
      store.dispatch(setExpandAllJson(true));
    });

    expect(container.scrollTop).toBe(470);
  });

  it('moves a row running through the top of the table to the top', () => {
    const { store, container } = renderScrolledTable();
    // The second row starts 930 px above the header and runs on below it, so the reader is in it.
    placeRow('mockFirstRow', () => ({ top: -900, bottom: -800 }));
    placeRow('mockSecondRow', () => ({ top: -800, bottom: 300 }));

    act(() => {
      store.dispatch(setExpandAllJson(true));
    });

    expect(container.scrollTop).toBe(70);
  });

  it('moves the log row an expanded row belongs to when the reader is in the expanded row', () => {
    // Starts at 2000 so the 1030 px move up stays inside the scroll range.
    const { store, container } = renderScrolledTable(2000);
    // The expanded row runs through the top of the table, and its log row starts 1030 px above the
    // header.
    placeRow('mockFirstRow', () => ({ top: -900, bottom: -300 }));
    placeRow('mockExpandedRow', () => ({ top: -300, bottom: 900 }));

    act(() => {
      store.dispatch(setExpandAllJson(true));
    });

    expect(container.scrollTop).toBe(970);
  });

  it('leaves the scroll alone when a table setting other than the JSON switches changes', () => {
    const { store, container } = renderScrolledTable();
    placeRow('mockFirstRow', () => ({ top: -400, bottom: 180 }));
    placeRow('mockSecondRow', () => ({ top: 180, bottom: 220 }));

    act(() => {
      store.dispatch(setWrapCellText(true));
    });

    expect(container.scrollTop).toBe(1000);
  });

  it('renders the explore data table container', () => {
    renderComponent();
    expect(screen.getByTestId('discoverTable')).toBeInTheDocument();
  });

  it('renders data table with results when data is available', () => {
    renderComponent(true);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Data Table with 1 rows')).toBeInTheDocument();
  });

  it('renders data table with no results when no data is available', () => {
    renderComponent(false);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Data Table with 0 rows')).toBeInTheDocument();
  });

  it('applies correct container properties', () => {
    renderComponent();
    const container = screen.getByTestId('discoverTable');
    expect(container).toHaveAttribute('data-render-complete', 'true');
    expect(container).toHaveAttribute('data-shared-item', '');
    expect(container).toHaveAttribute('data-title', 'test-search');
    expect(container).toHaveAttribute('data-description', 'test-search');
    expect(container).toHaveClass('eui-xScrollWithShadows');
  });
});
