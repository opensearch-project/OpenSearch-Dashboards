import React, { ReactElement, Component } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { EuiForm, EuiFieldText, EuiFieldNumber, EuiFormRow, EuiButton } from '@elastic/eui';
import {
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiPageContent,
  EuiHorizontalRule,
} from '@elastic/eui';
import { IndexPatternAttributes } from 'src/plugins/data/public';
import { IDataSource } from 'src/plugins/data_source_management/common/data_sources/types';
import { context as contextType } from '../../../../opensearch_dashboards_react/public';

import { DataSourceCreationConfig } from '../../service';
import { DataSourceManagmentContextValue } from '../../types';
import { getCreateBreadcrumbs } from '../breadsrumbs';
import { Header } from './components/header';

interface CreateDataSourceWizardState {
  dataSource: string;
  toasts: EuiGlobalToastListToast[];
  dataSourceCreationType: DataSourceCreationConfig;
  existingIndexPatterns: string[];
  existingDataSources: string[];
  dataSourceName: string;
  endpoint: string;
}

export class CreateDataSourceWizard extends Component<
  RouteComponentProps,
  CreateDataSourceWizardState
> {
  static contextType = contextType;
  public readonly context!: DataSourceManagmentContextValue;

  constructor(props: RouteComponentProps, context: DataSourceManagmentContextValue) {
    super(props, context);

    context.services.setBreadcrumbs(getCreateBreadcrumbs());

    const type = new URLSearchParams(props.location.search).get('type') || undefined;

    this.state = {
      dataSource: '',
      toasts: [],
      dataSourceCreationType: context.services.dataSourceManagementStart.creation.getType(type),
      existingIndexPatterns: [], // todo: This is just for demo purpose
      existingDataSources: [],
      dataSourceName: '',
      endpoint: '',
    };
  }

  async UNSAFE_componentWillMount() {
    this.fetchExistingDataSources();
    this.fetchExistingIndexPatterns();
    // this.fetchData();
  }

  createDataSource = async (dataSourceName: string, endpoint: string) => {};

  fetchExistingIndexPatterns = async () => {
    const { savedObjects } = await this.context.services.savedObjects.client.find<
      IndexPatternAttributes
    >({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000,
    });

    const existingIndexPatterns = savedObjects.map((obj) =>
      obj && obj.attributes ? obj.attributes.title : ''
    ) as string[];

    this.setState({ existingIndexPatterns });
  };

  fetchExistingDataSources = async () => {
    const { savedObjects } = await this.context.services.savedObjects.client.find<IDataSource>({
      type: 'data-source',
      fields: ['id'],
      perPage: 10000,
    });

    const existingDataSources = savedObjects.map((obj) =>
      obj && obj.attributes ? obj.attributes.id : ''
    ) as string[];

    this.setState({ existingDataSources });
  };

  handleSubmit = () => {
    this.context.services.savedObjects.client
      .create('data-source', { title: this.state.dataSourceName, endpoint: this.state.endpoint })
      .then((res: any) => {
        // eslint-disable-next-line no-console
        console.log(res);
      });
  };

  renderHeader() {
    const { dataSourceCreationType } = this.state;
    return (
      <Header
        prompt={dataSourceCreationType.renderPrompt()}
        dataSourceName={dataSourceCreationType.getDataSourceName()}
        // isBeta={indexPatternCreationType.getIsBeta()}
        // docLinks={docLinks}
      />
    );
  }

  // todo: cqui indexPatternCreationType
  renderContent() {
    const header = this.renderHeader();

    return (
      <EuiPageContent>
        {header}
        <EuiHorizontalRule />
        <EuiForm data-test-subj="todo">
          <EuiFormRow helpText="Name of the data source">
            <EuiFieldText
              name="dataSourceName"
              value={this.state.dataSourceName || ''}
              placeholder="Name"
              onChange={(e) => this.setState({ dataSourceName: e.target.value })}
            />
          </EuiFormRow>
          <EuiFormRow helpText="The connection URL">
            <EuiFieldText
              name="endPoint"
              value={this.state.endpoint || ''}
              placeholder="Endpoint"
              onChange={(e) => this.setState({ endpoint: e.target.value })}
            />
          </EuiFormRow>
          <EuiButton type="submit" fill onClick={this.handleSubmit}>
            Create
          </EuiButton>
        </EuiForm>
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

    return (
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

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
