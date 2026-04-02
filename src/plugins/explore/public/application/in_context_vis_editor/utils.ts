/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { NavigateToAppOptions } from 'opensearch-dashboards/public';
import { EmbeddableStart } from 'src/plugins/embeddable/public';

export const CONTAINER_URL_KEY = '_c';

export interface ContainerState {
  originatingApp: string | undefined;
  containerInfo: ContainerInfo | undefined;
}

export interface ContainerInfo {
  containerName: string;
  containerId: string;
}

export function getPreviousBreadcrumbs(
  navigateToApp: (appId: string, options?: NavigateToAppOptions) => Promise<void>,
  embeddable: EmbeddableStart,
  originatingApp?: string,
  containerInfo?: ContainerInfo
) {
  if (!originatingApp) {
    return [
      {
        text: i18n.translate('explore.visualization.editor.visualizeList.breadcrumb', {
          defaultMessage: 'Visualize',
        }),
        onClick: () => navigateToApp('visualize'),
      },
    ];
  }

  const stateTransfer = embeddable.getStateTransfer();
  return [
    {
      text: i18n.translate('explore.visualization.editor.originatingApp.breadcrumb', {
        defaultMessage: 'Dashboards',
      }),

      onClick: () => navigateToApp(originatingApp, { path: `#/list` }),
    },
    {
      text: containerInfo?.containerId
        ? i18n.translate('explore.visualization.editor.originatingApp.containerName.breadcrumb', {
            defaultMessage: '{containerName}',
            values: { containerName: containerInfo.containerName },
          })
        : i18n.translate('explore.visualization.editor.originatingApp.newDashboard.breadcrumb', {
            defaultMessage: 'New dashboard',
          }),
      onClick: () => stateTransfer.navigateToWithEmbeddablePackage(originatingApp),
    },
  ];
}
