/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiText,
  EuiPanel,
  EuiButton,
  EuiPopover,
  EuiButtonIcon,
  EuiFlexItem,
  EuiIcon,
  EuiFlexGroup,
  EuiHorizontalRule,
  EuiButtonEmpty,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { WorkspacePickerContent } from '../workspace_picker_content/workspace_picker_content';

const defaultHeaderName = i18n.translate('workspace.menu.defaultHeaderName', {
  defaultMessage: 'Workspaces',
});

const createWorkspaceButton = i18n.translate('workspace.menu.button.createWorkspace', {
  defaultMessage: 'Create workspace',
});

const manageWorkspacesButton = i18n.translate('workspace.menu.button.manageWorkspaces', {
  defaultMessage: 'Manage',
});

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceMenu = ({ coreStart, registeredUseCases$ }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
  const availableUseCases = useObservable(registeredUseCases$, []);

  const currentWorkspaceName = currentWorkspace?.name ?? defaultHeaderName;

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const currentWorkspaceButton = (
    <EuiButtonIcon
      iconType="wsSelector"
      onClick={openPopover}
      aria-label="workspace-select-button"
      data-test-subj="workspace-select-button"
    />
  );

  return (
    <EuiPopover
      id="workspaceDropdownMenu"
      display="block"
      button={currentWorkspaceButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="s"
      anchorPosition="downCenter"
      repositionOnScroll={true}
    >
      <EuiPanel hasBorder={false} color="transparent">
        <EuiFlexGroup
          justifyContent="spaceAround"
          alignItems="center"
          direction="column"
          gutterSize="s"
        >
          {currentWorkspace ? (
            <>
              <EuiFlexItem grow={false}>
                <EuiIcon
                  size="xl"
                  data-test-subj={`current-workspace-icon-${getUseCase(currentWorkspace)?.icon}`}
                  type={getUseCase(currentWorkspace)?.icon || 'wsSelector'}
                  color={getValidWorkspaceColor(currentWorkspace.color)}
                />
              </EuiFlexItem>
              <EuiFlexItem
                grow={false}
                data-test-subj="workspace-menu-current-workspace-name"
                style={{ maxWidth: '200px' }}
              >
                <EuiText textAlign="center">{currentWorkspaceName}</EuiText>
                <EuiText
                  size="xs"
                  data-test-subj="workspace-menu-current-use-case"
                  textAlign="center"
                  color="subdued"
                >
                  {getUseCase(currentWorkspace)?.title ?? ''}
                </EuiText>
              </EuiFlexItem>
            </>
          ) : (
            <>
              <EuiFlexItem grow={false}>
                <EuiIcon size="xl" color="subdued" type="wsSelector" />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                <EuiText textAlign="center">{currentWorkspaceName}</EuiText>
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>

      <EuiPanel
        paddingSize="s"
        hasBorder={false}
        color="transparent"
        style={{ height: '30vh' }}
        className="eui-fullHeight"
      >
        <WorkspacePickerContent
          coreStart={coreStart}
          registeredUseCases$={registeredUseCases$}
          onClickWorkspace={() => setPopover(false)}
        />
      </EuiPanel>

      {isDashboardAdmin && (
        <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
          <EuiHorizontalRule />
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
            <EuiFlexItem>
              <EuiButtonEmpty
                color="primary"
                size="xs"
                data-test-subj="workspace-menu-manage-button"
                onClick={() => {
                  closePopover();
                  coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
                }}
              >
                <EuiText size="s">{manageWorkspacesButton}</EuiText>
              </EuiButtonEmpty>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiButton
                color="primary"
                iconType="plus"
                size="s"
                key={WORKSPACE_CREATE_APP_ID}
                data-test-subj="workspace-menu-create-workspace-button"
                onClick={() => {
                  closePopover();
                  coreStart.application.navigateToApp(WORKSPACE_CREATE_APP_ID);
                }}
              >
                <EuiText size="s">{createWorkspaceButton}</EuiText>
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      )}
    </EuiPopover>
  );
};
