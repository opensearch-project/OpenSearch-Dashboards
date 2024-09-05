/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { DEFAULT_NAV_GROUPS } from '../../../../core/public';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
  HOME_PAGE_ID,
  SECTIONS,
  HOME_CONTENT_AREAS,
  SEARCH_OVERVIEW_PAGE_ID,
  OBSERVABILITY_OVERVIEW_PAGE_ID,
  SECURITY_ANALYTICS_OVERVIEW_PAGE_ID,
} from '../../../../plugins/content_management/public';
import {
  WHATS_NEW_CONFIG,
  LEARN_OPENSEARCH_CONFIG,
  registerHomeListCard,
} from './components/home_list_card';

import { registerUseCaseCard } from './components/use_case_card';

export const setupHome = (contentManagement: ContentManagementPluginSetup) => {
  contentManagement.registerPage({
    id: HOME_PAGE_ID,
    title: 'Home',
    sections: [
      {
        id: SECTIONS.RECENTLY_VIEWED,
        order: 2000,
        title: 'Recently viewed',
        kind: 'custom',
        render: (contents) => {
          return (
            <>
              {contents.map((content) => {
                if (content.kind === 'custom') {
                  return <React.Fragment key={content.id}>{content.render()}</React.Fragment>;
                }

                return null;
              })}
            </>
          );
        },
      },
      {
        id: SECTIONS.SERVICE_CARDS,
        order: 3000,
        kind: 'dashboard',
      },
      {
        id: SECTIONS.GET_STARTED,
        order: 1000,
        title: "Get started with OpenSearch's powerful features",
        kind: 'card',
      },
    ],
  });
};

export const initHome = (contentManagement: ContentManagementPluginStart, core: CoreStart) => {
  const workspaceEnabled = core.application.capabilities.workspaces.enabled;

  if (!workspaceEnabled) {
    const useCases = [
      { ...DEFAULT_NAV_GROUPS.observability, navigateAppId: OBSERVABILITY_OVERVIEW_PAGE_ID },
      { ...DEFAULT_NAV_GROUPS.search, navigateAppId: SEARCH_OVERVIEW_PAGE_ID },
      {
        ...DEFAULT_NAV_GROUPS['security-analytics'],
        navigateAppId: SECURITY_ANALYTICS_OVERVIEW_PAGE_ID,
      },
    ];

    useCases.forEach((useCase, index) => {
      registerUseCaseCard(contentManagement, core, {
        id: useCase.id,
        order: index + 1,
        description: useCase.description,
        title: useCase.title,
        target: HOME_CONTENT_AREAS.GET_STARTED,
        icon: useCase.icon ?? '',
        navigateAppId: useCase.navigateAppId,
      });
    });
  }

  registerHomeListCard(contentManagement, {
    id: 'whats_new',
    order: 10,
    config: WHATS_NEW_CONFIG,
    target: HOME_CONTENT_AREAS.SERVICE_CARDS,
    width: 16,
  });

  registerHomeListCard(contentManagement, {
    id: 'learn_opensearch_new',
    order: 11,
    config: LEARN_OPENSEARCH_CONFIG,
    target: HOME_CONTENT_AREAS.SERVICE_CARDS,
    width: 16,
  });
};
