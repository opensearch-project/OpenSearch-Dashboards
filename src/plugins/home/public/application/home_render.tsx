/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is just a demo of how to use content management plugin
 * TODO: these changes should be removed  before merge to main
 */

import React from 'react';

import { CoreStart } from 'opensearch-dashboards/public';
import { toMountPoint } from '../../../opensearch_dashboards_react/public';
import { ContentManagementPluginStart } from '../../../../plugins/content_management/public';
import { HOME_PAGE_ID } from '../../common/constants';

export const GET_STARTED_SECTION_ID = 'homepage_get_started';

/**
 * Example: render a arbitrary component
 */
const renderHomeCard = () => <div>Hello World!</div>;

export const initHome = (contentManagement: ContentManagementPluginStart, core: CoreStart) => {
  /**
   * init get started section
   */
  contentManagement.registerContentProvider({
    id: 'home_get_start_1',
    getTargetArea: () => `${HOME_PAGE_ID}/get_started`,
    getContent: () => ({
      id: 'get_started_1',
      kind: 'card',
      order: 5000,
      description: 'description 1',
      title: 'title 1',
      onClick: () => {
        const modal = core.overlays.openModal(
          toMountPoint(
            <div>
              test <button onClick={() => modal.close()}>close</button>
            </div>
          )
        );
      },
    }),
  });
  contentManagement.registerContentProvider({
    id: 'home_get_start_2',
    getTargetArea: () => `${HOME_PAGE_ID}/get_started`,
    getContent: () => ({
      id: 'get_started_2',
      kind: 'card',
      order: 2000,
      description: 'description 2',
      title: 'title 2',
      onClick: () => {
        const modal = core.overlays.openModal(
          toMountPoint(
            <div>
              test <button onClick={() => modal.close()}>close</button>
            </div>
          )
        );
      },
    }),
  });
  contentManagement.registerContentProvider({
    id: 'home_get_start_3',
    getTargetArea: () => `${HOME_PAGE_ID}/get_started`,
    getContent: () => ({
      id: 'get_started_3',
      kind: 'card',
      order: 3000,
      description: 'description 3',
      title: 'title 3',
      onClick: () => {
        const modal = core.overlays.openModal(
          toMountPoint(
            <div>
              test <button onClick={() => modal.close()}>close</button>
            </div>
          )
        );
      },
    }),
  });
  contentManagement.registerContentProvider({
    id: 'home_get_start_4',
    getTargetArea: () => `${HOME_PAGE_ID}/get_started`,
    getContent: () => ({
      id: 'get_started_4',
      kind: 'card',
      order: 4000,
      description: 'description 4',
      title: 'title 4',
      onClick: () => {
        const modal = core.overlays.openModal(
          toMountPoint(
            <div>
              test <button onClick={() => modal.close()}>close</button>
            </div>
          )
        );
      },
    }),
  });

  /**
   * Example: embed a dashboard to homepage
   */
  contentManagement.registerContentProvider({
    id: 'dashboard_content_1',
    getTargetArea: () => `${HOME_PAGE_ID}/some_dashboard`,
    getContent: () => ({
      id: 'dashboard_1',
      kind: 'dashboard',
      order: 0,
      input: {
        kind: 'static',
        id: '722b74f0-b882-11e8-a6d9-e546fe2bba5f',
      },
    }),
  });

  /**
   * Example: embed visualization to homepage
   */
  contentManagement.registerContentProvider({
    id: 'viz_content_1',
    getTargetArea: () => `${HOME_PAGE_ID}/service_cards`,
    getContent: () => ({
      id: 'vis_1',
      order: 0,
      kind: 'visualization',
      input: {
        kind: 'dynamic',
        get: () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve('4b3ec120-b892-11e8-a6d9-e546fe2bba5f');
            }, 500);
          });
        },
      },
    }),
  });
  contentManagement.registerContentProvider({
    id: 'viz_content_2',
    getTargetArea: () => `${HOME_PAGE_ID}/service_cards`,
    getContent: () => ({
      id: 'vis_2',
      order: 10,
      kind: 'visualization',
      input: {
        kind: 'dynamic',
        get: () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve('4b3ec120-b892-11e8-a6d9-e546fe2bba5f');
            }, 500);
          });
        },
      },
    }),
  });
  contentManagement.registerContentProvider({
    id: 'viz_content_3',
    getTargetArea: () => `${HOME_PAGE_ID}/service_cards`,
    getContent: () => ({
      id: 'vis_3',
      order: 20,
      kind: 'visualization',
      input: {
        kind: 'static',
        id: '4b3ec120-b892-11e8-a6d9-e546fe2bba5f',
      },
    }),
  });
  contentManagement.registerContentProvider({
    id: 'viz_content_4',
    getTargetArea: () => `${HOME_PAGE_ID}/service_cards`,
    getContent: () => ({
      id: 'vis_4',
      order: 30,
      kind: 'custom',
      render: renderHomeCard,
    }),
  });
};
