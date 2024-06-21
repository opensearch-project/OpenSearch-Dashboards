/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState, useCallback } from 'react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { WorkspaceCancelModal } from './workspace_cancel_modal';

interface WorkspaceBottomBarProps {
  formId: string;
  application: ApplicationStart;
  numberOfChanges: number;
}

export const WorkspaceBottomBar = ({
  formId,
  numberOfChanges,
  application,
}: WorkspaceBottomBarProps) => {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const closeCancelModal = useCallback(() => setIsCancelModalVisible(false), []);
  const showCancelModal = useCallback(() => setIsCancelModalVisible(true), []);

  return (
    <div>
      <EuiSpacer size="xl" />
      <EuiSpacer size="xl" />
      <EuiBottomBar>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s">
              {numberOfChanges > 0 && (
                <EuiText textAlign="left">
                  {i18n.translate('workspace.form.bottomBar.unsavedChanges', {
                    defaultMessage: '{numberOfChanges} Unsaved change(s)',
                    values: {
                      numberOfChanges,
                    },
                  })}
                </EuiText>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m">
              <EuiButtonEmpty
                color="ghost"
                onClick={showCancelModal}
                data-test-subj="workspaceForm-bottomBar-cancelButton"
              >
                {i18n.translate('workspace.form.bottomBar.cancel', {
                  defaultMessage: 'Cancel',
                })}
              </EuiButtonEmpty>
              <EuiSpacer />
              <EuiButton
                form={formId}
                type="submit"
                fill
                color="primary"
                data-test-subj="workspaceForm-bottomBar-updateButton"
              >
                {i18n.translate('workspace.form.bottomBar.saveChanges', {
                  defaultMessage: 'Save changes',
                })}
              </EuiButton>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
      {isCancelModalVisible && (
        <WorkspaceCancelModal application={application} closeCancelModal={closeCancelModal} />
      )}
    </div>
  );
};
