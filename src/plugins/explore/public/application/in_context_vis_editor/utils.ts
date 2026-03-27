/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { NavigateToAppOptions } from 'opensearch-dashboards/public';

export interface ContainerInfo {
  containerName: string;
  containerId: string;
}

export function getPreviousBreadcrumbs(
  navigateToApp: (appId: string, options?: NavigateToAppOptions) => Promise<void>,
  originatingApp?: string,
  containerInfo?: ContainerInfo
) {
  if (originatingApp && containerInfo) {
    return [
      {
        text: i18n.translate('explore.visualization.editor.originatingApp.breadcrumb', {
          defaultMessage: '{containerName}',
          values: { containerName: containerInfo.containerName },
        }),
        onClick: () =>
          navigateToApp(originatingApp, { path: `#/view/${containerInfo.containerId}` }),
      },
    ];
  }
  return [
    {
      text: i18n.translate('explore.visualization.editor.visualizeList.breadcrumb', {
        defaultMessage: 'Visualize',
      }),
      onClick: () => navigateToApp('visualize'),
    },
  ];
}
