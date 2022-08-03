/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiTitle } from '@elastic/eui';
import React from 'react';
import { withRouter } from 'react-router-dom';
import { getListBreadcrumbs } from '../breadcrumbs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../types';

export const DataSourceTable = () => {
  const { setBreadcrumbs } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  setBreadcrumbs(getListBreadcrumbs());

  return (
    <EuiTitle>
      <h2>{'This is the landing page, going to list data sources here...'}</h2>
    </EuiTitle>
  );
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
