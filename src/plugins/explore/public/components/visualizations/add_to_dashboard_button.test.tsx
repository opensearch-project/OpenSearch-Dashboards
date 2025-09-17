/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { SaveAndAddButtonWithModal } from './add_to_dashboard_button';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));
import { addToDashboard } from './utils/add_to_dashboard';
import { saveSavedExplore } from '../../helpers/save_explore';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import * as VB from './visualization_builder';

const mockStore = configureMockStore([]);

// mock functions
const mockToastAdd = jest.fn();
const mockGetUrlForApp = jest.fn().mockReturnValue('/app/dashboards#/view/123');
const mockGetTab = jest.fn(() => ({ id: 'mockTab' }));

const mockUseKeyboardShortcut = jest.fn();

const mockServices = {
  core: {
    application: {
      getUrlForApp: mockGetUrlForApp,
    },
  },
  dashboard: {},
  savedObjects: {
    client: {},
  },
  toastNotifications: {
    add: mockToastAdd,
  },
  uiSettings: {
    get: jest.fn().mockReturnValue(false),
  },
  history: jest.fn(() => ({ listen: jest.fn() })),
  data: {
    query: {},
  },
  tabRegistry: {
    getTab: mockGetTab,
  },
  keyboardShortcut: {
    useKeyboardShortcut: mockUseKeyboardShortcut,
  },
};

jest.mock('../../helpers/save_explore', () => ({
  saveSavedExplore: jest.fn(),
}));
jest.mock('./utils/add_to_dashboard', () => ({
  addToDashboard: jest.fn(),
}));
jest.mock('../../saved_explore/transforms', () => ({
  saveStateToSavedObject: jest.fn((...args) => args[0]),
}));
jest.mock('../../application/utils/hooks/use_current_explore_id', () => ({
  useCurrentExploreId: jest.fn(() => 'mockExploreId'),
}));
jest.mock('../../../public/helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(() => 'logs'),
}));
jest.mock('../query_panel/utils/use_search_context', () => {
  return {
    useSearchContext: jest.fn(() => ({
      searchContext: {},
    })),
  };
});

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: mockServices,
  }),
  withOpenSearchDashboards: (component: any) => component,
  toMountPoint: jest.fn(),
}));

jest.mock('./add_to_dashboard_modal', () => ({
  AddToDashboardModal: ({ onCancel, onConfirm }: any) => (
    <div data-test-subj="mock-modal">
      <button onClick={onCancel}>Cancel</button>
      <button
        onClick={() =>
          onConfirm({
            savedExplore: {},
            newTitle: 'Test Explore',
            isTitleDuplicateConfirmed: true,
            onTitleDuplicate: jest.fn(),
            mode: 'new',
            newDashboardName: 'My New Dashboard',
          })
        }
      >
        Confirm
      </button>
    </div>
  ),
}));

const store = mockStore({
  ui: { activeTabId: 'vis' },
});

describe('SaveAndAddButtonWithModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardShortcut.mockClear();
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(
      new VB.VisualizationBuilder({
        getExpressions: jest.fn(),
      })
    );
  });

  it('renders the add button and opens modal on click', async () => {
    render(
      <Provider store={store}>
        <SaveAndAddButtonWithModal dataset={undefined} />
      </Provider>
    );

    const button = screen.getByText('Add to dashboard');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
  });

  it('handles save and shows success toast', async () => {
    const mockedSaveSavedExplore = saveSavedExplore as jest.Mock;
    mockedSaveSavedExplore.mockResolvedValue({ id: 'savedId123' });

    const mockedAddToDashboard = addToDashboard as jest.Mock;
    mockedAddToDashboard.mockResolvedValue('123');

    render(
      <Provider store={store}>
        <SaveAndAddButtonWithModal dataset={undefined} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add to dashboard'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(saveSavedExplore).toHaveBeenCalled();
      expect(addToDashboard).toHaveBeenCalled();
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          color: 'success',
        })
      );
    });
  });

  it('handles save failure and shows error toast', async () => {
    const mockedSaveSavedExplore = saveSavedExplore as jest.Mock;
    mockedSaveSavedExplore.mockRejectedValue(new Error('Save failed'));

    render(
      <Provider store={store}>
        <SaveAndAddButtonWithModal dataset={undefined} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add to dashboard'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          color: 'danger',
        })
      );
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('registers keyboard shortcut correctly', () => {
      render(
        <Provider store={store}>
          <SaveAndAddButtonWithModal dataset={undefined} />
        </Provider>
      );

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'addToDashboard',
        pluginId: 'explore',
        name: 'Add to dashboard',
        category: 'Data actions',
        keys: 'a',
        execute: expect.any(Function),
      });
    });

    it('keyboard shortcut opens modal', () => {
      render(
        <Provider store={store}>
          <SaveAndAddButtonWithModal dataset={undefined} />
        </Provider>
      );

      // Get the execute function from the keyboard shortcut registration
      const keyboardShortcutCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'addToDashboard'
      );
      expect(keyboardShortcutCall).toBeDefined();

      const executeFunction = keyboardShortcutCall[0].execute;

      // Execute the keyboard shortcut
      executeFunction();

      // Verify modal opens
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });
  });
});
