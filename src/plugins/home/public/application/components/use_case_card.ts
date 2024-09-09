/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiIcon } from '@elastic/eui';
import { ContentManagementPluginStart } from '../../../../content_management/public';

export const registerUseCaseCard = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart,
  {
    target,
    order,
    id,
    title,
    description,
    icon,
    navigateAppId,
  }: {
    target: string;
    order: number;
    id: string;
    title: string;
    description: string;
    icon: string;
    navigateAppId: string;
  }
) => {
  contentManagement.registerContentProvider({
    id: `home_get_started_${id}`,
    getTargetArea: () => target,
    getContent: () => ({
      id,
      kind: 'card',
      order,
      description,
      title,
      cardProps: {
        layout: 'horizontal',
      },
      onClick: () => {
        core.application.navigateToApp(navigateAppId);
      },
      getIcon: () =>
        React.createElement(EuiIcon, {
          size: 'l',
          color: 'subdued',
          type: icon,
        }),
    }),
  });
};
