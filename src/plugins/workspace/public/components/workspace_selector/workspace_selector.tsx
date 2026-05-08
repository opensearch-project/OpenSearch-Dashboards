/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useObservable } from 'react-use';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiIcon,
  EuiPopover,
  EuiPanel,
  EuiHorizontalRule,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButtonEmpty,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { WorkspacePickerContent } from '../workspace_picker_content/workspace_picker_content';
import './workspace_selector.scss';

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

export const WorkspaceSelector = ({ coreStart, registeredUseCases$ }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const availableUseCases = useObservable(registeredUseCases$, []);
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const button = currentWorkspace ? (
    <div className="workspaceSelectorPopoverButtonContainer">
      <EuiPanel
        className="workspaceSelectorPopoverButton"
        data-test-subj="workspace-selector-button"
        paddingSize="none"
        color="transparent"
        hasBorder={false}
        hasShadow={false}
        onClick={onButtonClick}
      >
        <EuiFlexGroup
          gutterSize="s"
          justifyContent="spaceBetween"
          alignItems="center"
          responsive={false}
          className="workspaceSelectorInner"
        >
          <EuiFlexItem grow={false}>
            <EuiIcon
              size="m"
              type={getUseCase(currentWorkspace)?.icon || 'wsSelector'}
              color={getValidWorkspaceColor(currentWorkspace.color)}
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 0 }}>
            <EuiText size="xs" data-test-subj="workspace-selector-current-name">
              <span className="eui-textTruncate workspaceSelectorName">
                {currentWorkspace.name}
              </span>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIcon type="arrowDown" size="s" color="subdued" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  ) : (
    <EuiButton onClick={onButtonClick}>Select a Workspace</EuiButton>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="s"
      anchorPosition="downLeft"
      repositionOnScroll={true}
      display="block"
      className="eui-fullWidth"
    >
      <EuiFlexGroup direction="column" alignItems="center" gutterSize="none">
        <EuiFlexItem>
          <EuiPanel
            paddingSize="none"
            hasBorder={false}
            hasShadow={false}
            color="transparent"
            // set the width fixed to achieve text truncation
            style={{ height: '40vh', width: '310px' }}
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

              <EuiFlexItem grow={false} className="eui-textRight">
                <EuiButtonEmpty
                  color="primary"
                  size="xs"
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
