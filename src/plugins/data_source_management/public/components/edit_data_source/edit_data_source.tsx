/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteComponentProps, withRouter } from 'react-router-dom';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { EuiGlobalToastList, EuiGlobalToastListToast } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  CredentialSourceType,
  DataSourceManagementContext,
  EditDataSourceFormType,
  ToastMessageItem,
} from '../../types';
import { deleteDataSourceById, getDataSourceById, updateDataSourceById } from '../utils';
import { getEditBreadcrumbs } from '../breadcrumbs';
import { EditDataSourceForm } from './components/edit_form/edit_data_source_form';
import { LoadingMask } from '../loading_mask';

const defaultDataSource: EditDataSourceFormType = {
  id: '',
  title: '',
  description: '',
  endpoint: '',
  credentialId: '',
  credentialType: CredentialSourceType.NoAuth,
};

const EditDataSource: React.FunctionComponent<RouteComponentProps<{ id: string }>> = (
  props: RouteComponentProps<{ id: string }>
) => {
  /* Initialization */
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  /* State Variables */
  const [dataSource, setDataSource] = useState<EditDataSourceFormType>(defaultDataSource);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toastLifeTimeMs: number = 6000;

  /* State Variables */
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);

  /* Fetch data source by id*/
  useEffectOnce(() => {
    (async function () {
      setIsLoading(true);
      try {
        const fetchDataSourceById = await getDataSourceById(
          props.match.params.id,
          savedObjects.client
        );

        if (fetchDataSourceById) {
          setDataSource(fetchDataSourceById);
          setBreadcrumbs(getEditBreadcrumbs(fetchDataSourceById));
        }
      } catch (e) {
        handleDisplayToastMessage({
          id: 'dataSourcesManagement.editDataSource.editDataSourceFailMsg',
          defaultMessage: 'Unable to find the Data Source. Please try it again.',
          color: 'warning',
          iconType: 'alert',
        });

        props.history.push('');
      }
      setIsLoading(false);
    })();
  });

  /* Handle submit - create data source*/
  const handleSubmit = async ({
    title,
    description,
    endpoint,
    id,
    credentialId,
    credentialType,
  }: EditDataSourceFormType) => {
    setIsLoading(true);
    try {
      const references = [];
      const attributes = {
        title,
        description,
        endpoint,
        noAuth: credentialType === CredentialSourceType.NoAuth,
      };

      if (!attributes.noAuth && credentialId) {
        references.push({ id: credentialId, type: 'credential', name: 'credential' });
      }
      const options = { references };

      await updateDataSourceById(savedObjects.client, id, attributes, options);

      props.history.push('');
    } catch (e) {
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.editDataSource.editDataSourceFailMsg',
        defaultMessage: 'Updating the Data Source failed with some errors. Please try it again.',
        color: 'warning',
        iconType: 'alert',
      });
    }
    setIsLoading(false);
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
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.editDataSource.deleteDataSourceFailMsg',
        defaultMessage: 'Unable to delete the Data Source due to some errors. Please try it again.',
        color: 'warning',
        iconType: 'alert',
      });
    }
    setIsLoading(false);
  };

  /* Render Loading Mask */
  const handleDisplayLoading = (show: boolean) => {
    setIsLoading(show);
  };

  /* Render the edit wizard */
  const renderContent = () => {
    if (!isLoading && (!dataSource || !dataSource.id)) {
      return <h1>Data Source not found!</h1>;
    }
    return (
      <>
        <EditDataSourceForm
          existingDataSource={dataSource}
          displayToastMessage={handleDisplayToastMessage}
          displayLoadingMask={handleDisplayLoading}
          onDeleteDataSource={handleDelete}
          handleSubmit={handleSubmit}
        />
        {isLoading ? <LoadingMask /> : null}
      </>
    );
  };

  /* Remove toast on dismiss*/
  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  if (!dataSource?.id || !dataSource?.title) {
    return <h1>Data Source not found!</h1>;
  }

  return (
    <>
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
