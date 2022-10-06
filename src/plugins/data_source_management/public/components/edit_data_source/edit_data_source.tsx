/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteComponentProps, withRouter } from 'react-router-dom';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { EuiGlobalToastList, EuiGlobalToastListToast, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext, DataSourceTableItem, ToastMessageItem } from '../../types';
import {
  deleteDataSourceById,
  getDataSourceById,
  getDataSources,
  updateDataSourceById,
} from '../utils';
import { getEditBreadcrumbs } from '../breadcrumbs';
import { EditDataSourceForm } from './components/edit_form/edit_data_source_form';
import { LoadingMask } from '../loading_mask';
import { AuthType, DataSourceAttributes } from '../../types';
import { DATA_SOURCE_NOT_FOUND } from '../text_content';

const defaultDataSource: DataSourceAttributes = {
  title: '',
  description: '',
  endpoint: '',
  auth: {
    type: AuthType.NoAuth,
    credentials: undefined,
  },
};

const EditDataSource: React.FunctionComponent<RouteComponentProps<{ id: string }>> = (
  props: RouteComponentProps<{ id: string }>
) => {
  /* Initialization */
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;
  const dataSourceID: string = props.match.params.id;

  /* State Variables */
  const [dataSource, setDataSource] = useState<DataSourceAttributes>(defaultDataSource);
  const [existingDatasourceNamesList, setExistingDatasourceNamesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);

  const toastLifeTimeMs: number = 6000;

  /* Fetch data source by id*/
  useEffectOnce(() => {
    (async function () {
      setIsLoading(true);
      try {
        const fetchDataSourceById = await getDataSourceById(dataSourceID, savedObjects.client);
        const listOfDataSources: DataSourceTableItem[] = await getDataSources(savedObjects.client);
        if (fetchDataSourceById) {
          setDataSource(fetchDataSourceById);
          setBreadcrumbs(getEditBreadcrumbs(fetchDataSourceById));
        }
        if (Array.isArray(listOfDataSources) && listOfDataSources.length) {
          setExistingDatasourceNamesList(
            listOfDataSources.map((datasource) => datasource.title?.toLowerCase())
          );
        }
      } catch (e) {
        handleDisplayToastMessage({
          id: 'dataSourcesManagement.editDataSource.editDataSourceFailMsg',
          defaultMessage: 'Unable to find the Data Source. Please try it again.',
          color: 'warning',
          iconType: 'alert',
        });

        props.history.push('');
      } finally {
        setIsLoading(false);
      }
    })();
  });

  /* Handle submit - create data source*/
  const handleSubmit = async (attributes: DataSourceAttributes) => {
    setIsLoading(true);
    try {
      await updateDataSourceById(savedObjects.client, dataSourceID, attributes);
      props.history.push('');
    } catch (e) {
      setIsLoading(false);
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.editDataSource.editDataSourceFailMsg',
        defaultMessage: 'Updating the Data Source failed with some errors. Please try it again.',
        color: 'warning',
        iconType: 'alert',
      });
    }
  };

  const handleDisplayToastMessage = ({ id, defaultMessage, color, iconType }: ToastMessageItem) => {
    if (id && defaultMessage && color && iconType) {
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
    }
  };

  /* Handle delete - data source*/
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteDataSourceById(props.match.params.id, savedObjects.client);
      props.history.push('');
    } catch (e) {
      setIsLoading(false);
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.editDataSource.deleteDataSourceFailMsg',
        defaultMessage: 'Unable to delete the Data Source due to some errors. Please try it again.',
        color: 'warning',
        iconType: 'alert',
      });
    }
  };

  /* Render the edit wizard */
  const renderContent = () => {
    if (!isLoading && (!dataSource || !dataSource.id)) {
      return <h1>Data Source not found!</h1>;
    }
    return (
      <>
        {dataSource && dataSource.endpoint ? (
          <EditDataSourceForm
            existingDataSource={dataSource}
            existingDatasourceNamesList={existingDatasourceNamesList}
            onDeleteDataSource={handleDelete}
            handleSubmit={handleSubmit}
          />
        ) : null}
        {isLoading || !dataSource?.endpoint ? <LoadingMask /> : null}
      </>
    );
  };

  /* Remove toast on dismiss*/
  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  if (!isLoading && !dataSource?.endpoint) {
    return <h1>{DATA_SOURCE_NOT_FOUND}</h1>;
  }

  return (
    <>
      <EuiSpacer size="m" />
      {renderContent()}
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={({ id }) => {
          removeToast(id);
        }}
        toastLifeTimeMs={toastLifeTimeMs}
      />
    </>
  );
};

export const EditDataSourceWithRouter = withRouter(EditDataSource);
