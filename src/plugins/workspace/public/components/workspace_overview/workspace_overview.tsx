/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
  EuiFlexItem,
  EuiText,
  EuiTabbedContent,
  EuiTitle,
  EuiFlexGroup,
  EuiPanel,
  EuiButtonEmpty,
} from '@elastic/eui';

import { useObservable } from 'react-use';
import { i18n } from '@osd/i18n';
import { App, CoreStart, PublicAppInfo } from 'opensearch-dashboards/public';
import { BehaviorSubject } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceOverviewSettings } from './workspace_overview_settings';
import { WorkspaceOverviewContent } from './workspace_overview_content';
import { getStartCards } from './all_get_started_cards';
import { isAppAccessibleInWorkspace } from '../../utils';
import { WorkspaceOverviewCard } from './getting_start_card';
import { WorkspaceOverviewGettingStartModal } from './getting_start_modal';

export const IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY = 'workspace:overview_collapsed';

export interface WorkspaceOverviewProps {
  workspaceConfigurableApps$?: BehaviorSubject<PublicAppInfo[]>;
}

export const WorkspaceOverview = (props: WorkspaceOverviewProps) => {
  const {
    services: { workspaces, application, http },
  } = useOpenSearchDashboards<CoreStart>();

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const currentWorkspaceId = useObservable(workspaces.currentWorkspaceId$);

  // workspace level setting
  const workspaceOverviewCollapsedKey = `${IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY}_${
    currentWorkspaceId || ''
  }`;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isGettingStartCardsCollapsed, setIsGettingStartCardsCollapsed] = useState(false);

  useEffect(() => {
    setIsGettingStartCardsCollapsed(localStorage.getItem(workspaceOverviewCollapsedKey) === 'true');
  }, [workspaceOverviewCollapsedKey]);

  /**
   * all available cards based on workspace selected features
   */
  const availableCards = useMemo(() => {
    if (!currentWorkspace) return [];
    return getStartCards.filter(
      (card) => !card.id || isAppAccessibleInWorkspace(card as App, currentWorkspace)
    );
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return null;
  }

  const pageTitle = (
    <EuiFlexGroup gutterSize="none" alignItems="baseline" justifyContent="flexStart">
      <EuiFlexItem grow={false}>{currentWorkspace?.name}</EuiFlexItem>
    </EuiFlexGroup>
  );

  const tabs = [
    {
      id: 'overview',
      name: i18n.translate('workspace.overview.tabTitle', {
        defaultMessage: 'Overview',
      }),
      content: <WorkspaceOverviewContent />,
    },
    {
      id: 'library',
      name: i18n.translate('workspace.overview.library.tabTitle', {
        defaultMessage: 'Library',
      }),
      content: <></>,
    },
    {
      id: 'settings',
      name: i18n.translate('workspace.overview.setting.tabTitle', {
        defaultMessage: 'Settings',
      }),
      content: <WorkspaceOverviewSettings {...props} />,
    },
  ];

  const collapseButton = (
    <EuiButtonEmpty
      color="text"
      size="xs"
      data-test-subj={isGettingStartCardsCollapsed ? 'Expand' : 'Collapse'}
      aria-label={isGettingStartCardsCollapsed ? 'Expand' : 'Collapse'}
      iconType={isGettingStartCardsCollapsed ? 'arrowDown' : 'arrowUp'}
      iconSide="right"
      onClick={() => {
        const newValue = !isGettingStartCardsCollapsed;
        setIsGettingStartCardsCollapsed(newValue);
        localStorage.setItem(workspaceOverviewCollapsedKey, newValue ? 'true' : 'false');
      }}
    >
      {isGettingStartCardsCollapsed ? 'Expand' : 'Collapse'}
    </EuiButtonEmpty>
  );

  const rightSideItems: ReactNode[] = isGettingStartCardsCollapsed ? [collapseButton] : [];

  return (
    <>
      <EuiPanel paddingSize="l" borderRadius="none" hasShadow={false} hasBorder={false}>
        <EuiPageHeader
          pageTitle={pageTitle}
          rightSideItems={rightSideItems.length ? rightSideItems : undefined}
        >
          {!isGettingStartCardsCollapsed ? (
            <>
              <EuiTitle size="s">
                <p>
                  {i18n.translate('workspace.overview.startWorking.title', {
                    defaultMessage: 'Start working',
                  })}
                </p>
              </EuiTitle>
              <EuiSpacer />
              <EuiFlexGroup data-test-subj="workspaceGetStartCards">
                {availableCards.slice(0, 5).map((card, i) => {
                  return (
                    <EuiFlexItem key={card.featureName}>
                      <WorkspaceOverviewCard
                        card={card}
                        workspaceId={currentWorkspace?.id}
                        basePath={http.basePath}
                        application={application}
                      />
                    </EuiFlexItem>
                  );
                })}
                {availableCards.length > 5 ? (
                  <EuiFlexItem key="seeMore">
                    <EuiPanel
                      onClick={() => {
                        setIsModalVisible(true);
                      }}
                    >
                      <EuiText size="s">
                        {i18n.translate('workspace.overview.seeMore.description', {
                          defaultMessage:
                            'Explore more paths to kick-start your OpenSearch journey.',
                        })}
                      </EuiText>
                    </EuiPanel>
                  </EuiFlexItem>
                ) : null}
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem />
                <EuiFlexItem grow={false}>{collapseButton}</EuiFlexItem>
              </EuiFlexGroup>
            </>
          ) : null}
        </EuiPageHeader>
      </EuiPanel>
      <EuiPage paddingSize="l">
        <EuiPageBody>
          <EuiTabbedContent
            data-test-subj="workspaceTabs"
            tabs={tabs}
            initialSelectedTab={tabs[0]}
            autoFocus="selected"
            onTabClick={(tab) => {
              if (tab.id === 'library') {
                application.navigateToApp('management', {
                  path: 'opensearch-dashboards/objects',
                });
              }
            }}
          />
          {isModalVisible ? (
            <WorkspaceOverviewGettingStartModal
              onCloseModal={() => {
                setIsModalVisible(false);
              }}
              availableCards={availableCards}
              workspaceId={currentWorkspace.id}
              basePath={http.basePath}
              application={application}
            />
          ) : null}
        </EuiPageBody>
      </EuiPage>
    </>
  );
};
