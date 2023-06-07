/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from 'src/plugins/data/public';
import { DashboardServices } from '../../types';

export const getDefaultQuery = ({ data }: DashboardServices) => {
  return data.query.queryString.getDefaultQuery();
};

export const dashboardStateToEditorState = (
  dashboardInstance: any,
  services: DashboardServices
) => {
  const savedDashboardState = {
    id: dashboardInstance.id,
    title: dashboardInstance.title,
    description: dashboardInstance.description,
    searchSource: dashboardInstance.searchSource,
    savedSearchId: dashboardInstance.savedSearchId,
  };
  return {
    query: dashboardInstance.searchSource?.getOwnField('query') || getDefaultQuery(services),
    filters: (dashboardInstance.searchSource?.getOwnField('filter') as Filter[]) || [],
    savedDashboardState,
  };
};
