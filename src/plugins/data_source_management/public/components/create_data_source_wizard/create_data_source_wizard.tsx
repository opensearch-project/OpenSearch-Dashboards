/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiHorizontalRule,
  EuiPageContent,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { useEffectOnce } from 'react-use';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { SavedObjectFinderUi } from '../../../../saved_objects/public';
import { Header } from './components/header';
import { DataSourceManagementContext } from '../../types';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { AuthenticationTabs, AuthenticationTabItem } from './components/authentication_tabs';
import { CreateNewCredential } from './components/create_new_credential';

interface SelectedSavedObj {
  id: string;
  type: string;
  name?: string;
}

type CreateDataSourceWizardProps = RouteComponentProps;

const CreateDataSourceWizard: React.FunctionComponent<CreateDataSourceWizardProps> = (
  props: CreateDataSourceWizardProps
) => {
  /* Initialization */
  const { uiSettings, savedObjects, setBreadcrumbs } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  const toastLifeTimeMs: number = 6000;

  /* State Variables */
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);
  const [dataSourceName, setDataSourceName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [selectedCredential, setSelectedCredential] = useState<SelectedSavedObj[]>([]);

  useEffectOnce(() => {
    setBreadcrumbs(getCreateBreadcrumbs());
  });

  /* Handle submit - create data source*/
  const handleSubmit = async () => {
    /* TODO: Handle Create data source option*/
  };

  // todo: consistent name
  const onSearchSelected = (id: string, selectedType: string, name: string) => {
    const selected = [{ id, type: selectedType, name }];
    setSelectedCredential(selected);
  };

  /* Render header*/
  const renderHeader = () => {
    return <Header />;
  };

  /* Render Section header*/
  const renderSectionHeader = (i18nTitle: string, defaultTitle: string, preSpacer: boolean) => {
    return (
      <>
        {preSpacer ? <EuiSpacer size="l" /> : null}
        <EuiText>
          <h5>
            <FormattedMessage id={i18nTitle} defaultMessage={defaultTitle} />
          </h5>
        </EuiText>
        <EuiSpacer size="s" />
      </>
    );
  };

  /* Render user existing credential table*/
  const renderSavedObjectsTable = () => {
    return (
      <EuiFormRow>
        <SavedObjectFinderUi
          key="searchSavedObjectFinder"
          onChoose={onSearchSelected} // todo
          showFilter={false}
          noItemsMessage={i18n.translate(
            'dataSources.newDataSource.searchSelection.notFoundLabel',
            {
              defaultMessage: 'No credentials have been configured yet.',
            }
          )}
          savedObjectMetaData={[
            {
              type: 'credential',
              getIconForSavedObject: () => 'apps', // todo: this is temp as we need UX to design a icon
              name: i18n.translate(
                'dataSources.newDataSource.searchSelection.savedObjectType.credential',
                {
                  defaultMessage: 'Credential',
                }
              ),
            },
          ]}
          fixedPageSize={5} // todo
          uiSettings={uiSettings} // todo
          savedObjects={savedObjects}
        />
      </EuiFormRow>
    );
  };

  /* Render credentials tabs*/
  const [selectedTabId, setSelectedTabId] = useState('existing-credentials');

  const authenticationTabs: AuthenticationTabItem[] = [
    {
      id: 'existing-credentials',
      name: 'Use Existing Credential',
      content: <>{renderSavedObjectsTable()}</>,
    },
    {
      id: 'create-new-credentials',
      name: 'Create New Credential',
      content: (
        <>
          <CreateNewCredential />
        </>
      ),
    },
  ];

  const handleAuthenticationTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

  const renderAuthenticationTabHeaders = () => {
    return (
      <AuthenticationTabs
        tabs={authenticationTabs}
        onTabChange={handleAuthenticationTabChanged}
        selectedTabId={selectedTabId}
      />
    );
  };

  const renderContent = () => {
    return (
      <EuiPageContent>
        {renderHeader()}
        <EuiHorizontalRule />
        <EuiForm data-test-subj="todo">
          {/* Endpoint section */}
          {renderSectionHeader(
            'dataSourcesManagement.createDataSource.endpointTitle',
            'Endpoint',
            false
          )}
          <EuiFormRow helpText="Name of the data source">
            <EuiFieldText
              name="dataSourceName"
              value={dataSourceName || ''}
              placeholder="Name"
              onChange={(e) => setDataSourceName(e.target.value)}
            />
          </EuiFormRow>
          <EuiFormRow helpText="The connection URL">
            <EuiFieldText
              name="endPoint"
              value={endpoint || ''}
              placeholder="Endpoint"
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </EuiFormRow>

          {/* Authentication Section: */}
          {renderSectionHeader(
            'dataSourcesManagement.createDataSource.selectCredentialTitle',
            'Authentication',
            true
          )}

          <EuiPanel grow={false} paddingSize="none">
            {renderAuthenticationTabHeaders()}
          </EuiPanel>
          <EuiSpacer size="m" />

          {/* Create Data Source button*/}
          <EuiButton type="submit" fill onClick={handleSubmit}>
            Create
          </EuiButton>
        </EuiForm>
      </EuiPageContent>
    );
  };

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
