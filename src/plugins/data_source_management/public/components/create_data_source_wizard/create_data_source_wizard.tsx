import React, { ReactElement, Component, useState, useEffect } from 'react';
import { withRouter, RouteComponentProps, useParams } from 'react-router-dom';
import { EuiForm, EuiFieldText, EuiFieldNumber, EuiFormRow, EuiButton } from '@elastic/eui';
import {
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiPageContent,
  EuiHorizontalRule,
} from '@elastic/eui';
import { IndexPatternAttributes } from 'src/plugins/data/public';
import { IDataSource } from 'src/plugins/data_source_management/common/data_sources/types';
import { DataSourceSavedObject } from 'src/plugins/data_sources/public/types';
import { useEffectOnce } from 'react-use';
import { i18n } from '@osd/i18n';
import {
  context as contextType,
  useOpenSearchDashboards,
  withOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';

import { DataSourceCreationConfig } from '../../service';
import { DataSourceManagmentContext, DataSourceManagmentContextValue } from '../../types';
import { getCreateBreadcrumbs } from '../breadsrumbs';
import { Header } from './components/header';
import { SavedObjectFinderUi } from '../../../../../plugins/saved_objects/public';

interface CreateDataSourceWizardState {
  dataSource: string;
  toasts: EuiGlobalToastListToast[];
  dataSourceCreationType: DataSourceCreationConfig;
  existingIndexPatterns: string[];
  existingDataSources: string[];
  dataSourceName: string;
  endpoint: string;
  savedDS?: DataSourceSavedObject;
}

interface SelectedSavedObj {
  id: string;
  type: string;
  name?: string;
}

const CreateDataSourceWizard: React.FunctionComponent<CreateDataSourceWizardProps> = (
  props: CreateDataSourceWizardProps
) => {
  const {
    uiSettings,
    savedObjects,
    setBreadcrumbs,
    dataSourceManagementStart,
    dataSource,
  } = useOpenSearchDashboards<DataSourceManagmentContext>().services;

  const type = new URLSearchParams(props.location.search).get('type') || undefined;
  const [dataSourceName, setDataSourceName] = useState('');
  const [toasts, setToasts] = useState<EuiGlobalToastListToast[]>([]);
  const [dataSourceCreationType, setDataSourceCreationType] = useState<DataSourceCreationConfig>(
    dataSourceManagementStart.creation.getType(type)
  );
  const [existingDataSources, setExistingDataSources] = useState([]);
  const [endpoint, setEndpoint] = useState('');
  const [savedDS, setSavedDS] = useState<DataSourceSavedObject>();
  const [selectedCrediential, setSelectedCrediential] = useState<SelectedSavedObj[]>([]);

  useEffectOnce(() => {
    setBreadcrumbs(getCreateBreadcrumbs());
    fetchSavedDataSources();
  });

  const fetchSavedDataSources = async () => {
    const { savedDataSourceLoader: savedDataSource } = dataSource;

    const gettedSavedDS: DataSourceSavedObject = await savedDataSource.get();

    setSavedDS(gettedSavedDS);
  };

  const handleSubmit = () => {
    const savedDataSource = savedDS!; // todo
    savedDataSource.credientialsJSON = JSON.stringify(selectedCrediential);

    savedDataSource.title = dataSourceName;
    savedDataSource.endpoint = endpoint;

    savedDataSource.save({}).then((res: any) => {
      // eslint-disable-next-line no-console
      console.log(res);
    });
  };

  const renderHeader = () => {
    return (
      <Header
        prompt={dataSourceCreationType.renderPrompt()}
        dataSourceName={dataSourceCreationType.getDataSourceName()}
        // isBeta={indexPatternCreationType.getIsBeta()}
        // docLinks={docLinks}
      />
    );
  };

  // todo: consistent name
  const onSearchSelected = (id: string, selectedType: string, name: string) => {
    const selected = [{ id, type: selectedType, name }];
    setSelectedCrediential(selected);
  };

  // todo: cqwi indexPatternCreationType
  const renderContent = () => {
    const header = renderHeader();

    return (
      <EuiPageContent>
        {header}
        <EuiHorizontalRule />
        <EuiForm data-test-subj="todo">
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
          <EuiFormRow helpText="The seleted crediential">
            <EuiFieldText
              disabled={true}
              name="crediential"
              value={selectedCrediential?.length > 0 ? selectedCrediential[0].name : ''}
              placeholder="Credential"
            />
          </EuiFormRow>
          <EuiFormRow>
            <SavedObjectFinderUi
              key="searchSavedObjectFinder"
              onChoose={onSearchSelected} // todo
              showFilter={false}
              noItemsMessage={i18n.translate(
                'visualizations.newVisWizard.searchSelection.notFoundLabel',
                {
                  defaultMessage: 'No matching indices or saved searches found.',
                }
              )}
              savedObjectMetaData={[
                {
                  type: 'dashboard',
                  getIconForSavedObject: () => 'dashboard',
                  name: i18n.translate(
                    'visualizations.newVisWizard.searchSelection.savedObjectType.indexPattern',
                    {
                      defaultMessage: 'Dashboard',
                    }
                  ),
                },
              ]}
              fixedPageSize={5} // todo
              uiSettings={uiSettings} // todo
              savedObjects={savedObjects}
            />
          </EuiFormRow>
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

  const content = renderContent();

  return (
    <>
      {content}
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={({ id }) => {
          removeToast(id);
        }}
        toastLifeTimeMs={6000}
      />
    </>
  );
};

type CreateDataSourceWizardProps = RouteComponentProps;

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
