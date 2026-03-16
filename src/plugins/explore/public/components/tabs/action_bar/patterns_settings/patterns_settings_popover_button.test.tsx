/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector, useDispatch } from 'react-redux';
import { PatternsSettingsPopoverButton } from './patterns_settings_popover_button';
import { gatherOptions } from './patterns_settings_popover_content';
import { useDatasetContext } from '../../../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { setPatternsField } from '../../../../application/utils/state_management/slices/tab/tab_slice';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectPatternsField: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/slices/tab/tab_slice', () => ({
  setPatternsField: jest.fn(() => ({ type: 'test/setPatternsField' })),
}));

jest.mock('../../../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(() => ({ type: 'test/executeQueries' })),
}));

jest.mock('./patterns_settings_popover_content', () => ({
  gatherOptions: jest.fn(),
}));

jest.mock('../../../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

describe('PatternsSettingsPopoverButton', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: {} });
    (useDatasetContext as jest.Mock).mockReturnValue({ dataset: undefined });
    (gatherOptions as jest.Mock).mockReturnValue([]);
    (useSelector as jest.Mock).mockReturnValue(null);
  });

  it('renders the label and combobox', () => {
    (gatherOptions as jest.Mock).mockReturnValue([
      { value: 'field1', text: 'field1' },
      { value: 'field2', text: 'field2' },
    ]);
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverButton />);

    expect(screen.getByText('Patterns field')).toBeInTheDocument();
  });

  it('renders with no selected field when patternsField is null', () => {
    (gatherOptions as jest.Mock).mockReturnValue([{ value: 'field1', text: 'field1' }]);
    (useSelector as jest.Mock).mockReturnValue(null);

    render(<PatternsSettingsPopoverButton />);

    expect(screen.getByText('Patterns field')).toBeInTheDocument();
  });

  it('renders with empty options when gatherOptions returns empty', () => {
    (gatherOptions as jest.Mock).mockReturnValue([]);
    (useSelector as jest.Mock).mockReturnValue(null);

    render(<PatternsSettingsPopoverButton />);

    expect(screen.getByText('Patterns field')).toBeInTheDocument();
  });

  it('shows the selected field value in the combobox', () => {
    (gatherOptions as jest.Mock).mockReturnValue([
      { value: 'field1', text: 'field1' },
      { value: 'field2', text: 'field2' },
    ]);
    (useSelector as jest.Mock).mockReturnValue('field2');

    render(<PatternsSettingsPopoverButton />);

    expect(screen.getByText('field2')).toBeInTheDocument();
  });

  it('dispatches setPatternsField and executeQueries when a field is selected', async () => {
    const user = userEvent.setup();
    const mockServices = { data: {} };
    (gatherOptions as jest.Mock).mockReturnValue([
      { value: 'field1', text: 'field1' },
      { value: 'field2', text: 'field2' },
    ]);
    (useSelector as jest.Mock).mockReturnValue('field1');
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });

    render(<PatternsSettingsPopoverButton />);

    // Open the combobox by clicking the input area
    const comboboxInput = screen.getByRole('textbox');
    await user.click(comboboxInput);
    await user.type(comboboxInput, 'field2');

    // Select the option by role
    const option = await screen.findByRole('option', { name: /field2/ });
    await user.click(option);

    expect(setPatternsField).toHaveBeenCalledWith('field2');
    expect(mockDispatch).toHaveBeenCalled();

    await waitFor(() => {
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    });
  });
});
