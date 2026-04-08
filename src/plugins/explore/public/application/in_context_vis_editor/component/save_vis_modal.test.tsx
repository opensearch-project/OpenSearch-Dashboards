/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveVisModal } from './save_vis_modal';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';

jest.mock('../../utils/hooks/use_saved_explore', () => ({ useSavedExplore: jest.fn() }));

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => <>{defaultMessage}</>,
}));

jest.mock('../../../components/visualizations/style_panel/utils', () => ({
  DebouncedFieldText: ({ onChange, placeholder }: any) => (
    <input
      data-test-subj="title-input"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockSavedExplore = { id: undefined, title: '' };
const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: mockSavedExplore });
});

const renderModal = (savedExploreId: string | undefined = undefined) =>
  render(
    <SaveVisModal
      savedExploreId={savedExploreId}
      onConfirm={mockOnConfirm}
      onCancel={mockOnCancel}
    />
  );

describe('SaveVisModal', () => {
  it('renders modal ', () => {
    renderModal();
    expect(screen.getByTestId('saveVisModalTitle')).toHaveTextContent('Save your visualization');
    expect(screen.getByTestId('saveVisandBackToDashboardCancelButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveVisandBackToDashboardConfirmButton')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('saveVisandBackToDashboardCancelButton'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables save button when title is empty', () => {
    (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: { id: undefined, title: '' } });
    renderModal();
    expect(screen.getByTestId('saveVisandBackToDashboardConfirmButton')).toBeDisabled();
  });

  it('calls onConfirm when save button is clicked', async () => {
    (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: { id: undefined, title: '' } });
    renderModal();

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.click(screen.getByTestId('saveVisandBackToDashboardConfirmButton'));

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          savedExplore: mockSavedExplore,
          newTitle: 'New Title',
          isTitleDuplicateConfirmed: false,
          onTitleDuplicate: expect.any(Function),
        })
      );
    });
  });

  it('shows duplicate title warning when onTitleDuplicate is called', async () => {
    (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: { id: undefined, title: '' } });
    mockOnConfirm.mockImplementationOnce(async ({ onTitleDuplicate }) => {
      onTitleDuplicate();
    });
    renderModal();
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'New Title' } });
    fireEvent.click(screen.getByTestId('saveVisandBackToDashboardConfirmButton'));
    await waitFor(() => {
      expect(screen.getByTestId('titleDupicateWarnMsg')).toBeInTheDocument();
    });
  });
});
