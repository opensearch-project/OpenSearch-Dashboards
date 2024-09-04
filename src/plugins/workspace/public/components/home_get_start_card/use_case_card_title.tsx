/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiText,
  EuiTitle,
  EuiPanel,
  EuiAvatar,
  EuiPopover,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFieldSearch,
  EuiContextMenu,
  EuiButtonIcon,
  EuiSmallButton,
  EuiPopoverTitle,
} from '@elastic/eui';
import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { getUseCaseUrl } from '../../utils';

export interface UseCaseCardTitleProps {
  filterWorkspaces: WorkspaceObject[];
  useCase: WorkspaceUseCase;
  core: CoreStart;
}

export const UseCaseCardTitle = ({ filterWorkspaces, useCase, core }: UseCaseCardTitleProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const onButtonClick = () => setPopover(!isPopoverOpen);
  const closePopover = () => setPopover(false);

  const filteredWorkspaces = useMemo(
    () =>
      filterWorkspaces.filter((workspace) =>
        workspace.name.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [filterWorkspaces, searchValue]
  );

  const useCaseTitle = (
    <EuiTitle size="s">
      <h2>{useCase.title}</h2>
    </EuiTitle>
  );

  const iconButton = (
    <EuiButtonIcon
      aria-label={i18n.translate(`workspace.getStartCard.${useCase.id}.icon.button`, {
        defaultMessage: `show available workspace menu for ${useCase}`,
      })}
      size="xs"
      iconType="arrowDown"
      onClick={onButtonClick}
      data-test-subj={`workspace.getStartCard.${useCase.id}.icon.button`}
    />
  );

  if (filterWorkspaces.length === 0) {
    const createButton = (
      <EuiSmallButton
        aria-label={i18n.translate('workspace.getStartCard.popover.createWorkspace.text', {
          defaultMessage: 'Create workspace',
        })}
        href={core.application.getUrlForApp('workspace_create', { absolute: false })}
        data-test-subj={`workspace.getStartCard.${useCase.id}.popover.createWorkspace.button`}
        fill
      >
        {i18n.translate('workspace.getStartCard.popover.createWorkspace.text', {
          defaultMessage: 'Create workspace',
        })}
      </EuiSmallButton>
    );

    return (
      <EuiFlexGroup alignItems="center" gutterSize="xs">
        <EuiFlexItem grow={false} onClick={onButtonClick}>
          {useCaseTitle}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={iconButton}
            isOpen={isPopoverOpen}
            closePopover={closePopover}
            anchorPosition="downRight"
          >
            <EuiFlexGroup alignItems="center" direction="column" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  {i18n.translate('workspace.getStartCard.popover.noWorkspace.text', {
                    defaultMessage: 'No workspaces available',
                  })}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>{createButton}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const workspaceToItem = (workspace: WorkspaceObject) => {
    const useCaseUrl = getUseCaseUrl(useCase, workspace, core.application, core.http);
    const workspaceName = workspace.name;

    return {
      name: (
        <EuiText className="eui-textTruncate" size="s">
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
        window.location.assign(useCaseUrl);
      },
    };
  };
  const panels = [
    {
      id: 0,
      items: filteredWorkspaces.map(workspaceToItem),
      width: 340,
    },
  ];

  return (
    <EuiFlexGroup alignItems="center" gutterSize="xs">
      <EuiFlexItem grow={false} onClick={onButtonClick}>
        {useCaseTitle}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPopover
          id="useCaseFooterSelectWorkspace"
          button={iconButton}
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
          anchorPosition="downCenter"
        >
          <EuiPopoverTitle paddingSize="s">
            {i18n.translate('workspace.getStartCard.popover.title.', {
              defaultMessage: 'SELECT WORKSPACE',
            })}
          </EuiPopoverTitle>
          <EuiPanel hasBorder={false} color="transparent" paddingSize="s">
            <EuiFieldSearch
              placeholder={i18n.translate('workspace.getStartCard.popover.search.placeholder', {
                defaultMessage: 'Search workspace name',
              })}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </EuiPanel>
          <div className="eui-yScrollWithShadows" style={{ maxHeight: '110px' }}>
            <EuiContextMenu size="s" initialPanelId={0} panels={panels} />
          </div>
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
