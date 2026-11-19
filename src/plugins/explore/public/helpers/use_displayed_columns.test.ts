/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock react-redux BEFORE any imports - must include connect to avoid breaking react-beautiful-dnd
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
}));

// Mock slices to prevent heavy import chain (QueryExecutionStatus etc.)
jest.mock('../application/utils/state_management/slices', () => ({
  resultsCache: new Map(),
}));

// Mock the specific problematic opensearch_dashboards_react import to avoid EUI chain
jest.mock('../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

// Mock data/public to prevent EUI import chain issues
jest.mock('../../../data/public', () => ({
  UI_SETTINGS: {
    SHORT_DOTS_ENABLE: 'shortDots:enable',
  },
}));

import { act, renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  useDisplayedColumns,
  useDisplayedColumnNames,
  useHiddenColumnCount,
  useIsNonTimeSeries,
  isNonTimeSeriesResult,
  hitCarriesField,
  processDisplayedColumns,
} from './use_displayed_columns';
import { filterColumns } from './view_component_utils/filter_columns';
import { getLegacyDisplayedColumns } from './data_table_helper';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../application/context';

jest.mock('./view_component_utils/filter_columns');
jest.mock('./data_table_helper');
jest.mock('../application/context');
jest.mock('../application/utils/state_management/actions/query_actions', () => ({
  defaultResultsProcessor: jest.fn(),
  defaultPrepareQueryString: jest.fn(),
}));

// Mock the selectors module
jest.mock('../application/utils/state_management/selectors', () => ({
  selectColumns: jest.fn(),
  selectHideEmptyFields: jest.fn(),
}));

import {
  selectColumns,
  selectHideEmptyFields,
} from '../application/utils/state_management/selectors';
import { resultsCache } from '../application/utils/state_management/slices';
import {
  defaultPrepareQueryString,
  defaultResultsProcessor,
} from '../application/utils/state_management/actions/query_actions';

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockFilterColumns = filterColumns as jest.MockedFunction<typeof filterColumns>;
const mockGetLegacyDisplayedColumns = getLegacyDisplayedColumns as jest.MockedFunction<
  typeof getLegacyDisplayedColumns
>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;

// Mock dataset
const mockDataset = {
  id: 'test-index',
  title: 'test-index',
  timeFieldName: '@timestamp',
  fields: {
    getAll: () => [],
    getByName: () => null,
  },
  getFieldByName: () => null,
};

// Mock services
const mockServices = {
  uiSettings: {
    get: jest.fn(),
  },
};

describe('useDisplayedColumns', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    } as any);

    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    mockServices.uiSettings.get.mockImplementation((setting) => {
      switch (setting) {
        case 'defaultColumns': // DEFAULT_COLUMNS_SETTING
          return ['_source'];
        case 'discover:modifyColumnsOnSwitch': // MODIFY_COLUMNS_ON_SWITCH
          return true;
        case 'doc_table:hideTimeColumn': // DOC_HIDE_TIME_COLUMN_SETTING
          return false;
        case 'shortDots:enable': // UI_SETTINGS.SHORT_DOTS_ENABLE
          return false;
        default:
          return false;
      }
    });

    // Mock useSelector to return different values based on selector function
    mockUseSelector.mockImplementation((selector) => {
      // Check if this is the selectColumns selector by reference
      if (selector === selectColumns) {
        return ['field1', 'field2'];
      }
      // Mock for the state used in processedResults selector (inline selector in the hook)
      // Return a mock state that the inline selector will process
      return null;
    });
  });

  describe('basic functionality', () => {
    it('should return empty array when dataset is null', () => {
      mockUseDatasetContext.mockReturnValue({ dataset: null } as any);

      const { result } = renderHook(() => useDisplayedColumns());

      expect(result.current).toEqual([]);
    });

    it('should apply filterColumns and getLegacyDisplayedColumns logic', () => {
      const mockFilteredColumns = ['field1', 'field2'];
      const mockDisplayedColumns = [
        {
          name: 'field1',
          displayName: 'Field 1',
          isSortable: true,
          isRemoveable: true,
          colLeftIdx: -1,
          colRightIdx: 1,
        },
        {
          name: 'field2',
          displayName: 'Field 2',
          isSortable: true,
          isRemoveable: true,
          colLeftIdx: 0,
          colRightIdx: -1,
        },
      ];

      mockFilterColumns.mockReturnValue(mockFilteredColumns);
      mockGetLegacyDisplayedColumns.mockReturnValue(mockDisplayedColumns);

      const { result } = renderHook(() => useDisplayedColumns());

      expect(mockFilterColumns).toHaveBeenCalledWith(
        ['field1', 'field2'],
        mockDataset,
        ['_source'],
        true,
        undefined
      );

      expect(mockGetLegacyDisplayedColumns).toHaveBeenCalledWith(
        mockFilteredColumns,
        mockDataset,
        false,
        false,
        true
      );

      expect(result.current).toEqual(mockDisplayedColumns);
    });
  });

  describe('edge case handling', () => {
    it('should add _source when only time field remains', () => {
      const mockFilteredColumns = ['@timestamp'];

      mockFilterColumns.mockReturnValue(mockFilteredColumns);
      mockGetLegacyDisplayedColumns.mockReturnValue([
        {
          name: '@timestamp',
          displayName: 'Time',
          isSortable: true,
          isRemoveable: false,
          colLeftIdx: -1,
          colRightIdx: 0,
        },
        {
          name: '_source',
          displayName: '_source',
          isSortable: false,
          isRemoveable: true,
          colLeftIdx: 0,
          colRightIdx: -1,
        },
      ]);

      renderHook(() => useDisplayedColumns());

      // Verify that the hook adds _source when only time field remains
      expect(mockGetLegacyDisplayedColumns).toHaveBeenCalledWith(
        ['@timestamp', '_source'], // Should include _source
        mockDataset,
        false,
        false,
        true
      );
    });
  });
});

