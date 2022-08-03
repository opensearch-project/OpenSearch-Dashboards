/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CredentialManagementContext } from '../../types';
import { getEditBreadcrumbs } from '../breadcrumbs';
import { CredentialEditPageItem } from '../types';
import { EditCredential } from './edit_credential';

const EditCredentialPage: React.FC<RouteComponentProps<{ id: string }>> = ({ ...props }) => {
  const { savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    CredentialManagementContext
  >().services;
  const [credential, setCredential] = useState<CredentialEditPageItem>();
  useEffect(() => {
    savedObjects.client.get('credential', props.match.params.id).then((savedObject) => {
      const object = {
        id: savedObject.id,
        title: savedObject.attributes.title,
        credentialType: savedObject.attributes.credentialType,
      };
      setCredential(object);
      setBreadcrumbs(getEditBreadcrumbs(object));
    });
  }, [savedObjects.client, props.match.params.id, setBreadcrumbs]);

  if (credential) {
    return <EditCredential credential={credential} />;
  } else {
    return <h1>Credential not found!</h1>;
  }
};

export const EditCredentialPageWithRouter = withRouter(EditCredentialPage);
