/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenu,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import type {
  EuiContextMenuPanelDescriptor,
  EuiContextMenuPanelItemDescriptor,
} from '@elastic/eui';

import {
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
} from '../../../common/constants';
import { cleanWorkspaceId, formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getUseCaseFromFeatureConfig } from '../../utils';

interface Props {
  coreStart: CoreStart;
}

const isNotNull = <T extends unknown>(value: T | null): value is T => !!value;

/**
 * Return maximum five workspaces, the current selected workspace
 * will be on the top of the list.
 */
function getFilteredWorkspaceList(
  workspaceList: WorkspaceObject[],
  currentWorkspace: WorkspaceObject | null
): WorkspaceObject[] {
  return [
    ...(currentWorkspace ? [currentWorkspace] : []),
    ...workspaceList.filter((workspace) => workspace.id !== currentWorkspace?.id),
  ].slice(0, 7);
}

export const WorkspaceMenu = ({ coreStart }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
  const [searchValue, setSearchValue] = useState<string>('');
  const useCasePanels: EuiContextMenuPanelDescriptor[] = [];

  const defaultHeaderName = i18n.translate(
    'core.ui.primaryNav.workspacePickerMenu.defaultHeaderName',
    {
      defaultMessage: 'Select a workspace',
    }
  );

  const filteredWorkspaceList = useMemo(() => {
    return getFilteredWorkspaceList(workspaceList, currentWorkspace).filter((workspace) =>
      workspace.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [workspaceList, searchValue, currentWorkspace]);

  const currentWorkspaceName = currentWorkspace?.name ?? defaultHeaderName;

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const workspaceToItem = (workspace: WorkspaceObject, index: number) => {
    const workspaceURL = formatUrlWithWorkspaceId(
      coreStart.application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
        absolute: false,
      }),
      workspace.id,
      coreStart.http.basePath
    );

    const useCase = workspace.features
      ?.map(getUseCaseFromFeatureConfig)
      .filter(isNotNull)
      .map((uc) => {
        return {
          name: uc,
          // Todo: this should be a link to the use case overview page.
          onClick: () => {
            window.location.assign(workspaceURL);
          },
          'data-test-subj': `context-menu-item-${workspace.id}-${uc}`,
          icon: <EuiIcon type="bolt" />,
        };
      });

    useCasePanels.push({
      id: index + 1,
      title: 'use case',
      width: 300,
      items: useCase,
    });

    const name = (
      <EuiText
        onClick={(e) => {
          e.stopPropagation();
          window.location.assign(workspaceURL);
        }}
      >
        {workspace.name}
      </EuiText>
    );
    return {
      name,
      key: workspace.id,
      panel: index + 1,
      'data-test-subj': `context-menu-item-${workspace.id}`,
      icon: <EuiIcon type="stopFilled" color={workspace.color ?? 'primary'} />,
    };
  };

  const getWorkspaceListItems = () => {
    const workspaceListItems: EuiContextMenuPanelItemDescriptor[] = filteredWorkspaceList.map(
      (workspace, index) => workspaceToItem(workspace, index)
    );
    return workspaceListItems;
  };

  const currentWorkspaceButton = (
    <>
      <EuiListGroup style={{ width: 318 }} maxWidth={false}>
        <EuiListGroupItem
          iconType="spacesApp"
          label={currentWorkspaceName}
          onClick={openPopover}
          extraAction={{
            color: 'subdued',
            onClick: openPopover,
            iconType: isPopoverOpen ? 'arrowDown' : 'arrowRight',
            iconSize: 's',
            'aria-label': 'Show workspace dropdown selector',
            alwaysShow: true,
          }}
        />
      </EuiListGroup>
    </>
  );

  const panels = [
    {
      id: 0,
      title: 'all workspace',
      width: 300,
      items: getWorkspaceListItems(),
    },
    ...useCasePanels,
  ];

  return (
    <EuiPopover
      id="workspaceDropdownMenu"
      display="block"
      button={currentWorkspaceButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downCenter"
    >
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFieldSearch
          placeholder="find a workspace"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          fullWidth
        />
      </EuiPanel>
      <EuiContextMenu initialPanelId={0} panels={panels} size="s" />
      <EuiHorizontalRule margin="xs" />
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFlexGroup justifyContent="spaceEvenly">
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              key={WORKSPACE_CREATE_APP_ID}
              onClick={() => {
                window.location.assign(
                  cleanWorkspaceId(
                    coreStart.application.getUrlForApp(WORKSPACE_CREATE_APP_ID, {
                      absolute: false,
                    })
                  )
                );
              }}
            >
              <EuiIcon type="plus" />
              <FormattedMessage
                id="core.ui.primaryNav.createWorkspace"
                defaultMessage="Create workspace"
              />
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              key={WORKSPACE_LIST_APP_ID}
              onClick={() => {
                window.location.assign(
                  cleanWorkspaceId(
                    coreStart.application.getUrlForApp(WORKSPACE_LIST_APP_ID, {
                      absolute: false,
                    })
                  )
                );
              }}
            >
              <FormattedMessage id="core.ui.primaryNav.allWorkspace" defaultMessage="View all" />
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
