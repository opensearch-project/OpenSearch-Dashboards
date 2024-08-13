/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBottomBar,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import ReactDOM from 'react-dom';

interface WorkspaceBottomBarProps {
  formId: string;
  numberOfChanges: number;
  numberOfErrors: number;
  handleResetForm: () => void;
}

export const WorkspaceBottomBar = ({
  formId,
  numberOfChanges,
  numberOfErrors,
  handleResetForm,
}: WorkspaceBottomBarProps) => {
  const applicationElement = document.querySelector('.app-wrapper');
  const bottomBar = (
    <EuiBottomBar position="sticky">
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              {numberOfErrors > 0 && (
                <EuiText textAlign="left" size="s">
                  {i18n.translate('workspace.form.bottomBar.errors', {
                    defaultMessage: '{numberOfChanges} error(s)',
                    values: {
                      numberOfChanges,
                    },
                  })}
                </EuiText>
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {numberOfChanges > 0 && (
                <EuiText textAlign="left" size="s">
                  {i18n.translate('workspace.form.bottomBar.unsavedChanges', {
                    defaultMessage: '{numberOfChanges} Unsaved change(s)',
                    values: {
                      numberOfChanges,
                    },
                  })}
                </EuiText>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty
                iconType="cross"
                color="ghost"
                onClick={handleResetForm}
                data-test-subj="workspaceForm-bottomBar-cancelButton"
              >
                {i18n.translate('workspace.form.bottomBar.disCardChanges', {
                  defaultMessage: 'Discard changes',
                })}
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                form={formId}
                type="submit"
                disabled={numberOfChanges === 0}
                fill
                color="primary"
                data-test-subj="workspaceForm-bottomBar-updateButton"
              >
                {i18n.translate('workspace.form.bottomBar.saveChanges', {
                  defaultMessage: 'Save changes',
                })}
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiBottomBar>
  );
  if (!applicationElement) {
    return bottomBar;
  }

  return ReactDOM.createPortal(bottomBar, applicationElement);
};
