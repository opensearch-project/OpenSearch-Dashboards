/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
    <EuiPanel paddingSize="none" color="transparent" hasBorder={false} hasShadow={false}>
      <EuiText
        size="xs"
        // here I try inline style to achive the label looks
        style={{
          position: 'relative',
          bottom: '-10px',
          zIndex: 1,
          padding: '0 5px',
        }}
      >
        <p>worksapce</p>
      </EuiText>
      <EuiPanel paddingSize="s" borderRadius="m">
        <EuiFlexGroup gutterSize="none" justifyContent="spaceBetween">
          <EuiFlexItem>
            <EuiFlexGroup gutterSize="s" justifyContent="flexStart">
              <EuiFlexItem grow={false}>
                <EuiIcon
                  size="l"
                  type={getUseCase(currentWorkspace)?.icon || 'wsSelector'}
                  color={getValidWorkspaceColor(currentWorkspace.color)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup direction="column" gutterSize="none">
                  <EuiFlexItem grow={false} style={{ maxWidth: '130px' }}>
                    <EuiText size="s">
                      <h4 className="eui-textTruncate">{currentWorkspace.name}</h4>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="xs" color="subdued">
                      <p>
                        {i18n.translate('workspace.left.nav.selector.description', {
                          defaultMessage: getUseCase(currentWorkspace)?.title || '',
                        })}
                      </p>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ alignSelf: 'center' }} onClick={onButtonClick}>
            <EuiIcon type="arrowDown" size="m" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPanel>
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
            // set the width fixed to achieve a similar appearance to Superselect
            style={{ height: '40vh', width: '300px' }}
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
          <EuiFlexItem className="eui-fullWidth" style={{ padding: '4px' }}>
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
