/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement, Component } from 'react';

import {
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiPageContent,
  EuiHorizontalRule,
  EuiCode,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { DocLinksStart } from 'src/core/public';
import { StepDataset } from './components/step_dataset';
import { StepTimeField } from './components/step_time_field';
import { Header } from './components/header';
import { LoadingState } from './components/loading_state';

import { context as contextType } from '../../../../opensearch_dashboards_react/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import {
  DATA_SOURCE_STEP,
  ensureMinimumTime,
  getCurrentStepNumber,
  getIndices,
  getInitialStepName,
  getNextStep,
  getPrevStep,
  getTotalStepNumber,
  INDEX_PATTERN_STEP,
  StepType,
  TIME_FIELD_STEP,
} from './lib';
import { DatasetCreationConfig } from '../..';
import { DataSourceRef, DatasetManagmentContextValue } from '../../types';
import { MatchedItem } from './types';
import { DuplicateDataViewError, DataView } from '../../../../data/public';
import { StepDataSource } from './components/step_data_source';
import { TopNavControlDescriptionData } from '../../../../navigation/public';

interface CreateDatasetWizardState {
  step: StepType;
  dataset: string;
  allIndices: MatchedItem[];
  remoteClustersExist: boolean;
  isInitiallyLoadingIndices: boolean;
  toasts: EuiGlobalToastListToast[];
  datasetCreationType: DatasetCreationConfig;
  selectedTimeField?: string;
  docLinks: DocLinksStart;
  dataSourceRef?: DataSourceRef;
}

export class CreateDatasetWizard extends Component<RouteComponentProps, CreateDatasetWizardState> {
  static contextType = contextType;

  // @ts-expect-error TS2612 TODO(ts-error): fixme
  public readonly context!: DatasetManagmentContextValue;

  dataSourceEnabled: boolean;
  totalSteps: number;

  constructor(props: RouteComponentProps, context: DatasetManagmentContextValue) {
    super(props, context);

    context.services.setBreadcrumbs(getCreateBreadcrumbs());

    const type = new URLSearchParams(props.location.search).get('type') || undefined;

    this.dataSourceEnabled = context.services.dataSourceEnabled;
    this.totalSteps = getTotalStepNumber(this.dataSourceEnabled);
    const isInitiallyLoadingIndices = !this.dataSourceEnabled;

    this.state = {
      step: getInitialStepName(this.dataSourceEnabled),
      dataset: '',
      allIndices: [],
      remoteClustersExist: false,
      isInitiallyLoadingIndices,
      toasts: [],
      datasetCreationType: context.services.datasetManagementStart.creation.getType(type),
      docLinks: context.services.docLinks,
    };
  }

  async UNSAFE_componentWillMount() {
    if (!this.dataSourceEnabled) {
      this.fetchData();
    }
  }

  catchAndWarn = async (
    asyncFn: Promise<MatchedItem[]>,
    errorValue: [] | string[],
    errorMsg: ReactElement
  ) => {
    try {
      return await asyncFn;
    } catch (errors) {
      this.setState((prevState) => ({
        toasts: prevState.toasts.concat([
          {
            title: errorMsg,
            id: errorMsg.props.id,
            color: 'warning',
            iconType: 'alert',
            text: errors.body.message,
          },
        ]),
      }));
      return errorValue;
    }
  };