describe('processDisplayedColumns hideEmptyFields', () => {
  // `empty_field` is mapped by the dataset but no document carries it, so its key never appears
  // in _source and it lands in neither count — the shape a wide-schema index actually produces.
  // `sparse_field` is populated on one row out of three.
  const processedResults = {
    hits: { hits: [{}, {}, {}] },
    fieldCounts: { app: 3, sparse_field: 1 },
    nonEmptyFieldCounts: { app: 3, sparse_field: 1 },
  };

  const run = (columns: string[], hideEmptyFields: boolean, results: any = processedResults) => {
    mockFilterColumns.mockReturnValue(columns);
    mockGetLegacyDisplayedColumns.mockReturnValue([]);
    processDisplayedColumns(
      columns,
      mockDataset,
      mockServices.uiSettings,
      results,
      hideEmptyFields
    );
    return mockGetLegacyDisplayedColumns.mock.calls[0][0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockServices.uiSettings.get.mockReturnValue(false);
  });

  it('drops columns that are empty across the whole result set', () => {
    expect(run(['app', 'empty_field'], true)).toEqual(['app']);
  });

  it('keeps sparsely populated columns', () => {
    expect(run(['app', 'sparse_field', 'empty_field'], true)).toEqual(['app', 'sparse_field']);
  });

  it('keeps every column when the toggle is off', () => {
    expect(run(['app', 'empty_field'], false)).toEqual(['app', 'empty_field']);
  });

  it('keeps _source and the time field regardless', () => {
    expect(run(['_source', '@timestamp', 'empty_field'], true)).toEqual(['_source', '@timestamp']);
  });

  it('drops mapped-but-never-populated columns absent from both counts', () => {
    // The regression that shipped first: keying off "absent from fieldCounts" kept every
    // mapping-only field, which is the bulk of what the toggle exists to hide.
    expect(run(['app', 'not_in_results'], true)).toEqual(['app']);
  });

  it('falls back to all columns when every one would be hidden', () => {
    expect(run(['empty_field'], true)).toEqual(['empty_field']);
  });

  it('keeps every column when the result set has no rows to judge from', () => {
    const noRows = { ...processedResults, hits: { hits: [] } };
    expect(run(['app', 'empty_field'], true, noRows)).toEqual(['app', 'empty_field']);
  });

  it('is a no-op without processed results', () => {
    expect(run(['app', 'empty_field'], true, null)).toEqual(['app', 'empty_field']);
  });
});

