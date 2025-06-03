/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiCallOut } from '@elastic/eui';
import React from 'react';
import { DATACONNECTIONS_BASE, DATACONNECTIONS_UPDATE_STATUS, EDIT } from '../../../../constants';
import { DataSourceManagementContext, DirectQueryDatasourceDetails } from '../../../../types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

interface InactiveDataConnectionCalloutProps {
  datasourceDetails: DirectQueryDatasourceDetails;
  fetchSelectedDatasource: () => void;
}

export const InactiveDataConnectionCallout: React.FC<InactiveDataConnectionCalloutProps> = ({
  datasourceDetails,
  fetchSelectedDatasource,
}) => {
  const { notifications, http } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const enableDataSource = () => {
    http
      .post(`${DATACONNECTIONS_BASE}${EDIT}${DATACONNECTIONS_UPDATE_STATUS}`, {
        body: JSON.stringify({ name: datasourceDetails.name, status: 'active' }),
      })
      .then(() => {
        notifications.toasts.addSuccess(
          `Data connection ${datasourceDetails.name} enabled successfully`
        );
        fetchSelectedDatasource();
      })
      .catch((err) => {
        notifications.toasts.addDanger(
          `Data connection ${datasourceDetails.name} could not be enabled.`
        );
      });
  };

  return (
    <EuiCallOut title="This data source connection is inactive" color="warning" iconType="help">
      <p>
        Associated objects and accelerations are not available while this connection is inactive.
      </p>
      <EuiButton onClick={enableDataSource} color="warning">
        Enable connection
      </EuiButton>
    </EuiCallOut>
  );
};
