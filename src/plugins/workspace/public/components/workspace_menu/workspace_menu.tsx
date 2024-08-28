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
  EuiAvatar,
  EuiPopover,
  EuiToolTip,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonIcon,
  EuiSmallButtonEmpty,
  EuiSmallButton,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { navigateToWorkspaceDetail } from '../utils/workspace';
import { validateWorkspaceColor } from '../../../common/utils';
import { WorkspacePickerContent } from '../workspace_picker_content/workspace_picker_content';

const defaultHeaderName = i18n.translate('workspace.menu.defaultHeaderName', {
  defaultMessage: 'Workspaces',
});

const createWorkspaceButton = i18n.translate('workspace.menu.button.createWorkspace', {
  defaultMessage: 'Create workspace',
});

const viewAllButton = i18n.translate('workspace.menu.button.viewAll', {
  defaultMessage: 'View all',
});

const manageWorkspaceButton = i18n.translate('workspace.menu.button.manageWorkspace', {
  defaultMessage: 'Manage workspace',
});

const manageWorkspacesButton = i18n.translate('workspace.menu.button.manageWorkspaces', {
  defaultMessage: 'Manage workspaces',
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

  const currentWorkspaceButton = currentWorkspace ? (
    <EuiSmallButtonEmpty
      onClick={openPopover}
      data-test-subj="current-workspace-button"
      flush="both"
    >
      <EuiAvatar
        size="s"
        type="space"
        name={currentWorkspace.name}
        color={getValidWorkspaceColor(currentWorkspace.color)}
        initialsLength={2}
      />
    </EuiSmallButtonEmpty>
  ) : (
    <EuiButtonIcon
      iconType="spacesApp"
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
    >
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFlexGroup
          justifyContent="spaceAround"
          alignItems="center"
          direction="column"
          gutterSize="s"
        >
          {currentWorkspace ? (
            <>
              <EuiFlexItem grow={false}>
                <EuiAvatar
                  size="m"
                  type="space"
                  name={currentWorkspaceName}
                  color={getValidWorkspaceColor(currentWorkspace?.color)}
                  initialsLength={2}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                <EuiToolTip
                  anchorClassName="eui-textTruncate"
                  position="right"
                  content={currentWorkspaceName}
                >
                  <EuiText size="s" style={{ maxWidth: '195px' }} className="eui-textTruncate">
                    {currentWorkspaceName}
                  </EuiText>
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-use-case">
                <EuiText size="s">{getUseCase(currentWorkspace)?.title ?? ''}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButton
                  color="text"
                  onClick={() => {
                    closePopover();
                    navigateToWorkspaceDetail(coreStart, currentWorkspace.id);
                  }}
                >
                  {manageWorkspaceButton}
                </EuiSmallButton>
              </EuiFlexItem>
            </>
          ) : (
            <>
              <EuiFlexItem grow={false}>
                <EuiAvatar size="m" color="plain" name="spacesApp" iconType="spacesApp" />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                {currentWorkspaceName}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButton
                  color="text"
                  onClick={() => {
                    closePopover();
                    coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
                  }}
                >
                  {manageWorkspacesButton}
                </EuiSmallButton>
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <WorkspacePickerContent
          coreStart={coreStart}
          registeredUseCases$={registeredUseCases$}
          onClickWorkspace={() => setPopover(false)}
        />
      </EuiPanel>
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiSmallButtonEmpty
              flush="left"
              key={WORKSPACE_LIST_APP_ID}
              data-test-subj="workspace-menu-view-all-button"
              onClick={() => {
                closePopover();
                coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
              }}
            >
              {viewAllButton}
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
          {isDashboardAdmin && (
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                color="text"
                iconType="plus"
                key={WORKSPACE_CREATE_APP_ID}
                data-test-subj="workspace-menu-create-workspace-button"
                onClick={() => {
                  closePopover();
                  coreStart.application.navigateToApp(WORKSPACE_CREATE_APP_ID);
                }}
              >
                {createWorkspaceButton}
              </EuiSmallButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
