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
  EuiPopover,
  EuiButtonIcon,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiFlexGroup,
  EuiHorizontalRule,
  EuiButtonEmpty,
  EuiToolTip,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { WorkspacePickerContent } from '../workspace_picker_content/workspace_picker_content';
import './workspace_menu.scss';

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
    <EuiToolTip
      content={i18n.translate('workspace.icon.menu.title', {
        defaultMessage: 'Workspaces',
      })}
    >
      <EuiButtonIcon
        iconType="wsSelector"
        onClick={openPopover}
        aria-label="workspace-select-button"
        data-test-subj="workspace-select-button"
        color="text"
      />
    </EuiToolTip>
  );

  return (
    <EuiPopover
      id="workspaceDropdownMenu"
      display="block"
      button={currentWorkspaceButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
      panelPaddingSize="s"
      repositionOnScroll={true}
    >
      <EuiFlexGroup
        direction="column"
        alignItems="center"
        gutterSize="none"
        style={{ width: '310px' }}
      >
        <EuiFlexItem className="workspaceMenuHeader">
          <EuiFlexGroup
            justifyContent="spaceAround"
            alignItems="center"
            direction="column"
            gutterSize="none"
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
                <EuiFlexItem data-test-subj="workspace-menu-current-workspace-name">
                  <EuiText textAlign="center" size="s">
                    <h3>{currentWorkspaceName}</h3>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText
                    size="s"
                    data-test-subj="workspace-menu-current-workspace-use-case"
                    textAlign="center"
                    color="subdued"
                  >
                    <small>{getUseCase(currentWorkspace)?.title ?? ''}</small>
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
        </EuiFlexItem>
        <EuiFlexItem className="eui-fullWidth">
          <EuiPanel
            paddingSize="none"
            hasBorder={false}
            hasShadow={false}
            color="transparent"
            style={{ height: '40vh' }}
          >
            <WorkspacePickerContent
              coreStart={coreStart}
              registeredUseCases$={registeredUseCases$}
              onClickWorkspace={() => setPopover(false)}
              isInTwoLines={false}
            />
          </EuiPanel>
        </EuiFlexItem>
        {isDashboardAdmin && (
          <EuiFlexItem className="eui-fullWidth">
            <EuiHorizontalRule size="full" margin="none" />
            <EuiSpacer size="s" />
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
              <EuiFlexItem grow={false} className="eui-textLeft">
                <EuiButtonEmpty
                  color="primary"
                  size="s"
                  data-test-subj="workspace-menu-manage-button"
                  onClick={() => {
                    closePopover();
                    coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
                  }}
                >
                  <EuiText size="s">{manageWorkspacesButton}</EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>

              <EuiFlexItem grow={false} className="eui-textRight">
                <EuiButtonEmpty
                  color="primary"
                  size="s"
                  iconType="plus"
                  key={WORKSPACE_CREATE_APP_ID}
                  data-test-subj="workspace-menu-create-workspace-button"
                  onClick={() => {
                    closePopover();
                    coreStart.application.navigateToApp(WORKSPACE_CREATE_APP_ID);
                  }}
                >
                  <EuiText size="s">{createWorkspaceButton}</EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiPopover>
  );
};
