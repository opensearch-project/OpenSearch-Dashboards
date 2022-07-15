/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useEffect, useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CredentialManagementContext } from '../../types';
import { getEditBreadcrumbs } from '../breadcrumbs';
import { CredentialEditPageItem } from '../types';
import { SimpleSavedObject } from 'opensearch-dashboards/public';
import { EditCredential } from './edit_credential';

const EditCredentialPage: React.FC<RouteComponentProps<{ id: string }>> = ({ ...props }) => {
  const { 
    savedObjects,
    setBreadcrumbs
  } = useOpenSearchDashboards<CredentialManagementContext>().services;
  const [credential, setCredential] = useState<CredentialEditPageItem>();
  useEffect(() => {
    // TODO: Refactor it with types
    savedObjects.client.get('credential', props.match.params.id).then((savedObject: SimpleSavedObject) => {
      const {
        id,
        attributes: {
          title,
          credential_type,
          credential_material,
        },
      } = savedObject;
      
      // TODO: Reuse existing model
      const credential = {
        id,
        title,
        credentialType: credential_type,
        userName: credential_material.user_name
      }
      setCredential(credential);
      setBreadcrumbs(getEditBreadcrumbs(credential));
    });
    }, [savedObjects.client, props.match.params.id, setBreadcrumbs]);

  if (credential) {
    return <EditCredential credential={credential} />;
  } else {
    return <h1>Undefined!</h1>;
  }
};

export const EditCredentialPageWithRouter = withRouter(EditCredentialPage);
