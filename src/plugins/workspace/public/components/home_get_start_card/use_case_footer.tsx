/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiText,
  EuiModal,
  EuiTitle,
  EuiPanel,
  EuiAvatar,
  EuiSpacer,
  EuiButton,
  EuiPopover,
  EuiFlexItem,
  EuiModalBody,
  EuiFlexGroup,
  EuiFieldSearch,
  EuiModalFooter,
  EuiModalHeader,
  EuiContextMenu,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { getUseCaseFromFeatureConfig } from '../../utils';

export interface UseCaseFooterProps {
  useCaseId: string;
  useCaseTitle: string;
  core: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const UseCaseFooter = ({
  useCaseId,
  useCaseTitle,
  core,
  registeredUseCases$,
}: UseCaseFooterProps) => {
  const workspaceList = core.workspaces.workspaceList$.getValue();
  const availableUseCases = registeredUseCases$.getValue();
  const basePath = core.http.basePath;
  const isDashboardAdmin = core.application.capabilities?.dashboards?.isDashboardAdmin !== false;
  const [isPopoverOpen, setPopover] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(!isModalVisible);
  const onButtonClick = () => setPopover(!isPopoverOpen);
  const closePopover = () => setPopover(false);

  const appId =
    availableUseCases?.find((useCase) => useCase.id === useCaseId)?.features[0].id ??
    WORKSPACE_DETAIL_APP_ID;

  const filterWorkspaces = useMemo(
    () =>
      workspaceList.filter(
        (workspace) =>
          workspace.features?.map(getUseCaseFromFeatureConfig).filter(Boolean)[0] === useCaseId
      ),
    [useCaseId, workspaceList]
  );

  const searchWorkspaces = useMemo(
    () =>
      filterWorkspaces
        .filter((workspace) => workspace.name.toLowerCase().includes(searchValue.toLowerCase()))
        .slice(0, 5),
    [filterWorkspaces, searchValue]
  );

  if (filterWorkspaces.length === 0) {
    const modalHeaderTitle = i18n.translate('useCase.footer.modal.headerTitle', {
      defaultMessage: isDashboardAdmin ? 'No workspaces found' : 'Unable to create workspace',
    });
    const modalBodyContent = i18n.translate('useCase.footer.modal.bodyContent', {
      defaultMessage: isDashboardAdmin
        ? 'There are no available workspaces found. You can create a workspace in the workspace creation page.'
        : 'To create a workspace, contact your administrator.',
    });

    return (
      <>
        <EuiButton
          iconType="plus"
          onClick={showModal}
          data-test-subj="useCase.footer.createWorkspace.button"
        >
          {i18n.translate('workspace.useCase.footer.createWorkspace', {
            defaultMessage: 'Create workspace',
          })}
        </EuiButton>
        {isModalVisible && (
          <EuiModal onClose={closeModal} style={{ width: '450px' }}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>{modalHeaderTitle}</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <EuiText>{modalBodyContent}</EuiText>
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButton onClick={closeModal} data-test-subj="useCase.footer.modal.close.button">
                {i18n.translate('workspace.useCase.footer.modal.close', {
                  defaultMessage: 'Close',
                })}
              </EuiButton>
              {isDashboardAdmin && (
                <EuiButton
                  href={core.application.getUrlForApp('workspace_create', { absolute: false })}
                  data-test-subj="useCase.footer.modal.create.button"
                  fill
                >
                  {i18n.translate('workspace.useCase.footer.modal.create', {
                    defaultMessage: 'Create workspace',
                  })}
                </EuiButton>
              )}
            </EuiModalFooter>
          </EuiModal>
        )}
      </>
    );
  }

  if (filterWorkspaces.length === 1) {
    const useCaseURL = formatUrlWithWorkspaceId(
      core.application.getUrlForApp(appId, { absolute: false }),
      filterWorkspaces[0].id,
      basePath
    );
    return (
      <EuiButton href={useCaseURL} data-test-subj="useCase.footer.openWorkspace.button">
        {i18n.translate('workspace.useCase.footer.openWorkspace', { defaultMessage: 'Open' })}
      </EuiButton>
    );
  }

  const workspaceToItem = (workspace: WorkspaceObject) => {
    const useCaseURL = formatUrlWithWorkspaceId(
      core.application.getUrlForApp(appId, { absolute: false }),
      workspace.id,
      basePath
    );
    const workspaceName = workspace.name;

    return {
      toolTipContent: <div>{workspaceName}</div>,
      name: (
        <EuiText style={{ maxWidth: '200px' }} className="eui-textTruncate">
          {workspaceName}
        </EuiText>
      ),
      key: workspace.id,
      icon: (
        <EuiAvatar
          size="s"
          type="space"
          name={workspaceName}
          color={workspace.color}
          initialsLength={2}
        />
      ),
      onClick: () => {
        window.location.assign(useCaseURL);
      },
    };
  };

  const button = (
    <EuiButton iconType="arrowDown" iconSide="right" onClick={onButtonClick}>
      {i18n.translate('workspace.useCase.footer.selectWorkspace', {
        defaultMessage: 'Select workspace',
      })}
    </EuiButton>
  );
  const panels = [
    {
      id: 0,
      items: searchWorkspaces.map(workspaceToItem),
    },
  ];

  return (
    <EuiPopover
      id="useCaseFooterSelectWorkspace"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downCenter"
    >
      <EuiPanel hasBorder={false} color="transparent" paddingSize="s">
        <EuiFlexGroup justifyContent="center" alignItems="center" direction="column" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiAvatar color="plain" name="spacesApp" iconType="spacesApp" type="space" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <h3>{useCaseTitle} Workspaces</h3>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiFieldSearch
          placeholder="Search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          fullWidth
        />
      </EuiPanel>
      <EuiContextMenu size="s" initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
