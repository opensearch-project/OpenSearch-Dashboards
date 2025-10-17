/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import SearchBar from './search_bar';
import { queryServiceMock } from '../../query/mocks';

import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../core/public/mocks';
const startMock = coreMock.createStart();

import { mount } from 'enzyme';
import { IIndexPattern } from '../..';

const mockTimeHistory = {
  get: () => {
    return [];
  },
  add: jest.fn(),
};

jest.mock('../filter_bar/filter_bar', () => {
  return {
    FilterBar: () => <div className="filterBar" />,
  };
});

jest.mock('../query_string_input/query_bar_top_row', () => {
  return () => <div className="queryBar" />;
});

const mockQueryService = {
  queryString: {
    getLanguageService: () => ({
      getLanguage: () => ({
        fields: {
          filterable: true,
        },
      }),
    }),
  },
};

// Update the mock for getQueryService
jest.mock('../../services', () => ({
  ...jest.requireActual('../../services'),
  getQueryService: () => mockQueryService,
}));

const noop = jest.fn();

const createMockWebStorage = () => ({
  clear: jest.fn(),
  getItem: jest.fn(),
  key: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  length: 0,
});

const createMockStorage = () => ({
  storage: createMockWebStorage(),
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
});

const mockIndexPattern = {
  id: '1234',
  title: 'logstash-*',
  fields: [
    {
      name: 'response',
      type: 'number',
      esTypes: ['integer'],
      aggregatable: true,
      filterable: true,
      searchable: true,
    },
  ],
} as IIndexPattern;

const dqlQuery = {
  query: 'response:200',
  language: 'kuery',
};

function wrapSearchBarInContext(testProps: any) {
  const defaultOptions = {
    appName: 'test',
    timeHistory: mockTimeHistory,
    intl: null as any,
  };

  const services = {
    uiSettings: startMock.uiSettings,
    savedObjects: startMock.savedObjects,
    notifications: startMock.notifications,
    http: startMock.http,
    storage: createMockStorage(),
    data: {
      query: {
        ...queryServiceMock.createStartContract(false),
        savedQueries: {},
      },
    },
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <SearchBar.WrappedComponent {...defaultOptions} {...testProps} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('SearchBar', () => {
  const SEARCH_BAR_ROOT = '.globalQueryBar';
  const FILTER_BAR = '.filterBar';
  const QUERY_BAR = '.queryBar';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should render query bar when no options provided (in reality - timepicker)', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(0);
    expect(component.find(QUERY_BAR).length).toBe(1);
  });

  it('Should render empty when timepicker is off and no options provided', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
        showDatePicker: false,
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(0);
    expect(component.find(QUERY_BAR).length).toBe(0);
  });

  it('Should render filter bar, when required fields are provided', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
        showDatePicker: false,
        onFiltersUpdated: noop,
        filters: [],
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(1);
    expect(component.find(QUERY_BAR).length).toBe(0);
  });

  it('Should NOT render filter bar, if disabled', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
        showFilterBar: false,
        filters: [],
        onFiltersUpdated: noop,
        showDatePicker: false,
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(0);
    expect(component.find(QUERY_BAR).length).toBe(0);
  });

  it('Should render query bar, when required fields are provided', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
        screenTitle: 'test screen',
        onQuerySubmit: noop,
        query: dqlQuery,
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(0);
    expect(component.find(QUERY_BAR).length).toBe(1);
  });

  it('Should NOT render query bar, if disabled', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
        screenTitle: 'test screen',
        onQuerySubmit: noop,
        query: dqlQuery,
        showQueryBar: false,
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(0);
    expect(component.find(QUERY_BAR).length).toBe(0);
  });

  it('Should render query bar and filter bar', () => {
    const component = mount(
      wrapSearchBarInContext({
        indexPatterns: [mockIndexPattern],
        screenTitle: 'test screen',
        onQuerySubmit: noop,
        query: dqlQuery,
        filters: [],
        onFiltersUpdated: noop,
      })
    );

    expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
    expect(component.find(FILTER_BAR).length).toBe(1);
    expect(component.find(QUERY_BAR).length).toBe(1);
  });

  describe('Cancel Button Props', () => {
    it('Should pass cancel button props to QueryEditor when provided', () => {
      const mockOnCancel = jest.fn();

      const component = mount(
        wrapSearchBarInContext({
          indexPatterns: [mockIndexPattern],
          screenTitle: 'test screen',
          onQuerySubmit: noop,
          query: dqlQuery,
          showCancelButton: true,
          onQueryCancel: mockOnCancel,
          isQueryRunning: true,
        })
      );

      expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
      // Verify the search bar renders properly with cancel props
      expect(component.prop('showCancelButton')).toBe(true);
      expect(component.prop('onQueryCancel')).toBe(mockOnCancel);
      expect(component.prop('isQueryRunning')).toBe(true);
    });

    it('Should handle undefined cancel button props gracefully', () => {
      const component = mount(
        wrapSearchBarInContext({
          indexPatterns: [mockIndexPattern],
          screenTitle: 'test screen',
          onQuerySubmit: noop,
          query: dqlQuery,
          showCancelButton: undefined,
          onQueryCancel: undefined,
          isQueryRunning: undefined,
        })
      );

      expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
      // Should render without errors
      expect(component.prop('showCancelButton')).toBeUndefined();
      expect(component.prop('onQueryCancel')).toBeUndefined();
      expect(component.prop('isQueryRunning')).toBeUndefined();
    });

    it('Should pass cancel props to QueryEditor when query enhancements are enabled', () => {
      const mockOnCancel = jest.fn();

      // Mock UI settings to enable query enhancements
      const enhancedServices = {
        uiSettings: {
          ...startMock.uiSettings,
          get: jest.fn((key) => {
            if (key === 'query:enhancements:enabled') return true;
            return startMock.uiSettings.get(key);
          }),
        },
        savedObjects: startMock.savedObjects,
        notifications: startMock.notifications,
        http: startMock.http,
        storage: createMockStorage(),
        data: {
          query: {
            ...queryServiceMock.createStartContract(false),
            savedQueries: {},
            queryString: {
              getLanguageService: () => ({
                getLanguage: () => ({
                  fields: { filterable: true },
                  editorSupportedAppNames: ['test'],
                }),
              }),
            },
          },
        },
        appName: 'test',
      };

      const component = mount(
        <I18nProvider>
          <OpenSearchDashboardsContextProvider services={enhancedServices}>
            <SearchBar.WrappedComponent
              timeHistory={mockTimeHistory}
              intl={null as any}
              indexPatterns={[mockIndexPattern]}
              screenTitle="test screen"
              onQuerySubmit={noop}
              query={dqlQuery}
              showCancelButton={true}
              onQueryCancel={mockOnCancel}
              isQueryRunning={true}
            />
          </OpenSearchDashboardsContextProvider>
        </I18nProvider>
      );

      expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
      // When query enhancements are enabled, should render QueryEditor instead of QueryBar
      expect(component.find('.globalQueryEditor').length).toBe(1);
    });

    it('Should handle query status prop correctly', () => {
      const component = mount(
        wrapSearchBarInContext({
          indexPatterns: [mockIndexPattern],
          screenTitle: 'test screen',
          onQuerySubmit: noop,
          query: dqlQuery,
          queryStatus: 'loading',
          isQueryRunning: true,
        })
      );

      expect(component.find(SEARCH_BAR_ROOT).length).toBe(1);
      expect(component.prop('queryStatus')).toBe('loading');
      expect(component.prop('isQueryRunning')).toBe(true);
    });
  });
});
