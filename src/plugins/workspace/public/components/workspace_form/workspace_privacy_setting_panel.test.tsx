/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { privacyType2TextMap, WorkspacePrivacyItemType } from './constants';
import {
  WorkspacePrivacySettingPanel,
  WorkspacePrivacySettingProps,
} from './workspace_privacy_setting_panel';

const setup = (options?: Partial<WorkspacePrivacySettingProps>) => {
  const onPrivacyTypeChangeMock = jest.fn();
  const onGoToCollaboratorsChangeMock = jest.fn();
  const renderResult = render(
    <WorkspacePrivacySettingPanel
      privacyType={WorkspacePrivacyItemType.PrivateToCollaborators}
      onPrivacyTypeChange={onPrivacyTypeChangeMock}
      goToCollaborators={false}
      onGoToCollaboratorsChange={onGoToCollaboratorsChangeMock}
      {...options}
    />
  );
  return {
    renderResult,
    onPrivacyTypeChangeMock,
    onGoToCollaboratorsChangeMock,
  };
};

describe('WorkspaceCollaboratorPrivacySettingPanel', () => {
  it('should show private to collaborators as default', () => {
    const { renderResult } = setup();
    expect(
      renderResult.getByText(
        privacyType2TextMap[WorkspacePrivacyItemType.PrivateToCollaborators].title,
        { exact: false }
      )
    ).toBeInTheDocument();

    expect(
      renderResult
        .getByText(privacyType2TextMap[WorkspacePrivacyItemType.PrivateToCollaborators].title, {
          exact: false,
        })
        .closest('.euiCheckableCard')
    ).toHaveClass('euiCheckableCard-isChecked');
  });

  it('should call onPrivacyTypeChange when choosing a new privacy type', async () => {
    const { renderResult, onPrivacyTypeChangeMock } = setup();

    expect(onPrivacyTypeChangeMock).not.toHaveBeenCalled();
    const anyOneCanViewCard = renderResult.getAllByTestId('workspace-privacyType-Card')[1];

    fireEvent.click(anyOneCanViewCard);
    await waitFor(() => {
      expect(onPrivacyTypeChangeMock).toHaveBeenCalledWith(WorkspacePrivacyItemType.AnyoneCanView);
    });
  });

  it('should call onGoToCollaboratorsChange with the checkbox checked on', async () => {
    const { renderResult, onGoToCollaboratorsChangeMock } = setup();

    expect(onGoToCollaboratorsChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByTestId('jumpToCollaboratorsCheckbox'));
    await waitFor(() => {
      expect(onGoToCollaboratorsChangeMock).toHaveBeenCalledWith(true);
    });
  });
});
