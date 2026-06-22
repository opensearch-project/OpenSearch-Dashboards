/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { NavPopoverConfig } from '../../../core/public';
import { AGENT_TRACES_NAV_ID, AGENT_SPANS_NAV_ID } from '../common';

/** The Observability "Logs" explore app id. */
const EXPLORE_LOGS_APP_ID = 'explore/logs';

/**
 * Hash path that lands the agent-traces app on the given tab and asks it to open
 * the "Open saved search" flyout once mounted (the app honors `_openSaved=true`
 * in the hash query). A nav-popover action only receives navigateToApp, so it
 * can't open the flyout itself — it navigates with this marker instead.
 */
const openSavedPath = (tab: 'traces' | 'spans') =>
  `#/?_openSaved=true&_a=(ui:(activeTabId:${tab},showHistogram:!t))`;

/** Hash path for a fresh search on the given tab. */
const newSearchPath = (tab: 'traces' | 'spans') =>
  `#/?_a=(ui:(activeTabId:${tab},showHistogram:!t))`;

/**
 * Nav-popover config for an agent-monitoring flavor (Traces/Spans): quick
 * actions to jump to Logs, start a new search, or browse saved searches. The
 * item still navigates to the flavor on direct click.
 */
function buildAgentNavPopover(appId: string, tab: 'traces' | 'spans'): NavPopoverConfig {
  return {
    actions: [
      {
        id: 'logs',
        label: i18n.translate('agentTraces.navPopover.logs', {
          defaultMessage: 'Logs',
        }),
        iconType: 'discoverApp',
        onClick: ({ navigateToApp }) => navigateToApp(EXPLORE_LOGS_APP_ID, { path: '#/' }),
      },
      {
        id: 'newSearch',
        label: i18n.translate('agentTraces.navPopover.newSearch', {
          defaultMessage: 'New agent {tab} search',
          values: { tab },
        }),
        iconType: 'plusInCircle',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: newSearchPath(tab) }),
      },
      {
        id: 'browseSaved',
        label: i18n.translate('agentTraces.navPopover.browseSaved', {
          defaultMessage: 'Browse saved searches',
        }),
        iconType: 'folderOpen',
        onClick: ({ navigateToApp }) => navigateToApp(appId, { path: openSavedPath(tab) }),
      },
    ],
  };
}

export const agentTracesNavPopover: NavPopoverConfig = buildAgentNavPopover(
  AGENT_TRACES_NAV_ID,
  'traces'
);

export const agentSpansNavPopover: NavPopoverConfig = buildAgentNavPopover(
  AGENT_SPANS_NAV_ID,
  'spans'
);
