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
  DataSourceTableItem,
  ToastMessageItem,
} from '../../types';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CreateDataSourceForm } from './components/create_form';
import { createSingleDataSource, getDataSources, testConnection } from '../utils';
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
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  /* State Variables */
  const [existingDatasourceNamesList, setExistingDatasourceNamesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* Set breadcrumb */
  useEffectOnce(() => {
    setBreadcrumbs(getCreateBreadcrumbs());
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
        id: 'dataSourcesManagement.createDataSource.existingDatasourceNames',
        defaultMessage: 'Unable to fetch some resources.',
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
      await createSingleDataSource(savedObjects.client, attributes);
      props.history.push('');
    } catch (e) {
      setIsLoading(false);
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.createDataSource.createDataSourceFailMsg',
        defaultMessage: 'Creation of the Data Source failed with some errors.',
      });
    }
  };

  /* Handle submit - create data source*/
  const handleTestConnection = async (attributes: DataSourceAttributes) => {
    setIsLoading(true);
    try {
      await testConnection(http, attributes);
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.createDataSource.testConnectionSuccessMsg',
        defaultMessage:
          'Connecting to the endpoint using the provided authentication method was successful.',
        success: true,
      });
    } catch (e) {
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.createDataSource.testConnectionFailMsg',
        defaultMessage:
          'Failed Connecting to the endpoint using the provided authentication method.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayToastMessage = ({ id, defaultMessage, success }: ToastMessageItem) => {
    if (success) {
      toasts.addSuccess(i18n.translate(id, { defaultMessage }));
    } else {
      toasts.addDanger(i18n.translate(id, { defaultMessage }));
    }
  };

  /* Render the creation wizard */
  const renderContent = () => {
    return (
      <>
        <CreateDataSourceForm
          handleSubmit={handleSubmit}
          handleTestConnection={handleTestConnection}
          handleCancel={() => props.history.push('')}
          existingDatasourceNamesList={existingDatasourceNamesList}
        />
        {isLoading ? <LoadingMask /> : null}
      </>
    );
  };

  return renderContent();
};

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
