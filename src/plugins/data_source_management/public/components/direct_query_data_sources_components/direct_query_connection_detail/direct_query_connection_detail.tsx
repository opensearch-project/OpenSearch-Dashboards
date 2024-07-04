/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
} from '@elastic/eui';
import {
  HttpStart,
  IUiSettingsClient,
  NotificationsStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import { useParams } from 'react-router-dom';
import { DATACONNECTIONS_BASE } from '../../../constants';
import { DirectQueryDatasourceDetails } from '../../../types';
import { NoAccess } from './no_access_page';
import { getManageDirectQueryDataSourceBreadcrumbs } from '../../breadcrumbs';

interface DirectQueryDataConnectionDetailProps {
  featureFlagStatus: boolean;
  http: HttpStart;
  notifications: NotificationsStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  setBreadcrumbs: (breadcrumbs: any) => void;
}

export const DirectQueryDataConnectionDetail: React.FC<DirectQueryDataConnectionDetailProps> = ({
  featureFlagStatus,
  http,
  notifications,
  savedObjects,
  uiSettings,
  setBreadcrumbs,
}) => {
  const { dataSourceName } = useParams<{ dataSourceName: string }>();
  const [datasourceDetails, setDatasourceDetails] = useState<DirectQueryDatasourceDetails>({
    allowedRoles: [],
    name: '',
    description: '',
    connector: 'PROMETHEUS',
    properties: { 'prometheus.uri': 'placeholder' },
    status: 'ACTIVE',
  });
  const [hasAccess, setHasAccess] = useState(true);

  const fetchSelectedDatasource = () => {
    http
      .get(`${DATACONNECTIONS_BASE}/${dataSourceName}`)
      .then((data) => {
        setDatasourceDetails({
          allowedRoles: data.allowedRoles,
          description: data.description,
          name: data.name,
          connector: data.connector,
          properties: data.properties,
          status: data.status,
        });
      })
      .catch((_err) => {
        setHasAccess(false);
      });
  };

  useEffect(() => {
    setBreadcrumbs(getManageDirectQueryDataSourceBreadcrumbs(dataSourceName));
    fetchSelectedDatasource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBreadcrumbs, http]);

  if (!hasAccess) {
    return <NoAccess />;
  }

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader style={{ justifyContent: 'spaceBetween' }}>
          <EuiPageHeaderSection style={{ width: '100%', justifyContent: 'space-between' }}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle data-test-subj="datasourceTitle" size="l">
                  <h1>{datasourceDetails.name}</h1>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageHeaderSection>
        </EuiPageHeader>
      </EuiPageBody>
    </EuiPage>
  );
};
