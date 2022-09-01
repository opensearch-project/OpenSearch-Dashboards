/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiPageContent,
} from '@elastic/eui';
import { DocLinksStart } from 'src/core/public';

import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CredentialManagmentContextValue } from '../../types';
import { context as contextType } from '../../../../opensearch_dashboards_react/public';

import { CredentialForm } from '../common';
import { CreateCredentialItem } from '../types';

import { CredentialMaterialsType } from '../../../../data_source/public';

export interface CreateCredentialWizardState {
  toasts: EuiGlobalToastListToast[];
  docLinks: DocLinksStart;
  isLoading: boolean;
}

export class CreateCredentialWizard extends React.Component<
  RouteComponentProps,
  CreateCredentialWizardState
> {
  static contextType = contextType;
  public readonly context!: CredentialManagmentContextValue;

  constructor(props: RouteComponentProps, context: CredentialManagmentContextValue) {
    super(props, context);

    context.services.setBreadcrumbs(getCreateBreadcrumbs());

    this.state = {
      toasts: [],
      docLinks: context.services.docLinks,
      isLoading: false,
    };
  }

  /* Events */
  /* Remove toast on dismiss */
  removeToast = (id: string) => {
    this.setState((prevState) => ({
      toasts: prevState.toasts.filter((toast) => toast.id !== id),
    }));
  };

  /* Create credential on form submit */
  createCredential = async ({ title, description, username, password }: CreateCredentialItem) => {
    const { savedObjects } = this.context.services;
    this.setState({ isLoading: true });
    try {
      await savedObjects.client.create('credential', {
        title,
        description,
        credentialMaterials: {
          credentialMaterialsType: CredentialMaterialsType.UsernamePasswordType,
          credentialMaterialsContent: {
            username,
            password,
          },
        },
      });
      this.props.history.push('');
    } catch (e) {
      const createCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.createCredential.loadCreateCredentialFailMsg"
          defaultMessage="The credential saved object creation failed with some errors. Please configure data_source.enabled and try it again."
        />
      );
      this.setState((prevState) => ({
        toasts: prevState.toasts.concat([
          {
            title: createCredentialFailMsg,
            id: createCredentialFailMsg.props.id,
            color: 'warning',
            iconType: 'alert',
          },
        ]),
      }));
    }
    this.setState({ isLoading: false });
  };

  /* Render methods */
  /* Render the creation wizard */
  render() {
    const { isLoading } = this.state;
    return isLoading ? (
      <EuiOverlayMask>
        <EuiLoadingSpinner size="xl" />
      </EuiOverlayMask>
    ) : (
      <>
        <EuiPageContent>
          <CredentialForm
            docLinks={this.context.services.docLinks}
            handleSubmit={this.createCredential}
          />
        </EuiPageContent>
        <EuiGlobalToastList
          toasts={this.state.toasts}
          dismissToast={({ id }) => {
            this.removeToast(id);
          }}
          toastLifeTimeMs={6000}
        />
      </>
    );
  }
}

export const CreateCredentialWizardWithRouter = withRouter(CreateCredentialWizard);
