/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiGlobalToastListToast } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  CredentialSavedObjectAttributes,
  CREDENTIAL_SAVED_OBJECT_TYPE,
} from '../../../../data_source/public';
import { CredentialManagementContext, ToastMessageItem } from '../../types';
import { getEditBreadcrumbs } from '../breadcrumbs';
import { EditCredentialItem } from '../types';
import { EditCredential } from './components';

const EditCredentialWizard: React.FunctionComponent<RouteComponentProps<{ id: string }>> = ({
  ...props
}) => {
  /* Initialization */
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    CredentialManagementContext
  >().services;

  /* State Variables */
  const [credential, setCredential] = useState<EditCredentialItem>();
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);

  /* Fetch credential by id*/
  useEffectOnce(() => {
    (async function () {
      try {
        const savedObject = await savedObjects.client.get<CredentialSavedObjectAttributes>(
          CREDENTIAL_SAVED_OBJECT_TYPE,
          props.match.params.id
        );

        const { title, description, credentialMaterials } = savedObject.attributes;
        const { username } = credentialMaterials.credentialMaterialsContent;
        const object = {
          id: savedObject.id,
          title,
          description,
          username,
          password: '',
        };
        setCredential(object);
        setBreadcrumbs(getEditBreadcrumbs(object));
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

  if (credential) {
    return <EditCredential credential={credential} />;
  } else {
    return <h1>Credential not found!</h1>;
  }
};

export const EditCredentialPageWithRouter = withRouter(EditCredentialWizard);
