/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';
import { DashboardConstants } from '../../dashboard_constants';
import { ViewMode } from '../../embeddable_plugin';

export function getLandingBreadcrumbs() {
  return [
    {
      text: i18n.translate('dashboard.dashboardAppBreadcrumbsTitle', {
        defaultMessage: 'Dashboards',
      }),
      href: `#${DashboardConstants.LANDING_PAGE_PATH}`,
    },
  ];
}

export const setBreadcrumbsForNewDashboard = (viewMode: ViewMode, isDirty: boolean) => {
  if (viewMode === ViewMode.VIEW) {
    return [
      ...getLandingBreadcrumbs(),
      {
        text: i18n.translate('dashboard.strings.dashboardViewTitle', {
          defaultMessage: 'New Dashboard',
        }),
      },
    ];
  } else {
    if (isDirty) {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.dashboardEditTitle', {
            defaultMessage: 'Editing New Dashboard (unsaved)',
          }),
        },
      ];
    } else {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.dashboardEditTitle', {
            defaultMessage: 'Editing New Dashboard',
          }),
        },
      ];
    }
  }
};

export const setBreadcrumbsForExistingDashboard = (
  title: string,
  viewMode: ViewMode,
  isDirty: boolean
) => {
  if (viewMode === ViewMode.VIEW) {
    return [
      ...getLandingBreadcrumbs(),
      {
        text: i18n.translate('dashboard.strings.dashboardViewTitle', {
          defaultMessage: '{title}',
          values: { title },
        }),
      },
    ];
  } else {
    if (isDirty) {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.dashboardEditTitle', {
            defaultMessage: 'Editing {title} (unsaved)',
            values: { title },
          }),
        },
      ];
    } else {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.dashboardEditTitle', {
            defaultMessage: 'Editing {title}',
            values: { title },
          }),
        },
      ];
    }
  }
};
