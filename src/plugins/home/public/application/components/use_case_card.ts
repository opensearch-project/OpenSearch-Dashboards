/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { ContentManagementPluginStart } from '../../../../content_management/public';

export const registerUseCaseCard = (
  contentManagement: ContentManagementPluginStart,
  workspaceEnabled: boolean,
  {
    target,
    order,
    id,
    title,
    description,
    icon,
  }: {
    target: string;
    order: number;
    id: string;
    title: string;
    description: string;
    icon: string;
  }
) => {
  if (workspaceEnabled) return;
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
      getIcon: () =>
        React.createElement(EuiIcon, {
          size: 'l',
          color: 'subdued',
          type: icon,
        }),
    }),
  });
};
