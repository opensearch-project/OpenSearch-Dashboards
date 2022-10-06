/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiGlobalToastList, EuiGlobalToastListToast } from '@elastic/eui';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { FormattedMessage } from '@osd/i18n/react';
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
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  const toastLifeTimeMs: number = 6000;

  /* State Variables */
  const [existingDatasourceNamesList, setExistingDatasourceNamesList] = useState<string[]>([]);
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);
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
        defaultMessage: 'Unable to fetch some resources. Please try again.',
        color: 'warning',
        iconType: 'alert',
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
        defaultMessage: 'Creation of the Data Source failed with some errors. Please try it again',
        color: 'warning',
        iconType: 'alert',
      });
    }
  };

  const handleDisplayToastMessage = ({ id, defaultMessage, color, iconType }: ToastMessageItem) => {
    const failureMsg = <FormattedMessage id={id} defaultMessage={defaultMessage} />;
    setToasts([
      ...toasts,
      {
        title: failureMsg,
        id: failureMsg.props.id,
        color,
        iconType,
      },
    ]);
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

  /* Remove toast on dismiss*/
  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  return (
    <>
      {renderContent()}
      <EuiGlobalToastList
        data-test-subj="createDataSourceToast"
        toasts={toasts}
        dismissToast={({ id }) => {
          removeToast(id);
        }}
        toastLifeTimeMs={toastLifeTimeMs}
      />
    </>
  );
};

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
