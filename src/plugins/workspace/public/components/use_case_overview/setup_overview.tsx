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
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
} from '../../../../content_management/public';
import {
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
        selectable: {
          onClick: () => {
            core.application.navigateToApp(card.navigateAppId);
          },
          children: card.footer,
          isSelected: false,
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
