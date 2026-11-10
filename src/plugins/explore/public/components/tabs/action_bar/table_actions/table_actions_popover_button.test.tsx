/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { TableActionsPopoverButton } from './table_actions_popover_button';

const mockStore = configureMockStore([]);

const renderWithState = (
  ui: Partial<{
    wrapCellText: boolean;
    hideEmptyFields: boolean;
    showJsonFormat: boolean;
    expandAllJson: boolean;
  }>
) => {
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

  it('turns Show as JSON format on when state is missing, with Expand all off', () => {
    renderWithState({});
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreShowJsonFormatSwitch')).toBeChecked();
    expect(screen.getByTestId('exploreExpandAllJsonSwitch')).not.toBeChecked();
    expect(screen.getByTestId('exploreExpandAllJsonSwitch')).toBeEnabled();
  });

  it('greys out Expand all while Show as JSON format is off', () => {
    renderWithState({ showJsonFormat: false });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreShowJsonFormatSwitch')).not.toBeChecked();
    expect(screen.getByTestId('exploreExpandAllJsonSwitch')).toBeDisabled();
  });

  it('dispatches setShowJsonFormat when toggled off from the default', () => {
    const store = renderWithState({});
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    fireEvent.click(screen.getByTestId('exploreShowJsonFormatSwitch'));
    expect(store.getActions()).toContainEqual({ type: 'ui/setShowJsonFormat', payload: false });
  });

  it('dispatches setExpandAllJson while Show as JSON format is on', () => {
    const store = renderWithState({ showJsonFormat: true });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreShowJsonFormatSwitch')).toBeChecked();
    expect(screen.getByTestId('exploreExpandAllJsonSwitch')).not.toBeChecked();
    expect(screen.getByTestId('exploreExpandAllJsonSwitch')).toBeEnabled();
    fireEvent.click(screen.getByTestId('exploreExpandAllJsonSwitch'));
    expect(store.getActions()).toContainEqual({ type: 'ui/setExpandAllJson', payload: true });
  });

  it('renders info tooltips explaining both JSON settings', () => {
    renderWithState({});
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreShowJsonFormatInfo')).toBeInTheDocument();
    expect(screen.getByTestId('exploreExpandAllJsonInfo')).toBeInTheDocument();
  });

  it('shows both JSON switches on and turns each one off', () => {
    const store = renderWithState({ showJsonFormat: true, expandAllJson: true });
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    expect(screen.getByTestId('exploreShowJsonFormatSwitch')).toBeChecked();
    expect(screen.getByTestId('exploreExpandAllJsonSwitch')).toBeChecked();

    fireEvent.click(screen.getByTestId('exploreExpandAllJsonSwitch'));
    fireEvent.click(screen.getByTestId('exploreShowJsonFormatSwitch'));

    expect(store.getActions()).toContainEqual({ type: 'ui/setExpandAllJson', payload: false });
    expect(store.getActions()).toContainEqual({ type: 'ui/setShowJsonFormat', payload: false });
  });

  it('leaves the JSON switches out on the Traces page, where cells never draw a tree', () => {
    window.history.pushState({}, '', '/app/explore/traces');
    try {
      renderWithState({});
      fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
      expect(screen.getByTestId('exploreWrapCellTextSwitch')).toBeInTheDocument();
      expect(screen.queryByTestId('exploreShowJsonFormatSwitch')).not.toBeInTheDocument();
      expect(screen.queryByTestId('exploreExpandAllJsonSwitch')).not.toBeInTheDocument();
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('puts focus on the first switch when the menu opens, so no tooltip pops open', async () => {
    renderWithState({});
    fireEvent.click(screen.getByTestId('exploreTableActionsButton'));
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('exploreHideEmptyFieldsSwitch'))
    );
  });
});
