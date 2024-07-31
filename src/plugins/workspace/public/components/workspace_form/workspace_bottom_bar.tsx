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
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState, useCallback } from 'react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { WorkspaceCancelModal } from './workspace_cancel_modal';
import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';

interface WorkspaceBottomBarProps {
  formId: string;
  application: ApplicationStart;
  numberOfChanges: number;
  numberOfErrors: number;
  handleResetForm: () => void;
}

export const WorkspaceBottomBar = ({
  formId,
  numberOfChanges,
  numberOfErrors,
  application,
  handleResetForm,
}: WorkspaceBottomBarProps) => {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const closeCancelModal = useCallback(() => setIsCancelModalVisible(false), []);

  return (
    <div>
      <EuiBottomBar left={50}>
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
      {isCancelModalVisible && (
        <WorkspaceCancelModal application={application} closeCancelModal={closeCancelModal} />
      )}
    </div>
  );
};
