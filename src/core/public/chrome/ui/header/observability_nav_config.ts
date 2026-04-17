/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hardcoded navigation configuration for the Observability workspace.
 * Activated when `home:enableIconSideNav` is true and the user is in the Observability workspace.
 * Items are filtered at render time against `application.applications$` to hide uninstalled plugins.
 */

import { i18n } from '@osd/i18n';

// --- Types ---

export interface ObsNavItem {
  /** App ID — used for existence check via applications$ and for navigateToApp() */
  id: string;
  /** Display title in the nav */
  title: string;
  /** EUI icon name. Required for items that appear in the collapsed icon strip. */
  icon?: string;
  /** Child items. Rendered inline in expanded mode, as popover in collapsed mode. */
  children?: ObsNavItem[];
  /** Whether this item renders as a collapsible accordion in expanded mode. */
  collapsible?: boolean;
  /** Initial collapsed state when collapsible is true. Defaults to false (expanded). */
  defaultCollapsed?: boolean;
  /** Custom click handler — overrides default navigateToApp behavior (e.g. open a modal). */
  onClick?: () => void;
}

export interface ObsNavSection {
  /** Section type: 'items' for a flat list, 'category' for a labeled group */
  type: 'items' | 'category';
  /** Category label (only for type: 'category') */
  label?: string;
  /** Category icon (only Manage Workspace has one — used in collapsed strip) */
  icon?: string;
  /** Items in this section */
  items: ObsNavItem[];
  /** Whether the whole section is collapsible in expanded mode. */
  collapsible?: boolean;
  /** Initial collapsed state when collapsible is true. Defaults to false (expanded). */
  defaultCollapsed?: boolean;
}

// --- Hardcoded Nav Config ---

export const OBSERVABILITY_NAV_SECTIONS: ObsNavSection[] = [
  // ── Section 1: Top-level items (no category header) ──
  {
    type: 'items',
    items: [
      {
        id: 'dashboards',
        title: i18n.translate('core.obsNav.dashboards', { defaultMessage: 'Dashboards' }),
        icon: 'dashboardApp',
      },
      {
        id: 'alerts',
        title: i18n.translate('core.obsNav.alerts', { defaultMessage: 'Alerts' }),
        icon: 'navAlerting',
      },
      {
        id: 'explore/logs',
        title: i18n.translate('core.obsNav.logs', { defaultMessage: 'Logs' }),
        icon: 'discoverApp',
      },
      {
        id: 'explore/metrics',
        title: i18n.translate('core.obsNav.metrics', { defaultMessage: 'Metrics' }),
        icon: 'visAreaStacked',
      },
      {
        id: 'agentTraces',
        title: i18n.translate('core.obsNav.agentTraces', { defaultMessage: 'Agent Traces' }),
        icon: 'uptimeApp',
      },
      {
        id: 'observability-apm-application-map',
        title: i18n.translate('core.obsNav.topologyMap', { defaultMessage: 'Topology Map' }),
        icon: 'graphApp',
      },
    ],
  },

  // ── Section 2: Application Performance ──
  {
    type: 'category',
    label: i18n.translate('core.obsNav.applicationPerformance', {
      defaultMessage: 'Application Performance',
    }),
    items: [
      {
        id: 'explore/traces',
        title: i18n.translate('core.obsNav.traces', { defaultMessage: 'Traces' }),
        icon: 'apmTrace',
      },
      {
        id: 'observability-apm-services',
        title: i18n.translate('core.obsNav.services', { defaultMessage: 'Services' }),
        icon: 'navServiceMap',
      },
    ],
  },

  // ── Section 3: Tools (collapsible) ──
  {
    type: 'category',
    label: i18n.translate('core.obsNav.tools', { defaultMessage: 'Tools' }),
    collapsible: true,
    defaultCollapsed: false,
    items: [
      {
        id: 'observability-notebooks',
        title: i18n.translate('core.obsNav.notebooks', { defaultMessage: 'Notebooks' }),
        icon: 'navNotebooks',
      },
      {
        id: 'anomaly_detection_dashboard-overview',
        title: i18n.translate('core.obsNav.anomalyDetection', {
          defaultMessage: 'Anomaly Detection',
        }),
        icon: 'navAnomalyDetection',
        collapsible: true,
        defaultCollapsed: true,
        children: [
          {
            id: 'anomaly_detection_dashboard-overview',
            title: i18n.translate('core.obsNav.anomalyDetection.getStarted', {
              defaultMessage: 'Get started',
            }),
          },
          {
            id: 'anomaly_detection_dashboard-dashboard',
            title: i18n.translate('core.obsNav.anomalyDetection.dashboard', {
              defaultMessage: 'Dashboard',
            }),
          },
          {
            id: 'anomaly_detection_dashboard-detectors',
            title: i18n.translate('core.obsNav.anomalyDetection.detectors', {
              defaultMessage: 'Detectors',
            }),
          },
        ],
      },
      {
        id: 'forecasting',
        title: i18n.translate('core.obsNav.forecasting', { defaultMessage: 'Forecasting' }),
        icon: 'visLine',
      },
      {
        id: 'alerts',
        title: i18n.translate('core.obsNav.alerting', { defaultMessage: 'Alerting' }),
        icon: 'navAlerting',
        collapsible: true,
        defaultCollapsed: true,
        children: [
          {
            id: 'monitors',
            title: i18n.translate('core.obsNav.alerting.monitors', {
              defaultMessage: 'Monitors',
            }),
          },
          {
            id: 'destinations',
            title: i18n.translate('core.obsNav.alerting.destinations', {
              defaultMessage: 'Destinations',
            }),
          },
        ],
      },
      {
        id: 'dev_tools',
        title: i18n.translate('core.obsNav.developer', { defaultMessage: 'Developer' }),
        icon: 'consoleApp',
      },
    ],
  },

  // ── Section 4: Manage Workspace (collapsible, collapsed by default) ──
  {
    type: 'category',
    label: i18n.translate('core.obsNav.manageWorkspace', { defaultMessage: 'Manage Workspace' }),
    icon: 'spacesApp',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      {
        id: 'workspace_detail',
        title: i18n.translate('core.obsNav.workspaceDetails', {
          defaultMessage: 'Workspace details',
        }),
      },
      {
        id: 'dataSources',
        title: i18n.translate('core.obsNav.dataSources', { defaultMessage: 'Data sources' }),
      },
      {
        id: 'indexPatterns',
        title: i18n.translate('core.obsNav.indexPatterns', { defaultMessage: 'Index patterns' }),
      },
      {
        id: 'datasets',
        title: i18n.translate('core.obsNav.datasets', { defaultMessage: 'Datasets' }),
      },
      {
        id: 'objects',
        title: i18n.translate('core.obsNav.assets', { defaultMessage: 'Assets' }),
      },
      {
        id: 'import_sample_data',
        title: i18n.translate('core.obsNav.sampleData', { defaultMessage: 'Sample data' }),
      },
    ],
  },
];

