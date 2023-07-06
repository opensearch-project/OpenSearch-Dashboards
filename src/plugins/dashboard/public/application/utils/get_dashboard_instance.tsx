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

import { Dashboard, DashboardParams } from '../../dashboard';
import { SavedObjectDashboard } from '../../saved_dashboards';
import { convertToSerializedDashboard } from '../../saved_dashboards/_saved_dashboard';
import { DashboardServices } from '../../types';

export const getDashboardInstance = async (
  dashboardServices: DashboardServices,
  /**
   * opts can be either a saved dashboard id passed as string,
   * or an object of new dashboard params.
   * Both come from url search query
   */
  opts?: Record<string, unknown> | string
): Promise<{
  savedDashboard: SavedObjectDashboard;
  dashboard: Dashboard<DashboardParams>;
}> => {
  const { savedDashboards } = dashboardServices;

  // Get the existing dashboard/default new dashboard from saved object loader
  const savedDashboard: SavedObjectDashboard = await savedDashboards.get(opts);

  // Serialized the saved object dashboard
  const serializedDashboard = convertToSerializedDashboard(savedDashboard);

  // Create a Dashboard class using the serialized dashboard
  const dashboard = new Dashboard(serializedDashboard);
  await dashboard.setState(serializedDashboard);

  return {
    savedDashboard,
    dashboard,
  };
};
