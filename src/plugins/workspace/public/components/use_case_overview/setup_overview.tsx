/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiIcon, EuiTextColor } from '@elastic/eui';
import { first } from 'rxjs/operators';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
  ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS,
  ANALYTICS_ALL_OVERVIEW_PAGE_ID,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
  ESSENTIAL_OVERVIEW_PAGE_ID,
  SECTIONS,
  Section,
} from '../../../../content_management/public';
import { getStartedCards } from './get_started_cards';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { Content } from '../../../../../plugins/content_management/public';
import './setup_overview.scss';

const recentlyViewSectionRender = (contents: Content[]) => {
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
};

export const getStartedSection: Section = {
  id: SECTIONS.GET_STARTED,
  order: 1000,
  kind: 'card',
};

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
        render: recentlyViewSectionRender,
      },
      getStartedSection,
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
        onClick: () => {
          core.application.navigateToApp(card.navigateAppId);
        },
        getFooter: () => card.footer,
        getIcon: () => card.icon,
        cardProps: {
          className: 'usecaseOverviewGettingStartedCard',
        },
      }),
    });
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
        render: recentlyViewSectionRender,
      },
      getStartedSection,
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
        getIcon: () => <EuiIcon type={card.icon || 'wsSelector'} size="l" color="primary" />,
        order: card.order || index,
        description: card.description,
        title: '',
        getFooter: () => <EuiTextColor color="subdued">{card.title}</EuiTextColor>,
        cardProps: {
          className: 'usecaseOverviewGettingStartedCard',
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
};