describe('useDisplayedColumnNames', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    } as any);

    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
    } as any);

    mockServices.uiSettings.get.mockReturnValue(false);

    mockUseSelector.mockImplementation(() => ({
      query: { query: 'test' },
      results: {},
    }));
  });

  it('should return column names from useDisplayedColumns', () => {
    const mockDisplayedColumns = [
      {
        name: 'field1',
        displayName: 'Field 1',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: 1,
      },
      {
        name: 'field2',
        displayName: 'Field 2',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: 0,
        colRightIdx: -1,
      },
    ];

    mockFilterColumns.mockReturnValue(['field1', 'field2']);
    mockGetLegacyDisplayedColumns.mockReturnValue(mockDisplayedColumns);

    const { result } = renderHook(() => useDisplayedColumnNames());

    expect(result.current).toEqual(['field1', 'field2']);
  });

  it('should return empty array when useDisplayedColumns returns empty', () => {
    mockFilterColumns.mockReturnValue([]);
    mockGetLegacyDisplayedColumns.mockReturnValue([]);

    const { result } = renderHook(() => useDisplayedColumnNames());

    expect(result.current).toEqual([]);
  });
});

describe('useHiddenColumnCount', () => {
  const CACHE_KEY = 'cache-key';
  // `empty_field` and `also_empty` are mapped but never populated, so they appear in neither count.
  const processedResults = {
    hits: { hits: [{}, {}, {}] },
    fieldCounts: { app: 3 },
    nonEmptyFieldCounts: { app: 3 },
  };

  const setup = ({
    columns,
    hideEmptyFields,
    hasResults = true,
  }: {
    columns: string[];
    hideEmptyFields: boolean;
    hasResults?: boolean;
  }) => {
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices } as any);
    mockUseDatasetContext.mockReturnValue({ dataset: mockDataset } as any);
    mockServices.uiSettings.get.mockReturnValue(false);

    (defaultPrepareQueryString as jest.Mock).mockReturnValue(CACHE_KEY);
    (defaultResultsProcessor as jest.Mock).mockReturnValue(processedResults);
    resultsCache.clear();
    if (hasResults) resultsCache.set(CACHE_KEY, {} as any);

    const state = {
      query: { query: 'source=logs', language: 'PPL' },
      results: hasResults ? { [CACHE_KEY]: { status: 'READY' } } : {},
    };

    mockUseSelector.mockImplementation((selector: any) => {
      if (selector === selectColumns) return columns;
      if (selector === selectHideEmptyFields) return hideEmptyFields;
      return selector(state);
    });

    // Let the real empty-column filtering run between the two mocked helpers, so the count comes
    // out of the same code path the table uses rather than a stubbed number.
    mockFilterColumns.mockImplementation((rawColumns: any) => rawColumns);
    mockGetLegacyDisplayedColumns.mockImplementation(
      (cols: any) => cols.map((name: string) => ({ name }) as any) as any
    );

    return renderHook(() => useHiddenColumnCount());
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('counts the columns the filter is hiding', () => {
    const { result } = setup({
      columns: ['app', 'empty_field', 'also_empty'],
      hideEmptyFields: true,
    });

    expect(result.current).toBe(2);
  });

  it('is 0 when every chosen column is populated', () => {
    const { result } = setup({ columns: ['app'], hideEmptyFields: true });

    expect(result.current).toBe(0);
  });

  it('is 0 while the setting is off, even with empty columns on screen', () => {
    const { result } = setup({
      columns: ['app', 'empty_field'],
      hideEmptyFields: false,
    });

    expect(result.current).toBe(0);
  });

  it('is 0 before any results have come back', () => {
    const { result } = setup({
      columns: ['app', 'empty_field'],
      hideEmptyFields: true,
      hasResults: false,
    });

    expect(result.current).toBe(0);
  });

  it('does not count the all-empty fallback as hidden columns', () => {
    // Everything would be hidden, so the filter keeps the original set — nothing is actually gone.
    const { result } = setup({ columns: ['empty_field'], hideEmptyFields: true });

    expect(result.current).toBe(0);
  });
});

