/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import { AppMountParameters } from '../../../../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { LogsDrilldownPage } from './logs_drilldown_page';

/**
 * Standalone renderer for the Logs Drilldown app. Intentionally minimal — the onboarding canvas is
 * self-contained and does NOT participate in the shared explore Redux store, tabs, or query panel.
 * It only needs `services` (via the OSD context) + i18n. Handoff to the logs Query experience is via
 * `navigateToApp`, so there is no store/Router coupling here.
 */
export const renderLogsDrilldownApp = (
  { element, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <services.core.i18n.Context>
        <LogsDrilldownPage services={services} setHeaderActionMenu={setHeaderActionMenu} />
      </services.core.i18n.Context>
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};
