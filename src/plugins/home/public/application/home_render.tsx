/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
} from '../../../../plugins/content_management/public';
import { HOME_PAGE_ID, SECTIONS, HOME_CONTENT_AREAS } from '../../common/constants';
import {
  WHATS_NEW_CONFIG,
  LEARN_OPENSEARCH_CONFIG,
  HomeListCard,
} from './components/home_list_card';

export const setupHome = (contentManagement: ContentManagementPluginSetup) => {
  contentManagement.registerPage({
    id: HOME_PAGE_ID,
    title: 'Home',
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
        title: 'Define your path forward with OpenSearch',
        kind: 'card',
      },
    ],
  });
};

export const initHome = (contentManagement: ContentManagementPluginStart, core: CoreStart) => {
  contentManagement.registerContentProvider({
    id: 'whats_new_cards',
    getContent: () => ({
      id: 'whats_new',
      kind: 'custom',
      order: 3,
      render: () =>
        React.createElement(HomeListCard, {
          config: WHATS_NEW_CONFIG,
        }),
    }),
    getTargetArea: () => HOME_CONTENT_AREAS.SERVICE_CARDS,
  });
  contentManagement.registerContentProvider({
    id: 'learn_opensearch_new_cards',
    getContent: () => ({
      id: 'learn_opensearch',
      kind: 'custom',
      order: 4,
      render: () =>
        React.createElement(HomeListCard, {
          config: LEARN_OPENSEARCH_CONFIG,
        }),
    }),
    getTargetArea: () => HOME_CONTENT_AREAS.SERVICE_CARDS,
  });
};
