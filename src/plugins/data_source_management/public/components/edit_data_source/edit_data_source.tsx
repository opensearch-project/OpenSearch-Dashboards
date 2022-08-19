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
import { DataSourceEditPageItem, DataSourceManagementContext, ToastMessageItem } from '../../types';
import { CreateEditDataSourceWizard } from '../create_edit_data_source_wizard';
import { MODE_EDIT } from '../../../common';
import { deleteDataSourceById, getDataSourceById, updateDataSourceById } from '../utils';
import { getEditBreadcrumbs } from '../breadcrumbs';

const defaultDataSource: DataSourceEditPageItem = {
  id: '',
  title: '',
  description: '',
  endpoint: '',
  credentialId: '',
  noAuthentication: false,
};

const EditDataSource: React.FunctionComponent<RouteComponentProps<{ id: string }>> = (
  props: RouteComponentProps<{ id: string }>
) => {
  /* Initialization */
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  /* State Variables */
  const [dataSource, setDataSource] = useState<DataSourceEditPageItem>(defaultDataSource);

  const toastLifeTimeMs: number = 6000;

  /* State Variables */
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);

  /* Fetch data source by id*/
  useEffectOnce(() => {
    (async function () {
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
    })();
  });

  /* Handle submit - create data source*/
  const handleSubmit = async ({
    title,
    description,
    endpoint,
    id,
    credentialId,
    noAuthentication,
  }: DataSourceEditPageItem) => {
    try {
      // TODO: Add rendering spanner https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2050

      const references = [];
      const attributes = { title, description, endpoint, noAuth: noAuthentication };

      if (credentialId) {
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
  };

  /* Render the edit wizard */
  const renderContent = () => {
    return (
      <CreateEditDataSourceWizard
        wizardMode={MODE_EDIT}
        handleSubmit={handleSubmit}
        existingDataSource={dataSource}
        onDeleteDataSource={handleDelete}
        displayToastMessage={handleDisplayToastMessage}
      />
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
