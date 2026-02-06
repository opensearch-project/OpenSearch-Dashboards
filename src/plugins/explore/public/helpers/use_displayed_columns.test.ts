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
import { useDisplayedColumns, useDisplayedColumnNames } from './use_displayed_columns';
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
}));

import { selectColumns } from '../application/utils/state_management/selectors';

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
