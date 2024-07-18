/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiFlexItem,
  EuiTabbedContent,
  EuiFlexGroup,
  EuiPanel,
} from '@elastic/eui';

import { useObservable } from 'react-use';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { BehaviorSubject } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceDetailContent } from './workspace_detail_content';
import { WorkspaceUpdater } from './workspace_updater';
import { DetailTab } from '../workspace_form/constants';

export interface WorkspaceDetailProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceDetail = (props: WorkspaceDetailProps) => {
  const {
    services: { workspaces, application },
  } = useOpenSearchDashboards<CoreStart>();

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  if (!currentWorkspace) {
    return null;
  }

  const pageTitle = (
    <EuiFlexGroup gutterSize="none" alignItems="baseline" justifyContent="flexStart">
      <EuiFlexItem grow={false}>{currentWorkspace?.name}</EuiFlexItem>
    </EuiFlexGroup>
  );

  const detailTabs = [
    {
      id: DetailTab.Overview,
      name: i18n.translate('workspace.overview.tabTitle', {
        defaultMessage: 'Overview',
      }),
      content: <WorkspaceDetailContent />,
    },
    {
      id: DetailTab.Settings,
      name: i18n.translate('workspace.overview.setting.tabTitle', {
        defaultMessage: 'Settings',
      }),
      content: (
        <WorkspaceUpdater
          detailTab={DetailTab.Settings}
          registeredUseCases$={props.registeredUseCases$}
        />
      ),
    },
    ...(isPermissionEnabled
      ? [
          {
            id: DetailTab.Collaborators,
            name: i18n.translate('workspace.overview.collaborators.tabTitle', {
              defaultMessage: 'Collaborators',
            }),
            content: (
              <WorkspaceUpdater
                detailTab={DetailTab.Collaborators}
                registeredUseCases$={props.registeredUseCases$}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <EuiPanel paddingSize="l" borderRadius="none" hasShadow={false} hasBorder={false}>
        <EuiPageHeader pageTitle={pageTitle} />
      </EuiPanel>
      <EuiPage paddingSize="l">
        <EuiPageBody>
          <EuiTabbedContent
            data-test-subj="workspaceTabs"
            tabs={detailTabs}
            initialSelectedTab={detailTabs[0]}
            autoFocus="selected"
          />
        </EuiPageBody>
      </EuiPage>
    </>
  );
};
