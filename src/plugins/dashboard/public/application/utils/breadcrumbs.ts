/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DashboardConstants } from '../../dashboard_constants';
import { ViewMode } from '../../../../embeddable/public';

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
        text: i18n.translate('dashboard.strings.newDashboardViewTitle', {
          defaultMessage: 'New Dashboard',
        }),
      },
    ];
  } else {
    if (isDirty) {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.newDashboardEditTitleUnsaved', {
            defaultMessage: 'Editing New Dashboard (unsaved)',
          }),
        },
      ];
    } else {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.newDashboardEditTitle', {
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
        text: i18n.translate('dashboard.strings.existingDashboardViewTitle', {
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
          text: i18n.translate('dashboard.strings.existingDashboardEditTitleUnsaved', {
            defaultMessage: 'Editing {title} (unsaved)',
            values: { title },
          }),
        },
      ];
    } else {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.existingDashboardEditTitle', {
            defaultMessage: 'Editing {title}',
            values: { title },
          }),
        },
      ];
    }
  }
};
