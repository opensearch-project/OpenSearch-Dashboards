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
  filters: [
    {
      meta: {
        alias: null,
        disabled: false,
        negate: false,
      },
    },
  ],
  indexPatterns: [],
  useSaveQueryMenu: false,
});

describe('Filter options menu', () => {
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

  it("render saved query panel with 'saved queries' button", () => {
    const wrapper = mountWithIntl(<FilterOptions {...mockProps()} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const saveQueryButton = wrapper.find('[data-test-subj="savedQueries"]').at(0);
    expect(saveQueryButton.exists()).toBeTruthy();
    saveQueryButton.simulate('click');
    expect(wrapper.find('[data-test-subj="save-query-panel"]').exists()).toBeTruthy();
  });

  it('should call onFiltersUpdated when enable all filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const enableAllFiltersButton = wrapper.find('[data-test-subj="enableAllFilters"]').at(0);
    enableAllFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });

  it('should call onFiltersUpdated when disable all filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const disableAllFiltersButton = wrapper.find('[data-test-subj="disableAllFilters"]').at(0);
    disableAllFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });

  it('should call onFiltersUpdated when pin all filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const pinAllFiltersButton = wrapper.find('[data-test-subj="pinAllFilters"]').at(0);
    pinAllFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });

  it('should call onFiltersUpdated when unpin all filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const unpinAllFiltersButton = wrapper.find('[data-test-subj="unpinAllFilters"]').at(0);
    unpinAllFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });

  it('should call onFiltersUpdated when Invert all filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const invertAllFiltersButton = wrapper
      .find('[data-test-subj="invertInclusionAllFilters"]')
      .at(0);
    invertAllFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });

  it('should call onFiltersUpdated when Invert enabled/disabled filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const invertEnabledDisabledFiltersButton = wrapper
      .find('[data-test-subj="invertEnableDisableAllFilters"]')
      .at(0);
    invertEnabledDisabledFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });

  it('should call onFiltersUpdated when remove all filters button is clicked', () => {
    const props = mockProps();
    const wrapper = mountWithIntl(<FilterOptions {...props} />);
    const button = wrapper.find('[data-test-subj="showFilterActions"]').at(0);
    button.simulate('click');
    wrapper.update();
    const removeAllFiltersButton = wrapper.find('[data-test-subj="removeAllFilters"]').at(0);
    removeAllFiltersButton.simulate('click');
    expect(props.onFiltersUpdated).toHaveBeenCalled();
  });
});
