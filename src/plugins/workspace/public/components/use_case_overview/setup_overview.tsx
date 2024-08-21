/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiIcon } from '@elastic/eui';
import { first } from 'rxjs/operators';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
} from '../../../../content_management/public';
import {
  ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS,
  ANALYTICS_ALL_OVERVIEW_PAGE_ID,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
  ESSENTIAL_OVERVIEW_PAGE_ID,
  SECTIONS,
} from '../../../common/constants';
import { getStartedCards } from './get_started_cards';
import {
  HomeListCard,
  LEARN_OPENSEARCH_CONFIG,
  WHATS_NEW_CONFIG,
} from '../../../../../plugins/home/public';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';

// Essential overview part
export const setEssentialOverviewSection = (contentManagement: ContentManagementPluginSetup) => {
  contentManagement.registerPage({
    id: ESSENTIAL_OVERVIEW_PAGE_ID,
    title: 'Overview',
    sections: [
      {
        id: SECTIONS.SERVICE_CARDS,
        order: 3000,
        kind: 'dashboard',
      },
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
                  return content.render();
                }

                return null;
              })}
            </>
          );
        },
      },
      {
        id: SECTIONS.GET_STARTED,
        order: 1000,
        kind: 'card',
      },
    ],
  });
};

export const registerEssentialOverviewContent = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart
) => {
  getStartedCards.forEach((card) => {
    contentManagement.registerContentProvider({
      id: card.id,
      getTargetArea: () => ESSENTIAL_OVERVIEW_CONTENT_AREAS.GET_STARTED,
      getContent: () => ({
        id: card.id,
        kind: 'card',
        order: card.order,
        description: card.description,
        title: card.title,
        cardProps: {
          selectable: {
            onClick: () => {
              core.application.navigateToApp(card.navigateAppId);
            },
            children: card.footer,
            isSelected: false,
          },
        },
      }),
    });
  });

  // card
  contentManagement.registerContentProvider({
    id: 'whats_new_cards_essential_overview',
    getContent: () => ({
      id: 'whats_new',
      kind: 'custom',
      order: 10,
      width: 24,
      render: () =>
        React.createElement(HomeListCard, {
          config: WHATS_NEW_CONFIG,
        }),
    }),
    getTargetArea: () => ESSENTIAL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
  });

  contentManagement.registerContentProvider({
    id: 'learn_opensearch_cards_essential_overview',
    getContent: () => ({
      id: 'learn_opensearch',
      kind: 'custom',
      order: 20,
      width: 24,
      render: () =>
        React.createElement(HomeListCard, {
          config: LEARN_OPENSEARCH_CONFIG,
        }),
    }),
    getTargetArea: () => ESSENTIAL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
  });
};

// Analytics(All) overview part
export const setAnalyticsAllOverviewSection = (contentManagement: ContentManagementPluginSetup) => {
  contentManagement.registerPage({
    id: ANALYTICS_ALL_OVERVIEW_PAGE_ID,
    title: 'Overview',
    sections: [
      {
        id: SECTIONS.SERVICE_CARDS,
        order: 3000,
        kind: 'dashboard',
      },
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
                  return content.render();
                }

                return null;
              })}
            </>
          );
        },
      },
      {
        id: SECTIONS.GET_STARTED,
        order: 1000,
        kind: 'card',
      },
    ],
  });
};

export const registerAnalyticsAllOverviewContent = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart
) => {
  const useCaseCards = [
    DEFAULT_NAV_GROUPS.observability,
    DEFAULT_NAV_GROUPS['security-analytics'],
    DEFAULT_NAV_GROUPS.search,
  ];
  useCaseCards.forEach((card, index) => {
    contentManagement.registerContentProvider({
      id: card.id,
      getTargetArea: () => ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.GET_STARTED,
      getContent: () => ({
        id: card.id,
        kind: 'card',
        getIcon: () => React.createElement(EuiIcon, { size: 'xl', type: 'spacesApp' }),
        order: card.order || index,
        description: card.description,
        title: card.title,
        cardProps: {
          layout: 'horizontal',
        },
        onClick: async () => {
          const navGroups = await core.chrome.navGroup.getNavGroupsMap$().pipe(first()).toPromise();
          const group = navGroups[card.id];
          if (group) {
            const appId = group.navLinks?.[0].id;
            if (appId) core.application.navigateToApp(appId);
          }
        },
      }),
    });
  });

  // card
  contentManagement.registerContentProvider({
    id: 'whats_new_cards_essential_overview',
    getContent: () => ({
      id: 'whats_new',
      kind: 'custom',
      order: 30,
      width: 12,
      render: () =>
        React.createElement(HomeListCard, {
          config: WHATS_NEW_CONFIG,
        }),
    }),
    getTargetArea: () => ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
  });

  contentManagement.registerContentProvider({
    id: 'learn_opensearch_cards_essential_overview',
    getContent: () => ({
      id: 'learn_opensearch',
      kind: 'custom',
      order: 40,
      width: 12,
      render: () =>
        React.createElement(HomeListCard, {
          config: LEARN_OPENSEARCH_CONFIG,
        }),
    }),
    getTargetArea: () => ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.SERVICE_CARDS,
  });
};
