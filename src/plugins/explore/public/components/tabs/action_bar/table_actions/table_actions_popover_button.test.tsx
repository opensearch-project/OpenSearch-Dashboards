/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { TableActionsPopoverButton } from './table_actions_popover_button';

const mockStore = configureMockStore([]);

const renderWithState = (ui: Partial<{ wrapCellText: boolean; hideEmptyFields: boolean }>) => {
  const store = mockStore({ ui: { activeTabId: 'logs', ...ui } });
  render(
    <Provider store={store}>
      <TableActionsPopoverButton />
    </Provider>
  );
  return store;
};

describe('TableActionsPopoverButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the actions button', () => {
    renderWithState({ wrapCellText: false, hideEmptyFields: true });
    expect(screen.getByTestId('exploreTableActionsButton')).toBeInTheDocument();
  });

  it('keeps both toggles hidden until the menu is opened', () => {
    renderWithState({ wrapCellText: false, hideEmptyFields: true });
    expect(screen.queryByTestId('exploreHideEmptyFieldsSwitch')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exploreWrapCellTextSwitch')).not.toBeInTheDocument();
  });

  it('reflects current state on the toggles', () => {
    renderWithState({ wrapCellText: true, hideEmptyFields: false });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreHideEmptyFieldsSwitch')).not.toBeChecked();
    expect(screen.getByTestId('exploreWrapCellTextSwitch')).toBeChecked();
  });

  it('defaults hide empty fields off when state is missing', () => {
    renderWithState({ wrapCellText: false });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreHideEmptyFieldsSwitch')).not.toBeChecked();
  });

  it('renders an info tooltip explaining hide empty fields', () => {
    renderWithState({ wrapCellText: false, hideEmptyFields: true });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreHideEmptyFieldsInfo')).toBeInTheDocument();
  });

  it('dispatches setHideEmptyFields when toggled', () => {
    const store = renderWithState({ wrapCellText: false, hideEmptyFields: true });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    fireEvent.click(screen.getByTestId('exploreHideEmptyFieldsSwitch'));
    expect(store.getActions()).toContainEqual({
      type: 'ui/setHideEmptyFields',
      payload: false,
    });
  });

  it('dispatches setHideEmptyFields when opted into from the default off state', () => {
    const store = renderWithState({ wrapCellText: false });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    fireEvent.click(screen.getByTestId('exploreHideEmptyFieldsSwitch'));
    expect(store.getActions()).toContainEqual({
      type: 'ui/setHideEmptyFields',
      payload: true,
    });
  });

  it('dispatches setWrapCellText when toggled', () => {
    const store = renderWithState({ wrapCellText: false, hideEmptyFields: true });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    fireEvent.click(screen.getByTestId('exploreWrapCellTextSwitch'));
    expect(store.getActions()).toContainEqual({
      type: 'ui/setWrapCellText',
      payload: true,
    });
  });
});
