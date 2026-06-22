/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { NavPopoverConfig, NavPopoverServices } from '../../../core/public';
import { DashboardConstants, createDashboardEditUrl } from './dashboard_constants';

interface DashboardItem {
  id: string;
  title: string;
}

/**
 * Custom popover content for the Dashboards nav item: a "Recent dashboards" list
 * of recently accessed dashboards (rendered below the declarative actions). The
 * whole section is omitted when there is nothing recent.
 */
function RecentDashboards({ recentlyAccessed$, navigateToApp }: NavPopoverServices) {
  const [recentDashboards, setRecentDashboards] = useState<DashboardItem[]>([]);

  useEffect(() => {
    const sub = recentlyAccessed$.subscribe((items) => {
      const dashboardItems = items
        .filter(
          (item) => item.link.includes('/app/dashboards') || item.link.includes('/app/dashboard')
        )
        .slice(0, 5)
        .map((item) => ({ id: item.id, title: item.label }));
      setRecentDashboards(dashboardItems);
    });
    return () => sub.unsubscribe();
  }, [recentlyAccessed$]);

  if (recentDashboards.length === 0) return null;

  return (
    <div className="obsNavPopover-section" data-test-subj="dashboardNavPopover-recent">
      <EuiText size="xs" className="obs-nav-category-label obsNavPopover-sectionTitle">
        {i18n.translate('dashboard.navPopover.recentTitle', {
          defaultMessage: 'Recent dashboards',
        })}
      </EuiText>
      {recentDashboards.map((item) => (
        <button
          key={item.id}
          type="button"
          className="obsNavPopover-item"
          onClick={() =>
            navigateToApp(DashboardConstants.DASHBOARDS_ID, {
              path: `#${createDashboardEditUrl(item.id)}`,
            })
          }
          data-test-subj={`dashboardNavPopover-recent-${item.id}`}
        >
          <span className="obsNavPopover-itemLabel">{item.title}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The nav-popover config registered for the Dashboards nav item: quick actions
 * (create / view all) plus a recent-dashboards list.
 */
export const dashboardNavPopover: NavPopoverConfig = {
  actions: [
    {
      id: 'createNew',
      label: i18n.translate('dashboard.navPopover.createNew', {
        defaultMessage: 'Create new dashboard',
      }),
      iconType: 'plusInCircle',
      onClick: ({ navigateToApp }) =>
        navigateToApp(DashboardConstants.DASHBOARDS_ID, {
          path: `#${DashboardConstants.CREATE_NEW_DASHBOARD_URL}`,
        }),
    },
    {
      id: 'viewAll',
      label: i18n.translate('dashboard.navPopover.viewAll', {
        defaultMessage: 'View all dashboards',
      }),
      iconType: 'list',
      onClick: ({ navigateToApp }) =>
        navigateToApp(DashboardConstants.DASHBOARDS_ID, {
          path: `#${DashboardConstants.LANDING_PAGE_PATH}`,
        }),
    },
  ],
  render: (services) => <RecentDashboards {...services} />,
};