describe('hitCarriesField', () => {
  it('finds a field present in _source, even when its value is null', () => {
    expect(hitCarriesField({ _source: { '@timestamp': '2026-01-01' } }, '@timestamp')).toBe(true);
    // Schema-driven (PPL) rows carry every schema column; null still means the source has it.
    expect(hitCarriesField({ _source: { '@timestamp': null } }, '@timestamp')).toBe(true);
  });

  it('finds flat dotted keys, nested paths and fields', () => {
    expect(hitCarriesField({ _source: { 'event.time': 1 } }, 'event.time')).toBe(true);
    expect(hitCarriesField({ _source: { event: { time: 1 } } }, 'event.time')).toBe(true);
    expect(hitCarriesField({ _source: {}, fields: { ts: [1] } }, 'ts')).toBe(true);
  });

  it('is false when the field is absent', () => {
    expect(hitCarriesField({ _source: { key: 'a' } }, '@timestamp')).toBe(false);
    expect(hitCarriesField({}, '@timestamp')).toBe(false);
  });
});

describe('isNonTimeSeriesResult', () => {
  const timeDataset = { title: 'logs-a', timeFieldName: '@timestamp' };

  it('is false with no dataset selected', () => {
    expect(isNonTimeSeriesResult({ dataset: undefined, queryString: 'source=x' })).toBe(false);
  });

  it('is true for a dataset without a time field, even before any results arrive', () => {
    // Applies on dataset selection so the tab bar never flashes the time-series set first.
    expect(isNonTimeSeriesResult({ dataset: { title: 'lookup' } })).toBe(true);
    expect(isNonTimeSeriesResult({ dataset: { title: 'lookup', timeFieldName: '' } })).toBe(true);
  });

  it.each([
    'source=logs-a | fields host',
    'source = logs-a | table host',
    'source=logs-a | fields - @timestamp',
    'source=logs-a | stats count() by host',
  ])('is false when the query reads the dataset itself: %s', (queryString) => {
    // Rows without the time field are expected here (a projection or aggregation dropped it);
    // that is not the same as querying outside the dataset.
    expect(
      isNonTimeSeriesResult({
        dataset: timeDataset,
        queryString,
        sourceLacksTimeField: true,
        hitsLackTimeField: true,
      })
    ).toBe(false);
  });

  it('follows the shared source check when it has answered', () => {
    const args = { dataset: timeDataset, queryString: 'source=other', hitsLackTimeField: true };
    expect(isNonTimeSeriesResult({ ...args, sourceLacksTimeField: true })).toBe(true);
    expect(isNonTimeSeriesResult({ ...args, sourceLacksTimeField: false })).toBe(false);
  });

  it('falls back to the returned rows while the source check is pending', () => {
    const args = { dataset: timeDataset, queryString: 'source=other' };
    expect(isNonTimeSeriesResult({ ...args, hitsLackTimeField: true })).toBe(true);
    expect(isNonTimeSeriesResult({ ...args, hitsLackTimeField: false })).toBe(false);
    expect(isNonTimeSeriesResult(args)).toBe(false);
  });

  it('is false for a time-based dataset when the query is not PPL', () => {
    expect(isNonTimeSeriesResult({ dataset: timeDataset, hitsLackTimeField: true })).toBe(false);
  });
});

