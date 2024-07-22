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
import { HOME_PAGE_ID, SECTIONS } from '../../common/constants';

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

export const initHome = (contentManagement: ContentManagementPluginStart, core: CoreStart) => {};
