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
import { DataSourceManagementContext, ToastMessageItem } from '../../types';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CreateDataSourceForm } from './components/create_form';
import { createSingleDataSource } from '../utils';
import { LoadingMask } from '../loading_mask';
import { DataSourceAttributes } from '../../types';

type CreateDataSourceWizardProps = RouteComponentProps;

const CreateDataSourceWizard: React.FunctionComponent<CreateDataSourceWizardProps> = (
  props: CreateDataSourceWizardProps
) => {
  /* Initialization */
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  const toastLifeTimeMs: number = 6000;

  /* State Variables */
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* Set breadcrumb */
  useEffectOnce(() => {
    setBreadcrumbs(getCreateBreadcrumbs());
  });

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

  /* Render the creation wizard */
  const renderContent = () => {
    return (
      <>
        <CreateDataSourceForm handleSubmit={handleSubmit} />
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
