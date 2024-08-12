/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FilterOptions } from './filter_options';
import { SavedQueryAttributes } from '../../query';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { Query } from 'src/plugins/data/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

// Mock useOpenSearchDashboards hook
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: (Component: any) => (props: any) => <Component {...props} />,
}));

const mockProps = () => ({
  savedQueryService: {
    saveQuery: jest.fn(),
    getAllSavedQueries: jest.fn(),
    findSavedQueries: jest.fn().mockResolvedValue({ total: 0, queries: [] }),
    getSavedQuery: jest.fn(),
    deleteSavedQuery: jest.fn(),
    getSavedQueryCount: jest.fn(),
  },
  onSave: jest.fn(),
  onSaveAsNew: jest.fn(),
  onLoad: jest.fn(),
  onClearSavedQuery: jest.fn(),
  onFiltersUpdated: jest.fn(),
  showSaveQuery: true,
  loadedSavedQuery: {
    id: '1',
    attributes: {
      name: 'Test Query',
      title: '',
      description: '',
      query: { query: '', language: 'kuery' } as Query,
    } as SavedQueryAttributes,
  },
  filters: [],
  indexPatterns: [],
  useSaveQueryMenu: false,
});

describe('FilterOptions', () => {
  beforeEach(() => {
    // Mocking `uiSettings.get` to return true for `useNewHeader`
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: {
        uiSettings: {
          get: jest.fn((key) => {
            if (key === 'home:useNewHomePage') {
              return true;
            }
            return false;
          }),
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('render menu panel', () => {
    const wrapper = mountWithIntl(<FilterOptions {...mockProps()} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);

    button.simulate('click');
    expect(wrapper.find('[data-test-subj="filter-options-menu-panel"]').exists()).toBeTruthy();
  });

  it("render filter options with 'Add filter' button", () => {
    const wrapper = mountWithIntl(<FilterOptions {...mockProps()} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const addFilterButton = wrapper.find('[data-test-subj="addFilters"]').at(0);
    addFilterButton.simulate('click');
    expect(wrapper.find('[data-test-subj="add-filter-panel"]').exists()).toBeTruthy();
  });

  it("render filter options with 'Save Query' button", () => {
    const wrapper = mountWithIntl(<FilterOptions {...mockProps()} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const saveQueryButton = wrapper
      .find('[data-test-subj="saved-query-management-save-button"]')
      .at(0);
    expect(saveQueryButton.exists()).toBeTruthy();
    saveQueryButton.simulate('click');
    expect(wrapper.find('[data-test-subj="save-query-panel"]').exists()).toBeTruthy();
  });
});