describe('useIsNonTimeSeries', () => {
  const lookupHits = [{ _source: { key: 'a' } }, { _source: { key: 'b' } }];
  const hostOnlyHits = [{ _source: { host: 'h1' } }];
  const logHits = [{ _source: { '@timestamp': '2026-01-01', host: 'h1' } }];

  let getFieldsForWildcard: jest.Mock;

  // Lets the async field check settle, including the hook's resulting state update.
  const flushCheck = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

  const setup = ({
    dataset = mockDataset as any,
    queryString,
    language = 'PPL',
    hits,
  }: {
    dataset?: any;
    queryString: string;
    language?: string;
    hits?: any[];
  }) => {
    // A fresh index patterns service per test, so the shared checker cache starts empty.
    const indexPatterns = { getFieldsForWildcard };
    mockUseOpenSearchDashboards.mockReturnValue({
      services: { ...mockServices, data: { indexPatterns } },
    } as any);
    mockUseDatasetContext.mockReturnValue({ dataset } as any);
    (defaultPrepareQueryString as jest.Mock).mockImplementation((query: any) => query.query);
    resultsCache.clear();
    if (hits) resultsCache.set(queryString, { hits: { hits } } as any);
    const state = {
      query: {
        query: queryString,
        language,
        dataset: dataset && { title: dataset.title, timeFieldName: dataset.timeFieldName },
      },
      results: hits ? { [queryString]: { status: 'READY' } } : {},
    };
    mockUseSelector.mockImplementation((selector: any) => selector(state));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getFieldsForWildcard = jest.fn(async ({ pattern }: { pattern: string }) => {
      if (pattern === 'logs-b') return [{ name: '@timestamp' }, { name: 'host' }];
      if (pattern === 'lookup') return [{ name: 'key' }];
      throw new Error(`no such index [${pattern}]`);
    });
  });

  it('flags a no-time-field dataset as non-time-series with no results yet', () => {
    setup({ dataset: { ...mockDataset, timeFieldName: undefined }, queryString: 'source=lookup' });
    expect(renderHook(() => useIsNonTimeSeries()).result.current).toBe(true);
  });

  it.each([
    'source=test-index | fields host',
    'source=test-index | table host',
    'source=test-index | fields - @timestamp',
  ])('keeps a projection over the dataset itself time-series: %s', (queryString) => {
    setup({ queryString, hits: hostOnlyHits });
    expect(renderHook(() => useIsNonTimeSeries()).result.current).toBe(false);
    expect(getFieldsForWildcard).not.toHaveBeenCalled();
  });

  it('flags a lookup source queried over a time-based dataset', async () => {
    setup({ queryString: 'source=lookup', hits: lookupHits });
    const { result } = renderHook(() => useIsNonTimeSeries());
    // Rows already show no time field, so the provisional answer matches the final one.
    expect(result.current).toBe(true);
    await flushCheck();
    expect(getFieldsForWildcard).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  it('flags a lookup source once the field check answers, before any rows', async () => {
    setup({ queryString: 'source=lookup' });
    const { result } = renderHook(() => useIsNonTimeSeries());
    await flushCheck();
    expect(result.current).toBe(true);
  });

  it('keeps another index that has the time field time-series, even if rows lack it', async () => {
    setup({ queryString: 'source=logs-b | fields host', hits: hostOnlyHits });
    const { result } = renderHook(() => useIsNonTimeSeries());
    await flushCheck();
    expect(result.current).toBe(false);
    expect(getFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'logs-b',
      dataSourceId: undefined,
    });
  });

  it('treats a failed field check as time-series, as the interceptor applies the filter', async () => {
    setup({ queryString: 'source=remote:logs', hits: logHits });
    const { result } = renderHook(() => useIsNonTimeSeries());
    await flushCheck();
    expect(getFieldsForWildcard).toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it('leaves a time-based dataset with time-stamped rows as time-series', () => {
    setup({ queryString: 'source=test-index', hits: logHits });
    expect(renderHook(() => useIsNonTimeSeries()).result.current).toBe(false);
  });

  it('does not run the results processor', async () => {
    setup({ queryString: 'source=lookup', hits: lookupHits });
    renderHook(() => useIsNonTimeSeries());
    await flushCheck();
    expect(defaultResultsProcessor).not.toHaveBeenCalled();
  });

  it('is false with no dataset selected', () => {
    // null, not undefined: undefined would fall back to setup's default dataset.
    setup({ dataset: null, queryString: 'source=lookup' });
    expect(renderHook(() => useIsNonTimeSeries()).result.current).toBe(false);
    expect(getFieldsForWildcard).not.toHaveBeenCalled();
  });
});
