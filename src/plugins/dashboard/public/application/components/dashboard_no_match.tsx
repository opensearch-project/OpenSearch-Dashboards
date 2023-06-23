/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../types';

export const DashboardNoMatch = () => {
  const { services } = useOpenSearchDashboards<DashboardServices>();
  useEffect(() => {
    const path = window.location.hash.substring(1);
    services.restorePreviousUrl();

    const { navigated } = services.navigateToLegacyOpenSearchDashboardsUrl(path);
    if (!navigated) {
      services.navigateToDefaultApp();
    }
  }, [services]);

  return null;
};
