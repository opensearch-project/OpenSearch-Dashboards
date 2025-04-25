/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  DataSourceAttributes,
  DataSourceManagementContext,
  DataSourceManagementToastMessageItem,
  DataSourceTableItem,
} from '../../types';
import { getCreateOpenSearchDataSourceBreadcrumbs } from '../breadcrumbs';
import { CreateDataSourceForm } from './components/create_form';
import {
  createSingleDataSource,
  getDataSources,
  testConnection,
  fetchDataSourceMetaData,
  handleSetDefaultDatasource,
} from '../utils';
import { LoadingMask } from '../loading_mask';

type CreateDataSourceWizardProps = RouteComponentProps;

export const CreateDataSourceWizard: React.FunctionComponent<CreateDataSourceWizardProps> = (
  props: CreateDataSourceWizardProps
) => {
  /* Initialization */
  const {
    savedObjects,
    setBreadcrumbs,
    http,
    notifications: { toasts },
    uiSettings,
    navigation,
    application,
    workspaces,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  /* State Variables */
  const [existingDatasourceNamesList, setExistingDatasourceNamesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const useNewUX = uiSettings.get('home:useNewHomePage');
  const currentWorkspaceId = workspaces.currentWorkspaceId$.getValue();

  /* Set breadcrumb */
  useEffectOnce(() => {
    setBreadcrumbs(getCreateOpenSearchDataSourceBreadcrumbs(useNewUX));
    getExistingDataSourceNames();
  });

  /* fetch datasources */
  const getExistingDataSourceNames = async () => {
    setIsLoading(true);
    try {
      const listOfDataSources: DataSourceTableItem[] = await getDataSources(savedObjects.client);

      if (Array.isArray(listOfDataSources) && listOfDataSources.length) {
        setExistingDatasourceNamesList(
          listOfDataSources.map((datasource) => datasource.title?.toLowerCase())
        );
      }
    } catch (e) {
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.createDataSource.existingDatasourceNames', {
          defaultMessage: 'Unable to fetch some resources.',
        }),
      });
      props.history.push('');
    } finally {
      setIsLoading(false);
    }
  };

  /* Handle submit - create data source*/
  const handleSubmit = async (attributes: DataSourceAttributes) => {
    setIsLoading(true);
    try {
      // Fetch data source metadata from added OS/ES domain/cluster
      const metadata = await fetchDataSourceMetaData(http, attributes);
      attributes.dataSourceVersion = metadata.dataSourceVersion;
      attributes.dataSourceEngineType = metadata.dataSourceEngineType;
      attributes.installedPlugins = metadata.installedPlugins;
      await createSingleDataSource(savedObjects.client, attributes);
      // Set the first create data source as default data source.
      await handleSetDefaultDatasource(savedObjects.client, uiSettings, !!currentWorkspaceId);
      props.history.push('');
    } catch (e) {
      setIsLoading(false);
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.createDataSource.createDataSourceFailMsg', {
          defaultMessage: 'Creation of the Data Source failed with some errors.',
        }),
      });
    }
  };

  /* Handle submit - create data source*/
  const handleTestConnection = async (attributes: DataSourceAttributes) => {
    setIsLoading(true);
    try {
      await testConnection(http, attributes);
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.createDataSource.testConnectionSuccessMsg', {
          defaultMessage:
            'Connecting to the endpoint using the provided authentication method was successful.',
        }),
        success: true,
      });
    } catch (e) {
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.createDataSource.testConnectionFailMsg', {
          defaultMessage:
            'Failed Connecting to the endpoint using the provided authentication method.',
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayToastMessage = ({
    message,
    success,
  }: DataSourceManagementToastMessageItem) => {
    if (success) {
      toasts.addSuccess(message);
    } else {
      toasts.addDanger(message);
    }
  };

  /* Render the creation wizard */
  const renderContent = () => {
    return (
      <>
        <CreateDataSourceForm
          useNewUX={useNewUX}
          navigation={navigation}
          application={application}
          handleSubmit={handleSubmit}
          handleTestConnection={handleTestConnection}
          handleCancel={() => props.history.push('/create')}
          existingDatasourceNamesList={existingDatasourceNamesList}
        />
        {isLoading ? <LoadingMask /> : null}
      </>
    );
  };

  return renderContent();
};

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
