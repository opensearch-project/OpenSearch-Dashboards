/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedQueryManagementComponent } from './saved_query_management_component';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';
import { Query } from 'src/plugins/data/common';
import { SavedQueryAttributes } from '../../query';

const mockOpenFlyout = jest.fn();

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  // Spread the real module: the rest of `data/public` pulls other helpers (e.g.
  // `withOpenSearchDashboards`) out of it at import time.
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({
    services: { overlays: { openFlyout: mockOpenFlyout }, notifications: {} },
  }),
  // Hand back the element itself so the flyout's props can be inspected.
  toMountPoint: (node: unknown) => node,
}));

const mockProps = () => ({
  savedQueryService: {
    saveQuery: jest.fn(),
    getAllSavedQueries: jest.fn(),
    findSavedQueries: jest.fn(),
    getSavedQuery: jest.fn(),
    deleteSavedQuery: jest.fn(),
    getSavedQueryCount: jest.fn(),
  },
  onInitiateSave: jest.fn(),
  onInitiateSaveAsNew: jest.fn(),
  onLoad: jest.fn(),
  onClearSavedQuery: jest.fn(),
  closeMenuPopover: jest.fn(),
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
  saveQuery: jest.fn(),
});

describe('Saved query management component', () => {
  it('should render without errors', () => {
    const props = mockProps();
    const wrapper = shallowWithIntl(<SavedQueryManagementComponent {...props} />);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call onInitiateSave when save button is clicked', () => {
    const props = mockProps();
    const wrapper = shallowWithIntl(<SavedQueryManagementComponent {...props} />);
    const saveButton = wrapper
      .find('[data-test-subj="saved-query-management-save-changes-button"]')
      .at(0);
    saveButton.simulate('click');
    expect(props.onInitiateSave).toHaveBeenCalled();
    expect(props.closeMenuPopover).toHaveBeenCalled();
  });

  it('should call onInitiateSaveAsNew when save as new button is clicked', () => {
    const props = mockProps();
    const wrapper = shallowWithIntl(<SavedQueryManagementComponent {...props} />);
    const saveAsNewButton = wrapper
      .find('[data-test-subj="saved-query-management-save-as-new-button"]')
      .at(0);
    saveAsNewButton.simulate('click');
    expect(props.onInitiateSaveAsNew).toHaveBeenCalled();
  });

  it('should call onClearSavedQuery when clear saved query button is clicked', () => {
    const props = mockProps();
    const wrapper = shallowWithIntl(<SavedQueryManagementComponent {...props} />);
    const clearSavedQueryButton = wrapper.find(
      '[data-test-subj="saved-query-management-clear-button"]'
    );
    clearSavedQueryButton.simulate('click');
    expect(props.onClearSavedQuery).toHaveBeenCalled();
  });

  describe('onRecentQueryRun (new saved query UI)', () => {
    // Opens the flyout the same way a user would, then reads the props off the element handed to
    // `overlays.openFlyout` — `toMountPoint` is mocked to the identity function above.
    const openFlyoutProps = (extraProps = {}) => {
      const props = mockProps();
      props.savedQueryService.findSavedQueries.mockResolvedValue({ total: 0, queries: [] });

      const wrapper = shallowWithIntl(
        <SavedQueryManagementComponent {...props} useNewSavedQueryUI={true} {...extraProps} />
      );
      wrapper.find('[data-test-subj="saved-query-management-open-button"]').at(0).simulate('click');

      expect(mockOpenFlyout).toHaveBeenCalledTimes(1);
      return mockOpenFlyout.mock.calls[0][0].props;
    };

    beforeEach(() => {
      mockOpenFlyout.mockClear();
    });

    it('forwards onRecentQueryRun to the flyout', () => {
      const onRecentQueryRun = jest.fn();

      expect(openFlyoutProps({ onRecentQueryRun }).onRecentQueryRun).toBe(onRecentQueryRun);
    });

    // Legacy callers omit it, and the flyout derives the Recent queries tab from its presence.
    it('leaves onRecentQueryRun undefined when the caller omits it', () => {
      expect(openFlyoutProps().onRecentQueryRun).toBeUndefined();
    });
  });
});
