/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { TableActionsPopoverButton } from './table_actions_popover_button';
import {
  collapseAllJsonTrees,
  expandAllJsonTrees,
} from '../../../data_table/table_cell/json_tree/json_tree_state';

jest.mock('../../../data_table/table_cell/json_tree/json_tree_state', () => ({
  collapseAllJsonTrees: jest.fn(),
  expandAllJsonTrees: jest.fn(),
}));

const mockStore = configureMockStore([]);

const openMenu = (ui: Record<string, unknown>) => {
  const store = mockStore({ ui: { activeTabId: 'logs', ...ui } });
  render(
    <Provider store={store}>
      <TableActionsPopoverButton />
    </Provider>
  );
  fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
  return store;
};

describe('TableActionsPopoverButton JSON settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('formats JSON by default and offers expand/collapse all', () => {
    openMenu({});
    expect(screen.getByTestId('exploreFormatJsonSwitch')).toBeChecked();
    fireEvent.click(screen.getByTestId('exploreExpandAllJson'));
    expect(expandAllJsonTrees).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('exploreCollapseAllJson'));
    expect(collapseAllJsonTrees).toHaveBeenCalled();
  });

  it('reflects the UI state and hides expand/collapse all when off', () => {
    openMenu({ formatJson: false });
    expect(screen.getByTestId('exploreFormatJsonSwitch')).not.toBeChecked();
    expect(screen.queryByTestId('exploreExpandAllJson')).not.toBeInTheDocument();
  });

  it('uses the choice remembered in the browser when the UI state has none', () => {
    window.localStorage.setItem('explore:formatJson', 'false');
    openMenu({});
    expect(screen.getByTestId('exploreFormatJsonSwitch')).not.toBeChecked();
  });

  it('dispatches setFormatJson and remembers the choice when toggled', () => {
    const store = openMenu({});
    fireEvent.click(screen.getByTestId('exploreFormatJsonSwitch'));
    expect(store.getActions()).toEqual([{ type: 'ui/setFormatJson', payload: false }]);
    expect(window.localStorage.getItem('explore:formatJson')).toBe('false');
  });
});
