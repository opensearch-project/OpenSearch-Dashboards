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
import {
  CreateDataSourceFormType,
  CreateNewCredentialType,
  CredentialSourceType,
  DataSourceManagementContext,
  ToastMessageItem,
} from '../../types';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CreateDataSourceForm } from './components/create_form';
import { createNewCredential, createSingleDataSource } from '../utils';
import { LoadingMask } from '../loading_mask';

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
  const handleSubmit = async ({
    title,
    description,
    endpoint,
    credentialId,
    credentialType,
    newCredential,
  }: CreateDataSourceFormType) => {
    setIsLoading(true);
    try {
      /* Create new credential, if user selects that option*/
      if (credentialType === CredentialSourceType.CreateCredential && newCredential?.title) {
        credentialId = await createCredential(newCredential);
      }

      const references = [];
      const attributes = {
        title,
        description,
        endpoint,
        noAuth: credentialType === CredentialSourceType.NoAuth,
      };

      if (credentialId) {
        references.push({ id: credentialId, type: 'credential', name: 'credential' });
      }
      const options = { references };

      await createSingleDataSource(savedObjects.client, attributes, options);

      props.history.push('');
    } catch (e) {
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.createDataSource.createDataSourceFailMsg',
        defaultMessage: 'Creation of the Data Source failed with some errors. Please try it again',
        color: 'warning',
        iconType: 'alert',
      });
    }
    setIsLoading(false);
  };

  /* Create credential on form submit */
  const createCredential = async (newCredential: CreateNewCredentialType) => {
    let newCredentialId = '';
    setIsLoading(true);
    try {
      newCredentialId = await createNewCredential(savedObjects.client, newCredential);
    } catch (e) {
      handleDisplayToastMessage({
        id: 'dataSourcesManagement.createDataSource.createNewCredentialsFailMsg',
        defaultMessage:
          'The credential saved object creation failed with some errors. Please configure data_source.enabled and try it again.',
        color: 'warning',
        iconType: 'alert',
      });
    }
    setIsLoading(false);
    return newCredentialId;
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

  /* Render Loading Mask */
  const handleDisplayLoading = (show: boolean) => {
    setIsLoading(show);
  };

  /* Render the creation wizard */
  const renderContent = () => {
    return (
      <>
        <CreateDataSourceForm
          handleSubmit={handleSubmit}
          displayLoadingMask={handleDisplayLoading}
          displayToastMessage={handleDisplayToastMessage}
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