  fetchData = async () => {
    const { http } = this.context.services;
    const { dataSourceRef } = this.state;
    const dataSourceId = dataSourceRef?.id;
    const getIndexTags = (indexName: string) =>
      this.state.datasetCreationType.getIndexTags(indexName);
    const searchClient = this.context.services.data.search.search;

    const indicesFailMsg = (
      <FormattedMessage
        id="datasetManagement.createDataset.loadIndicesFailMsg"
        defaultMessage="Failed to load indices"
      />
    );

    const clustersFailMsg = (
      <FormattedMessage
        id="datasetManagement.createDataset.loadClustersFailMsg"
        defaultMessage="Failed to load remote clusters"
      />
    );

    // Immediately fetch and show local indices
    const localIndicesPromise = this.catchAndWarn(
      getIndices({ http, getIndexTags, pattern: '*', searchClient, dataSourceId }),
      [],
      indicesFailMsg
    );

    // Start fetching remote indices in parallel if available
    const remoteIndicesPromise = dataSourceRef?.relatedConnections?.length
      ? this.catchAndWarn(
          Promise.all(
            dataSourceRef.relatedConnections.map((connection) =>
              getIndices({
                http,
                getIndexTags,
                pattern: `${connection.title}:*`,
                searchClient,
                dataSourceId,
              })
            )
          ).then((results) => results.flat()), // Flatten the array before passing to catchAndWarn
          ['a'],
          clustersFailMsg
        )
      : Promise.resolve([]);

    // Show local indices first
    const localIndices = await ensureMinimumTime(localIndicesPromise);
    this.setState({
      allIndices: localIndices,
      isInitiallyLoadingIndices: false,
    });

    // Then append remote indices when they arrive
    const remoteResults = await remoteIndicesPromise;
    const remoteIndices = remoteResults
      .flat()
      .filter((item): item is MatchedItem => typeof item !== 'string');

    if (remoteIndices.length) {
      this.setState((prevState) => ({
        allIndices: [...prevState.allIndices, ...remoteIndices],
        remoteClustersExist: true,
      }));
    }
  };

  createDataset = async (
    timeFieldName: string | undefined,
    datasetId: string,
    signalType: string | undefined
  ) => {
    let emptyPattern: DataView;
    const { history } = this.props;
    const { dataset, dataSourceRef } = this.state;

    try {
      emptyPattern = await this.context.services.data.dataViews.createAndSave({
        id: datasetId,
        title: dataset,
        timeFieldName,
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        dataSourceRef,
        signalType,
        ...this.state.datasetCreationType.getDatasetMappings(),
      });
    } catch (err) {
      if (err instanceof DuplicateDataViewError) {
        const confirmMessage = i18n.translate('datasetManagement.dataset.titleExistsLabel', {
          values: { title: emptyPattern!.title },
          defaultMessage: "An index pattern with the title '{title}' already exists.",
        });

        const isConfirmed = await this.context.services.overlays.openConfirm(confirmMessage, {
          confirmButtonText: i18n.translate('datasetManagement.dataset.goToPatternButtonLabel', {
            defaultMessage: 'Go to existing pattern',
          }),
        });

        if (isConfirmed) {
          return history.push(`/patterns/${datasetId}`);
        } else {
          return;
        }
      } else {
        throw err;
      }
    }

    await this.context.services.data.dataViews.setDefault(emptyPattern.id as string);

    this.context.services.data.dataViews.clearCache(emptyPattern.id as string);
    history.push(`/patterns/${emptyPattern.id}`);
  };

  goToNextFromDataset = (dataset: string, selectedTimeField?: string) => {
    this.setState({ dataset, selectedTimeField });
    this.goToNextStep();
  };

  goToNextFromDataSource = (dataSourceRef: DataSourceRef) => {
    this.setState({ isInitiallyLoadingIndices: true, dataSourceRef }, async () => {
      this.fetchData();
      this.goToNextStep();
    });
  };

  goToNextStep = () => {
    this.setState((prevState) => ({
      step: getNextStep(prevState.step, this.dataSourceEnabled)!,
    }));
  };

  goToPreviousStep = () => {
    this.setState((prevState) => ({
      step: getPrevStep(prevState.step, this.dataSourceEnabled)!,
    }));
  };

  renderHeader() {
    const { docLinks, datasetCreationType } = this.state;
    return (
      <Header
        prompt={datasetCreationType.renderPrompt()}
        datasetName={datasetCreationType.getDatasetName()}
        isBeta={datasetCreationType.getIsBeta()}
        docLinks={docLinks}
      />
    );
  }

