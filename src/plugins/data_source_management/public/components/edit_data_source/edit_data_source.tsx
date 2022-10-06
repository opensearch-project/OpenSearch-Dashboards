/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteComponentProps, withRouter } from 'react-router-dom';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
  const {
    savedObjects,
    setBreadcrumbs,
    notifications: { toasts },
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;
  const dataSourceID: string = props.match.params.id;

  /* State Variables */
  const [dataSource, setDataSource] = useState<DataSourceAttributes>(defaultDataSource);
  const [existingDatasourceNamesList, setExistingDatasourceNamesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
          defaultMessage: 'Unable to find the Data Source.',
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
      });
    }
  };

  const handleDisplayToastMessage = ({ id, defaultMessage }: ToastMessageItem) => {
    toasts.addWarning(i18n.translate(id, { defaultMessage }));
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

  if (!isLoading && !dataSource?.endpoint) {
    return <h1>{DATA_SOURCE_NOT_FOUND}</h1>;
  }

  return (
    <>
      <EuiSpacer size="m" />
      {renderContent()}
    </>
  );
};

export const EditDataSourceWithRouter = withRouter(EditDataSource);
