/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, ReactNode } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
  EuiPageContent,
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
import { CoreStart, PublicAppInfo } from 'opensearch-dashboards/public';
import { BehaviorSubject } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceOverviewSettings } from './workspace_overview_settings';
import { WorkspaceOverviewContent } from './workspace_overview_content';
import { getStartCards } from './all_get_started_cards';
import { featureMatchesConfig } from '../../utils';
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

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isGettingStartCardsCollapsed, setIsGettingStartCardsCollapsed] = useState(
    localStorage.getItem(IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY) === 'true'
  );

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);

  /**
   * all available cards based on workspace selected features
   */
  const availableCards = useMemo(() => {
    const features = currentWorkspace?.features || ['*'];
    const featureFilter = featureMatchesConfig(features);
    return getStartCards.filter((card) => !card.appId || featureFilter({ id: card.appId }));
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
      content: null,
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
        localStorage.setItem(IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY, newValue ? 'true' : 'false');
      }}
    >
      {isGettingStartCardsCollapsed ? 'Expand' : 'Collapse'}
    </EuiButtonEmpty>
  );

  const rightSideItems: ReactNode[] = isGettingStartCardsCollapsed ? [collapseButton] : [];

  return (
    <EuiPage>
      <EuiPageBody>
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
        <EuiPageContent color="transparent" hasBorder={true}>
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
        </EuiPageContent>
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
  );
};
