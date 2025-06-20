/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { VISUALIZE_ID } from '../../../common';

const defaultEditText = i18n.translate('visBuilder.editor.defaultEditBreadcrumbText', {
  defaultMessage: 'Edit',
});

// @ts-expect-error TS7006 TODO(ts-error): fixme
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

// @ts-expect-error TS7006 TODO(ts-error): fixme
export function getCreateBreadcrumbs(navigateToApp, isMigrated: boolean) {
  return [
    ...getVisualizeLandingBreadcrumbs(navigateToApp),
    {
      text: isMigrated
        ? i18n.translate('visBuilder.editor.newVisualizationBreadcrumb', {
            defaultMessage: 'New visualization',
          })
        : i18n.translate('visBuilder.editor.createBreadcrumb', {
            defaultMessage: 'Create',
          }),
    },
  ];
}

// @ts-expect-error TS7006 TODO(ts-error): fixme
export function getEditBreadcrumbs(text: string = defaultEditText, navigateToApp) {
  return [
    ...getVisualizeLandingBreadcrumbs(navigateToApp),
    {
      text,
    },
  ];
}
