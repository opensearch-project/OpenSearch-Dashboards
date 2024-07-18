/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiPanel,
  EuiLink,
  EuiDescriptionList,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiButtonIcon,
  EuiSpacer,
  EuiListGroup,
  EuiText,
  EuiTitle,
  EuiToolTip,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Subscription } from 'rxjs';
import moment from 'moment';
import _ from 'lodash';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';

import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { WorkspaceEntry, recentWorkspaceManager } from '../../recent_workspace_manager';

const WORKSPACE_LIST_CARD_DESCRIPTIOIN = i18n.translate('workspace.list.card.descriptionh', {
  defaultMessage:
    'Workspaces are dedicated environments for organizing and collaborating on your data, dashboards, and analytics workflows. Each Workspace acts as a self-contained space with its own set of saved objects and access controls.',
});

const MAX_ITEM_IN_LIST = 5;

export interface WorkspaceListCardProps {
  core: CoreStart;
}

export interface WorkspaceListItem {
  id: string;
  name: string;
  time?: string | number;
}

export interface WorkspaceListCardState {
  availiableWorkspaces: WorkspaceObject[];
  filter: string;
  workspaceList: WorkspaceListItem[];
  recentWorkspaces: WorkspaceEntry[];
}

export class WorkspaceListCard extends Component<WorkspaceListCardProps, WorkspaceListCardState> {
  private workspaceSub?: Subscription;
  constructor(props: WorkspaceListCardProps) {
    super(props);
    this.state = {
      availiableWorkspaces: [],
      recentWorkspaces: [],
      workspaceList: [],
      filter: 'viewed',
    };
  }

  componentDidMount() {
    this.setState({
      recentWorkspaces: recentWorkspaceManager.getRecentWorkspaces() || [],
    });
    this.workspaceSub = this.props.core.workspaces.workspaceList$.subscribe((list) => {
      this.setState({
        availiableWorkspaces: list || [],
      });
    });
    this.loadWorkspaceListItems();
  }

  componentDidUpdate(
    prevProps: Readonly<WorkspaceListCardProps>,
    prevState: Readonly<WorkspaceListCardState>
  ): void {
    if (
      !_.isEqual(prevState.filter, this.state.filter) ||
      !_.isEqual(prevState.availiableWorkspaces, this.state.availiableWorkspaces) ||
      !_.isEqual(prevState.recentWorkspaces, this.state.recentWorkspaces)
    ) {
      this.loadWorkspaceListItems();
    }
  }

  private loadWorkspaceListItems() {
    if (this.state.filter === 'viewed') {
      this.setState({
        workspaceList: _.orderBy(this.state.recentWorkspaces, ['timestamp'], ['desc'])
          .filter((ws) => this.state.availiableWorkspaces.some((a) => a.id === ws.id))
          .slice(0, MAX_ITEM_IN_LIST)
          .map((item) => ({
            id: item.id,
            name: this.state.availiableWorkspaces.find((ws) => ws.id === item.id)?.name!,
            time: item.timestamp,
          })),
      });
    } else if (this.state.filter === 'updated') {
      this.setState({
        workspaceList: _.orderBy(this.state.availiableWorkspaces, ['lastUpdatedTime'], ['desc'])
          .slice(0, MAX_ITEM_IN_LIST)
          .map((ws) => ({
            id: ws.id,
            name: ws.name,
            time: ws.lastUpdatedTime,
          })),
      });
    }
  }

  componentWillUnmount() {
    this.workspaceSub?.unsubscribe();
  }

  private handleSwitchWorkspace = (id: string) => {
    const { application, http } = this.props.core;
    if (application && http) {
      navigateToWorkspaceDetail({ application, http }, id);
    }
  };

  render() {
    const workspaceList = this.state.workspaceList;
    const { application } = this.props.core;

    const isDashboardAdmin = application.capabilities.dashboards?.isDashboardAdmin;

    return (
      <EuiPanel paddingSize="s" hasBorder={false} hasShadow={false}>
        <EuiFlexGroup gutterSize="xs" alignItems="center">
          <EuiFlexItem grow={3}>
            <EuiTitle>
              <h4>Workspaces</h4>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiToolTip position="bottom" content={WORKSPACE_LIST_CARD_DESCRIPTIOIN}>
              <EuiIcon type="iInCircle" aria-label="workspace list card descriptioni" />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={5}>
            <EuiSelect
              value={this.state.filter}
              data-test-subj="workspace_filter"
              onChange={(e) => {
                this.setState({ filter: e.target.value });
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

        <EuiSpacer />
        <EuiListGroup flush={true} bordered={false} style={{ minHeight: '300px' }}>
          {workspaceList && workspaceList.length === 0 ? (
            <EuiEmptyPrompt
              iconType="database"
              titleSize="xs"
              title={<p>No Workspaces found</p>}
              body={i18n.translate('workspace.list.card.empty', {
                values: {
                  filter: this.state.filter,
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
                      this.handleSwitchWorkspace(workspace.id);
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
        </EuiListGroup>

        <EuiLink
          onClick={() => {
            application.navigateToApp(WORKSPACE_LIST_APP_ID);
          }}
        >
          <EuiText size="s">View all</EuiText>
        </EuiLink>
      </EuiPanel>
    );
  }
}
