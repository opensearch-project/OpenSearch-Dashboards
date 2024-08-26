/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  EuiFlexGroup,
  EuiLink,
  EuiDescriptionList,
  EuiIcon,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiPanel,
  EuiTitle,
  EuiToolTip,
  EuiEmptyPrompt,
  EuiSmallButton,
  EuiCompressedSelect,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { orderBy } from 'lodash';
import { useObservable } from 'react-use';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';

import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { navigateToAppWithinWorkspace } from '../utils/workspace';

const WORKSPACE_LIST_CARD_DESCRIPTION = i18n.translate('workspace.list.card.description', {
  defaultMessage: 'Dedicated environments for organizing, sharing and collaborating.',
});

const MAX_ITEM_IN_LIST = 5;

export interface WorkspaceListCardProps {
  core: CoreStart;
}

export const WorkspaceListCard = (props: WorkspaceListCardProps) => {
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceObject[]>([]);
  const [filter, setFilter] = useState('viewed');
  const navGroups = useObservable(props.core.chrome.navGroup.getNavGroupsMap$());

  useEffect(() => {
    const workspaceSub = props.core.workspaces.workspaceList$.subscribe((list) => {
      setAvailableWorkspaces(list || []);
    });
    return () => {
      workspaceSub.unsubscribe();
    };
  }, [props.core]);

  const workspaceList = useMemo(() => {
    const recentWorkspaces = recentWorkspaceManager.getRecentWorkspaces() || [];
    if (filter === 'viewed') {
      return orderBy(recentWorkspaces, ['timestamp'], ['desc'])
        .filter((ws) => availableWorkspaces.some((a) => a.id === ws.id))
        .slice(0, MAX_ITEM_IN_LIST)
        .map((item) => ({
          id: item.id,
          name: availableWorkspaces.find((ws) => ws.id === item.id)?.name!,
          time: item.timestamp,
        }));
    } else if (filter === 'updated') {
      return orderBy(availableWorkspaces, ['lastUpdatedTime'], ['desc'])
        .slice(0, MAX_ITEM_IN_LIST)
        .map((ws) => ({
          id: ws.id,
          name: ws.name,
          time: ws.lastUpdatedTime,
        }));
    }
    return [];
  }, [filter, availableWorkspaces]);

  const handleSwitchWorkspace = (workspaceId: string) => {
    const { application, http } = props.core;
    const workspaceObj = availableWorkspaces.find((item) => item.id === workspaceId);
    const useCase = getFirstUseCaseOfFeatureConfigs(workspaceObj?.features || []);
    if (useCase && navGroups) {
      // should be workspace use case overview page
      const appId = navGroups[useCase].navLinks?.[0].id;
      navigateToAppWithinWorkspace({ application, http }, workspaceId, appId);
    }
  };

  const { application } = props.core;

  const isDashboardAdmin = application.capabilities.dashboards?.isDashboardAdmin;

  const createWorkspace = i18n.translate('workspace.list.card.createWorkspace', {
    defaultMessage: 'Create workspace',
  });

  const workspaceAvailable = workspaceList && workspaceList.length > 0;

  const createWorkspaceButton = (
    <EuiSmallButton
      iconType="plus"
      iconSize="s"
      contentProps={{ style: { padding: '0 4px' } }}
      data-test-subj="create_workspace"
      aria-label="create workspace"
      onClick={() => {
        application.navigateToApp(WORKSPACE_CREATE_APP_ID);
      }}
    >
      {createWorkspace}
    </EuiSmallButton>
  );

  let emptyStateBody: JSX.Element = (
    <EuiText color="subdued" size="s">
      {i18n.translate('workspace.list.card.empty.readOnly', {
        defaultMessage:
          'Contact your administrator to create a workspace or to be added to an existing one.',
      })}
    </EuiText>
  );

  if (isDashboardAdmin) {
    emptyStateBody = (
      <>
        <EuiText color="subdued" size="s">
          {i18n.translate('workspace.list.card.empty', {
            defaultMessage: 'Create a workspace to get started.',
          })}
        </EuiText>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem>
            <EuiLink
              onClick={() => {
                application.navigateToApp(WORKSPACE_LIST_APP_ID);
              }}
            >
              <EuiText size="s">
                {i18n.translate('workspace.list.card.manageWorkspaces', {
                  defaultMessage: 'Manage workspaces',
                })}
              </EuiText>
            </EuiLink>
          </EuiFlexItem>
          <EuiFlexItem>{createWorkspaceButton}</EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  }

  return (
    <EuiPanel paddingSize="s" hasBorder={false} hasShadow={false}>
      <EuiFlexGroup
        direction="column"
        justifyContent="spaceBetween"
        style={{ height: '100%' }}
        gutterSize="none"
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" alignItems="center">
            <EuiFlexItem grow={4}>
              <EuiFlexGroup gutterSize="xs" alignItems="center">
                <EuiFlexItem>
                  <EuiTitle>
                    <h4>Workspaces</h4>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiToolTip position="bottom" content={WORKSPACE_LIST_CARD_DESCRIPTION}>
                    <EuiIcon type="iInCircle" aria-label="workspace list card description" />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem />
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={3}>
              <EuiCompressedSelect
                value={filter}
                data-test-subj="workspace_filter"
                onChange={(e) => {
                  setFilter(e.target.value);
                }}
                options={[
                  {
                    value: 'viewed',
                    text: i18n.translate('workspace.list.card.filter.viewed', {
                      defaultMessage: 'Recently viewed',
                    }),
                  },
                  {
                    value: 'updated',
                    text: i18n.translate('workspace.list.card.filter.updated', {
                      defaultMessage: 'Recently updated',
                    }),
                  },
                ]}
              />
            </EuiFlexItem>
            {isDashboardAdmin && workspaceAvailable && (
              <EuiFlexItem grow={false}>
                <EuiToolTip position="top" content={createWorkspace}>
                  {createWorkspaceButton}
                </EuiToolTip>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiSpacer />
        <EuiFlexItem grow={true}>
          {!workspaceList || workspaceList.length === 0 ? (
            <EuiEmptyPrompt
              iconType="spacesApp"
              titleSize="xs"
              title={
                <EuiTitle size="s">
                  <EuiText color="subdued">No Workspaces available</EuiText>
                </EuiTitle>
              }
              body={emptyStateBody}
            />
          ) : (
            <EuiDescriptionList
              type="column"
              titleProps={{ style: { width: '70%' } }}
              descriptionProps={{ style: { width: '30%' } }}
              listItems={workspaceList.map((workspace) => ({
                title: (
                  <EuiLink
                    onClick={() => {
                      handleSwitchWorkspace(workspace.id);
                    }}
                  >
                    <EuiText size="s">{workspace.name}</EuiText>
                  </EuiLink>
                ),
                description: (
                  <EuiText size="s" color="subdued" className="eui-textRight">
                    {moment(workspace.time).fromNow()}
                  </EuiText>
                ),
              }))}
            />
          )}
        </EuiFlexItem>
        <EuiSpacer />
        {workspaceAvailable && (
          <EuiFlexItem grow={false}>
            <EuiLink
              onClick={() => {
                application.navigateToApp(WORKSPACE_LIST_APP_ID);
              }}
            >
              <EuiText size="s">
                {i18n.translate('workspace.list.card.view_all', {
                  defaultMessage: 'View all',
                })}
              </EuiText>
            </EuiLink>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiPanel>
  );
};
