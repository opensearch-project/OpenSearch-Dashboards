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

import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  useDisplayedColumns,
  useDisplayedColumnNames,
  useHiddenColumnCount,
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
        false
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
        false
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
