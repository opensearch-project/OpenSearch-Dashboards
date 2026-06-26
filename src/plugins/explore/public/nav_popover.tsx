/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { NavPopoverConfig, NavPopoverServices } from '../../../core/public';
import { PLUGIN_ID, ExploreFlavor } from '../common';

interface RecentItem {
  id: string;
  title: string;
  /** Hash portion of the recent link, e.g. `#/view/{id}`. */
  path: string;
}

/**
 * Builds the app id for an explore flavor, e.g. `explore/logs`.
 */
const flavorAppId = (flavor: ExploreFlavor) => `${PLUGIN_ID}/${flavor}`;

/**
 * Hash path that lands on the flavor's main view and asks it to open the
 * "Open saved search" flyout once mounted. A nav-popover action only receives
 * {@link NavPopoverServices} (navigateToApp/basePath/http/recentlyAccessed$) — it
 * has no access to `overlays`, so it cannot open the flyout itself. Instead it
 * navigates with this marker and the app opens the flyout on arrival.
 */
const OPEN_SAVED_PATH = '#/?_openSaved=true';

/**
 * "Recent <flavor> searches" content: recently accessed explore objects for the
 * given flavor (e.g. /app/explore/logs), each opening via navigateToApp.
 */
function RecentExploreSearches({
  flavor,
  recentlyAccessed$,
  navigateToApp,
}: { flavor: ExploreFlavor } & NavPopoverServices) {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const appId = flavorAppId(flavor);
  const appPath = `/app/${appId}`;

  useEffect(() => {
    const sub = recentlyAccessed$.subscribe((items) => {
      const matches = items
        .filter((item) => item.link.includes(appPath))
        .slice(0, 5)
        .map((item) => {
          const hashIndex = item.link.indexOf('#');
          return {
            id: item.id,
            title: item.label,
            path: hashIndex >= 0 ? item.link.slice(hashIndex) : '#/',
          };
        });
      setRecent(matches);
    });
    return () => sub.unsubscribe();
  }, [recentlyAccessed$, appPath]);

  // Omit the whole section when there is nothing recent (no empty-state header).
  if (recent.length === 0) return null;

  return (
    <div className="obsNavPopover-section" data-test-subj={`exploreNavPopover-recent-${flavor}`}>
      <EuiText size="xs" className="obs-nav-category-label obsNavPopover-sectionTitle">
        {i18n.translate('explore.navPopover.recentTitle', {
          defaultMessage: 'Recent {flavor} searches',
          values: { flavor },
        })}
      </EuiText>
      {recent.map((item) => (
        <button
          key={item.id}
          type="button"
          className="obsNavPopover-item"
          onClick={() => navigateToApp(appId, { path: item.path })}
          data-test-subj={`exploreNavPopover-recent-${flavor}-${item.id}`}
        >
          <span className="obsNavPopover-itemLabel">{item.title}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Hash query that lands Metrics in the requested mode. The two modes differ only
 * by `ui.metricsPageMode` (explore = visualize mode; query = PromQL query mode).
 *
 * No dataset is specified: the Metrics page's own `useInitializeMetricsDataset`
 * hook discovers and selects the first available PROMETHEUS connection on mount,
 * so the popover stays deployment agnostic instead of targeting a specific named
 * connection.
 */
const metricsHashPath = (mode?: 'query') => {
  // Always set metricsPageMode explicitly (explore | query) so the page can
  // toggle in BOTH directions when the user is already on Metrics — an omitted
  // mode would leave the page on whatever mode it was last in.
  const ui = mode
    ? 'ui:(activeTabId:logs,metricsPageMode:query,showHistogram:!t)'
    : 'ui:(activeTabId:logs,metricsPageMode:explore,showHistogram:!t)';
  return (
    '#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))' +
    '&_a=(legacy:(columns:!(_source),interval:auto,isDirty:!f,sort:!()),' +
    `tab:(logs:(),patterns:(usingRegexPatterns:!f)),${ui})`
  );
};

/**
 * Metrics nav-popover: "Explore metrics" (visualize mode) and "Query metrics"
 * (PromQL query mode) both open on the Prometheus dataset, plus "Browse saved
 * searches" and the recent-searches list.
 */
export function buildMetricsNavPopover(): NavPopoverConfig {
  const appId = flavorAppId(ExploreFlavor.Metrics);
  return {
    actions: [
      {
        id: 'exploreMetrics',
        label: i18n.translate('explore.navPopover.exploreMetrics', {
          defaultMessage: 'Explore metrics',
        }),
        iconType: 'visAreaStacked',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: metricsHashPath() }),
      },
      {
        id: 'queryMetrics',
        label: i18n.translate('explore.navPopover.queryMetrics', {
          defaultMessage: 'Query metrics',
        }),
        iconType: 'console',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: metricsHashPath('query') }),
      },
      {
        id: 'browseSaved',
        label: i18n.translate('explore.navPopover.browseSaved', {
          defaultMessage: 'Browse saved searches',
        }),
        iconType: 'folderOpen',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: OPEN_SAVED_PATH }),
      },
    ],
    render: (services) => <RecentExploreSearches flavor={ExploreFlavor.Metrics} {...services} />,
  };
}

/**
 * Nav-popover config for an explore flavor (Logs/Traces/Metrics): quick actions
 * (new search / browse saved searches) plus a recent-searches list.
 */
export function buildExploreNavPopover(flavor: ExploreFlavor): NavPopoverConfig {
  const appId = flavorAppId(flavor);
  return {
    actions: [
      {
        id: 'newSearch',
        label: i18n.translate('explore.navPopover.newSearch', {
          defaultMessage: 'New {flavor} search',
          values: { flavor },
        }),
        iconType: 'plusInCircle',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: '#/' }),
      },
      {
        id: 'browseSaved',
        label: i18n.translate('explore.navPopover.browseSaved', {
          defaultMessage: 'Browse saved searches',
        }),
        iconType: 'folderOpen',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: OPEN_SAVED_PATH }),
      },
    ],
    render: (services) => <RecentExploreSearches flavor={flavor} {...services} />,
  };
}
