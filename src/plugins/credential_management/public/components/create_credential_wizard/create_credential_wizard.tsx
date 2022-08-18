/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
  EuiHorizontalRule,
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiPageContent,
  EuiOverlayMask,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { DocLinksStart } from 'src/core/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CredentialManagmentContextValue } from '../../types';
import { Header } from './components/header';
import { AddForm } from './components/header/add_form';
import { context as contextType } from '../../../../opensearch_dashboards_react/public';
import { getCredentials } from '../utils';

interface CreateCredentialWizardState {
  credentialName: string;
  description: string;
  authType: string;
  credentialMaterialsType: string;
  userName: string;
  password: string;
  dual: boolean;
  showErrors: boolean;
  isLoading: boolean;
  toasts: EuiGlobalToastListToast[];
  docLinks: DocLinksStart;
  errors: [];
  allList: any[];
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
      credentialName: '',
      description: '',
      authType: 'shared',
      credentialMaterialsType: 'username_password_credential',
      userName: '',
      password: '',
      dual: true,
      toasts: [],
      errors: [],
      allList: [],
      docLinks: context.services.docLinks,

      showErrors: false,
      isLoading: false,
    };
  }

  async componentDidMount() {
    const { savedObjects } = this.context.services;

    const fetchedCredentials = await getCredentials(savedObjects.client);

    this.setState({ allList: fetchedCredentials });
  }

  // TODO: Fix header component error https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2048
  renderHeader() {
    const { docLinks } = this.state;

    return <Header docLinks={docLinks} />;
  }

  renderContent() {
    const header = this.renderHeader();

    return (
      <EuiPageContent>
        {header}
        <EuiHorizontalRule />

        <AddForm
          allList={this.state.allList}
          savedObjects={this.context.services.savedObjects}
          onLoading={() => {
            this.setState({ isLoading: true });
          }}
          onCancelLoading={() => {
            this.setState({ isLoading: false });
          }}
          onHispush={() => {
            this.props.history.push('');
          }}
        />
      </EuiPageContent>
    );
  }

  removeToast = (id: string) => {
    this.setState((prevState) => ({
      toasts: prevState.toasts.filter((toast) => toast.id !== id),
    }));
  };

  render() {
    const content = this.renderContent();
    const { isLoading } = this.state;

    return isLoading ? (
      <EuiOverlayMask>
        <EuiLoadingSpinner size="xl" />
      </EuiOverlayMask>
    ) : (
      <>
        {content}
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
