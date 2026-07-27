/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ButtonActionConfig } from '../services/query_panel_actions_registry';
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';
import { LOGS_DRILLDOWN_APP_ID } from '../../common';

const label = i18n.translate('explore.queryPanel.logsDrilldownLabel', {
  defaultMessage: 'Explore logs',
});

/**
 * Query-bar action that opens the standalone Logs Drilldown app — a second entry point alongside
 * the side-nav item (next to "Import data" / "Create monitor"). A button action; uses the explore
 * global `getServices()` for navigation since button `onClick` receives only query dependencies.
 */
export const logsDrilldownActionConfig: ButtonActionConfig = {
  id: 'logs-drilldown',
  actionType: 'button',
  order: 150,
  getLabel: () => label,
  getIcon: () => 'inspect',
  getIsEnabled: () => true,
  onClick: () => {
    getServices().core.application.navigateToApp(LOGS_DRILLDOWN_APP_ID, { path: '#/' });
  },
};
