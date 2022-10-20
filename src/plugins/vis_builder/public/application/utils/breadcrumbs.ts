/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { VISUALIZE_ID } from '../../../common';

const defaultEditText = i18n.translate('visBuilder.editor.defaultEditBreadcrumbText', {
  defaultMessage: 'Edit',
});

export function getVisualizeLandingBreadcrumbs(navigateToApp) {
  return [
    {
      text: i18n.translate('visBuilder.listing.breadcrumb', {
        defaultMessage: 'Visualize',
      }),
      onClick: () => navigateToApp(VISUALIZE_ID),
    },
  ];
}

export function getCreateBreadcrumbs(navigateToApp) {
  return [
    ...getVisualizeLandingBreadcrumbs(navigateToApp),
    {
      text: i18n.translate('visBuilder.editor.createBreadcrumb', {
        defaultMessage: 'Create',
      }),
    },
  ];
}

export function getEditBreadcrumbs(text: string = defaultEditText, navigateToApp) {
  return [
    ...getVisualizeLandingBreadcrumbs(navigateToApp),
    {
      text,
    },
  ];
}
