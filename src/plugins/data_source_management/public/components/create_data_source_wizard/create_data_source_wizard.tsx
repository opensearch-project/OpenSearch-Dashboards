/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext, DataSourceTableItem, ToastMessageItem } from '../../types';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CreateDataSourceForm } from './components/create_form';
import { createSingleDataSource, getDataSources } from '../utils';
import { LoadingMask } from '../loading_mask';
import { DataSourceAttributes } from '../../types';

type CreateDataSourceWizardProps = RouteComponentProps;

export const CreateDataSourceWizard: React.FunctionComponent<CreateDataSourceWizardProps> = (
  props: CreateDataSourceWizardProps
) => {
  /* Initialization */
  const {
    savedObjects,
    setBreadcrumbs,
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

  const handleDisplayToastMessage = ({ id, defaultMessage }: ToastMessageItem) => {
    toasts.addWarning(i18n.translate(id, { defaultMessage }));
  };

  /* Render the creation wizard */
  const renderContent = () => {
    return (
      <>
        <CreateDataSourceForm
          handleSubmit={handleSubmit}
          existingDatasourceNamesList={existingDatasourceNamesList}
        />
        {isLoading ? <LoadingMask /> : null}
      </>
    );
  };

  return renderContent();
};

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