// --- Filtering ---

/**
 * Collect all unique app IDs referenced in the nav config (items + children).
 */
function collectAppIds(sections: ObsNavSection[]): Set<string> {
  const ids = new Set<string>();
  const walk = (items: ObsNavItem[]) => {
    for (const item of items) {
      ids.add(item.id);
      if (item.children) {
        for (const child of item.children) {
          ids.add(child.id);
        }
      }
    }
  };
  for (const section of sections) {
    walk(section.items);
  }
  return ids;
}

/**
 * Filter the nav config to only include items whose app IDs exist in the installed apps set.
 * - Leaf items: kept if their ID is in installedAppIds
 * - Items with children: kept if at least one child's ID is in installedAppIds
 * - Sections: kept if at least one item survives filtering
 */
export function filterByInstalledApps(
  sections: ObsNavSection[],
  installedAppIds: Set<string>
): ObsNavSection[] {
  return sections
    .map((section) => {
      const filteredItems = section.items
        .map((item) => {
          if (item.children) {
            const filteredChildren = item.children.filter((child) => installedAppIds.has(child.id));
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }
          return installedAppIds.has(item.id) ? item : null;
        })
        .filter(Boolean) as ObsNavItem[];

      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    })
    .filter(Boolean) as ObsNavSection[];
}

/** All app IDs referenced in the config — useful for pre-checking. */
export const OBSERVABILITY_APP_IDS = collectAppIds(OBSERVABILITY_NAV_SECTIONS);

// --- Shared Helpers ---

/**
 * Check whether a nav item (or any of its children) matches the current app ID.
 */
export function isNavItemActive(item: ObsNavItem, appId?: string): boolean {
  if (!appId) return false;
  if (item.id === appId) return true;
  if (item.children) {
    return item.children.some((child) => child.id === appId);
  }
  return false;
}
