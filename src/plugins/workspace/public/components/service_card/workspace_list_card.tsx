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
  EuiSelect,
  EuiButtonIcon,
  EuiText,
  EuiSpacer,
  EuiPanel,
  EuiTitle,
  EuiToolTip,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { orderBy } from 'lodash';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';

import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { recentWorkspaceManager } from '../../recent_workspace_manager';

const WORKSPACE_LIST_CARD_DESCRIPTION = i18n.translate('workspace.list.card.description', {
  defaultMessage:
    'Workspaces are dedicated environments for organizing and collaborating on your data, dashboards, and analytics workflows. Each Workspace acts as a self-contained space with its own set of saved objects and access controls.',
});

const MAX_ITEM_IN_LIST = 5;

export interface WorkspaceListCardProps {
  core: CoreStart;
}

export const WorkspaceListCard = (props: WorkspaceListCardProps) => {
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceObject[]>([]);
  const [filter, setFilter] = useState('viewed');

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

  const handleSwitchWorkspace = (id: string) => {
    const { application, http } = props.core;
    if (application && http) {
      navigateToWorkspaceDetail({ application, http }, id);
    }
  };

  const { application } = props.core;

  const isDashboardAdmin = application.capabilities.dashboards?.isDashboardAdmin;

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
            <EuiFlexItem grow={3}>
              <EuiTitle>
                <h4>Workspaces</h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={1}>
              <EuiToolTip position="bottom" content={WORKSPACE_LIST_CARD_DESCRIPTION}>
                <EuiIcon type="iInCircle" aria-label="workspace list card description" />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={5}>
              <EuiSelect
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
            {isDashboardAdmin && (
              <EuiFlexItem grow={false}>
                <EuiToolTip position="top" content="Create workspace">
                  <EuiButtonIcon
                    data-test-subj="create_workspace"
                    aria-label="create workspace"
                    display="base"
                    iconType="plus"
                    size="m"
                    onClick={() => {
                      application.navigateToApp(WORKSPACE_CREATE_APP_ID);
                    }}
                  />
                </EuiToolTip>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiSpacer />
        <EuiFlexItem grow={true}>
          {workspaceList && workspaceList.length === 0 ? (
            <EuiEmptyPrompt
              iconType="database"
              titleSize="xs"
              title={<p>No Workspaces found</p>}
              body={i18n.translate('workspace.list.card.empty', {
                values: {
                  filter,
                },
                defaultMessage: 'Workspaces you have recently {filter} will appear here.',
              })}
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
      </EuiFlexGroup>
    </EuiPanel>
  );
};