  renderContent() {
    const {
      allIndices,
      isInitiallyLoadingIndices,
      step,
      dataset,
      dataSourceRef,
      docLinks,
    } = this.state;

    const stepInfo = {
      totalStepNumber: this.totalSteps,
      currentStepNumber: getCurrentStepNumber(step, this.dataSourceEnabled),
    };

    const hideLocalCluster = this.context.services.hideLocalCluster;
    const useUpdatedUX = this.context.services.uiSettings.get('home:useNewHomePage');
    const { HeaderControl } = this.context.services.navigationUI;
    const application = this.context.services.application;

    if (isInitiallyLoadingIndices) {
      return <LoadingState />;
    }

    const header = this.renderHeader();

    const descriptionHeaderControl = useUpdatedUX ? (
      <HeaderControl
        controls={[
          {
            description: ((
              <FormattedMessage
                id="datasetManagement.createDataset.description"
                defaultMessage="An index pattern can match a single source, for example, {single}, or {multiple} data sources, {star}."
                values={{
                  multiple: <strong>multiple</strong>,
                  single: <EuiCode>filebeat-4-3-22</EuiCode>,
                  star: <EuiCode>filebeat-*</EuiCode>,
                }}
              />
            ) as unknown) as string,
            links: [
              {
                href: docLinks.links.noDocumentation.indexPatterns.introduction,
                controlType: 'link',
                flush: 'both',
                target: '_blank',
                label: i18n.translate('datasetManagement.createDataset.documentation', {
                  defaultMessage: 'Read documentation',
                }),
              },
            ],
          } as TopNavControlDescriptionData,
        ]}
        setMountPoint={application.setAppDescriptionControls}
      />
    ) : null;

    if (step === DATA_SOURCE_STEP) {
      const component = (
        <StepDataSource
          goToNextStep={this.goToNextFromDataSource}
          stepInfo={stepInfo}
          hideLocalCluster={hideLocalCluster}
        />
      );

      return useUpdatedUX ? (
        <>
          {component}
          {descriptionHeaderControl}
        </>
      ) : (
        <EuiPageContent>
          {header}
          <EuiHorizontalRule />
          {component}
        </EuiPageContent>
      );
    }

    if (step === INDEX_PATTERN_STEP) {
      const { location } = this.props;
      const initialQuery = new URLSearchParams(location.search).get('id') || undefined;
      const component = (
        <StepDataset
          allIndices={allIndices}
          initialQuery={dataset || initialQuery}
          datasetCreationType={this.state.datasetCreationType}
          goToPreviousStep={this.goToPreviousStep}
          goToNextStep={this.goToNextFromDataset}
          showSystemIndices={
            this.state.datasetCreationType.getShowSystemIndices() &&
            this.state.step === INDEX_PATTERN_STEP
          }
          dataSourceRef={dataSourceRef}
          stepInfo={stepInfo}
          catchAndWarn={this.catchAndWarn}
        />
      );

      return useUpdatedUX ? (
        <>
          {/* Except StepDataSource, other components need to use PageContent to wrap when using new UX */}
          <EuiPageContent>{component}</EuiPageContent>
          {descriptionHeaderControl}
        </>
      ) : (
        <EuiPageContent>
          {header}
          <EuiHorizontalRule />
          {component}
        </EuiPageContent>
      );
    }

    if (step === TIME_FIELD_STEP) {
      const component = (
        <StepTimeField
          dataset={dataset}
          goToPreviousStep={this.goToPreviousStep}
          createDataset={this.createDataset}
          datasetCreationType={this.state.datasetCreationType}
          selectedTimeField={this.state.selectedTimeField}
          dataSourceRef={dataSourceRef}
          stepInfo={stepInfo}
        />
      );

      return useUpdatedUX ? (
        <>
          {/* Except StepDataSource, other components need to use PageContent to wrap when using new UX */}
          <EuiPageContent>{component}</EuiPageContent>
          {descriptionHeaderControl}
        </>
      ) : (
        <EuiPageContent>
          {header}
          <EuiHorizontalRule />
          {component}
        </EuiPageContent>
      );
    }

    return null;
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

export const CreateDatasetWizardWithRouter = withRouter(CreateDatasetWizard);
