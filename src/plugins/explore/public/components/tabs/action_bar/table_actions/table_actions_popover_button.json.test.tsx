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
import { resetFormatJsonForTests } from '../../../data_table/table_cell/json_tree/format_json_setting';

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
    resetFormatJsonForTests();
  });

  it('formats JSON by default and offers expand/collapse all', () => {
    openMenu({});
    expect(screen.getByTestId('exploreFormatJsonSwitch')).toBeChecked();
    fireEvent.click(screen.getByTestId('exploreExpandAllJson'));
    expect(expandAllJsonTrees).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('exploreCollapseAllJson'));
    expect(collapseAllJsonTrees).toHaveBeenCalled();
  });

  it('uses the choice remembered in the browser and hides expand/collapse all when off', () => {
    window.localStorage.setItem('explore:formatJson', 'false');
    openMenu({});
    expect(screen.getByTestId('exploreFormatJsonSwitch')).not.toBeChecked();
    expect(screen.queryByTestId('exploreExpandAllJson')).not.toBeInTheDocument();
  });

  it('remembers the choice in the browser and keeps it out of the UI (URL) state', () => {
    const store = openMenu({});
    fireEvent.click(screen.getByTestId('exploreFormatJsonSwitch'));
    expect(screen.getByTestId('exploreFormatJsonSwitch')).not.toBeChecked();
    expect(window.localStorage.getItem('explore:formatJson')).toBe('false');
    expect(store.getActions()).toEqual([]);
  });
});
