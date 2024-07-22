/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenu,
  EuiContextMenuPanelItemDescriptor,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiPopover,
  EuiSelect,
} from '@elastic/eui';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import { fetchDataSources } from './fetch_datasources';
import { fetchIndices } from './fetch_indices';
import { getIndexPatterns, getQueryService, getSearchService, getUiService } from '../../services';
import { fetchIndexPatterns } from './fetch_index_patterns';
import { IIndexPattern } from '../..';

export interface DataSetNavigatorProps {
  dataSetId: string | undefined;
  savedObjectsClient?: SavedObjectsClientContract;
  onSelectDataSet: (dataSet: SimpleDataSet) => void;
}

export interface SimpleObject {
  id: string;
  title: string;
  dataSourceRef?: SimpleDataSource;
}

export interface SimpleDataSource {
  id: string;
  name: string;
  indices?: SimpleObject[];
  type: 'data-source' | 'external-source';
}

export interface SimpleDataSet extends SimpleObject {
  fields?: any[];
  timeFieldName?: string;
  timeFields?: any[];
  type: 'index-pattern' | 'temporary';
}

interface DataSetNavigatorState {
  isLoading: boolean;
  isOpen: boolean;
  indexPatterns: IIndexPattern[];
  dataSources: SimpleDataSource[];
  externalDataSources: SimpleDataSource[];
  searchValue?: string;
  selectedDataSource?: SimpleDataSource;
  selectedObjects: SimpleObject[];
  selectedObject?: SimpleDataSet;
  selectedDataSet?: SimpleDataSet;
}

// eslint-disable-next-line import/no-default-export
export default class DataSetNavigator extends Component<DataSetNavigatorProps> {
  private isMounted: boolean = false;
  state: DataSetNavigatorState;
  private searchService = getSearchService();
  private queryService = getQueryService();
  private uiService = getUiService();
  private indexPatternsService = getIndexPatterns();

  constructor(props: DataSetNavigatorProps) {
    super(props);
    this.state = {
      isLoading: true,
      isOpen: false,
      indexPatterns: [],
      dataSources: [],
      externalDataSources: [],
      searchValue: undefined,
      selectedDataSource: undefined,
      selectedObjects: [],
      selectedObject: undefined,
      selectedDataSet: undefined,
    };
  }

  async componentDidMount() {
    this.isMounted = true;
    const indexPatterns = await fetchIndexPatterns(this.props.savedObjectsClient!, ''); // TODO: add search
    const dataSources = await fetchDataSources(this.props.savedObjectsClient!);
    const selectedDataSet =
      !this.state.selectedDataSet && this.props.dataSetId
        ? indexPatterns.find((pattern) => pattern.id === this.props.dataSetId)
        : undefined;
    // TODO: do i need to get datasource ref too?
    this.setState({
      indexPatterns,
      dataSources,
      selectedDataSet,
    });
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  getQueryStringInitialValue = (dataSet: SimpleDataSet) => {
    const language = this.uiService.Settings.getUserQueryLanguage();
    const input = this.uiService.Settings.getQueryEnhancements(language)?.searchBar
      ?.queryStringInput?.initialValue;

    if (!dataSet || !input)
      return {
        query: '',
        language,
      };

    return {
      query: input.replace('<data_source>', dataSet.title),
      language,
    };
  };

  setSelectedDataSource = async (dataSource: SimpleDataSource) => {
    if (!this.isMounted || !dataSource) return;
    this.setState({
      isLoading: false,
      selectedDataSource: dataSource,
    });
  };

  setSelectedObjects = async (dataSource: SimpleDataSource) => {
    if (!this.isMounted || !dataSource) return;
    const indices: any[] = await fetchIndices(this.searchService, dataSource.id);
    const indicesWithDataSource = indices.map((indexName) => ({
      id: indexName,
      title: indexName,
      dataSourceRef: {
        id: dataSource.id,
        name: dataSource.name,
        type: 'data-source',
      },
    }));
    this.setState({
      selectedObjects: indicesWithDataSource,
    });
  };

  setSelectedObject = async (object: SimpleObject) => {
    if (!this.isMounted || !object) return;
    this.setState({ isLoading: true });
    const fields = await this.indexPatternsService.getFieldsForWildcard({
      pattern: object.title,
      dataSourceId: object.dataSourceRef?.id,
    });
    const timeFields = fields.filter((field: any) => field.type === 'date');
    this.setState({
      selectedObject: {
        ...object,
        fields,
        timeFields,
        ...(timeFields[0]?.name ? { timeFieldName: timeFields[0].name } : {}),
      },
      isLoading: false,
    });
  };

  setSelectedObjectTimeField = async (object: SimpleObject, timeFieldName: string | undefined) => {
    if (!this.isMounted) return;
    const newObject = {
      ...object,
      timeFieldName: timeFieldName ?? undefined,
    };
    this.setState({
      selectedObject: newObject,
    });
  };

  setSelectedDataSet = async (dataSet: SimpleDataSet) => {
    if (dataSet.type === 'temporary') {
      const fieldsMap = dataSet.fields?.reduce((acc: any, field: any) => {
        acc[field.name] = field;
        return acc;
      });
      const temporaryIndexPattern = await this.indexPatternsService.create(
        {
          id: dataSet.id,
          title: dataSet.title,
          dataSourceRef: {
            id: dataSet.dataSourceRef?.id!,
            name: dataSet.dataSourceRef?.name!,
            type: dataSet.dataSourceRef?.type!,
          },
          timeFieldName: dataSet.timeFieldName,
        },
        true
      );
      this.indexPatternsService.saveToCache(temporaryIndexPattern.title, temporaryIndexPattern);
    }
    this.searchService.df.clear();
    this.props.onSelectDataSet(dataSet);
    this.queryService.queryString.setQuery(this.getQueryStringInitialValue(dataSet));
    this.setState({ selectedDataSet: dataSet });
    this.closePopover();
  };

  closePopover = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const indexPatternsLabel = i18n.translate('data.query.dataSetNavigator.indexPatternsName', {
      defaultMessage: 'Index patterns',
    });
    const indicesLabel = i18n.translate('data.query.dataSetNavigator.indicesName', {
      defaultMessage: 'Indexes',
    });

    const loadingSpinner = <EuiLoadingSpinner size="m" />;

    return (
      <EuiPopover
        button={
          <EuiButtonEmpty
            className="dataExplorerDSSelect"
            color="text"
            iconType="arrowDown"
            iconSide="right"
            onClick={() => this.setState({ isOpen: !this.state.isOpen })}
          >
            {`${
              this.state.selectedDataSet?.dataSourceRef
                ? `${this.state.selectedDataSet.dataSourceRef.name}::`
                : ''
            }${
              this.state.selectedDataSet?.title ??
              i18n.translate('data.query.dataSetNavigator.selectDataSet', {
                defaultMessage: 'Select data set',
              })
            }`}
          </EuiButtonEmpty>
        }
        isOpen={this.state.isOpen}
        closePopover={this.closePopover}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <EuiContextMenu
          initialPanelId={0}
          className="dataSetNavigator"
          size="s"
          panels={[
            {
              id: 0,
              items: [
                {
                  name: indexPatternsLabel,
                  panel: 1,
                },
                {
                  name: indicesLabel,
                  panel: 3,
                },
                ...this.state.dataSources.map((dataSource) => ({
                  name: dataSource.name,
                  panel: 2,
                  onClick: async () => {
                    await this.setSelectedDataSource(dataSource);
                  },
                })),
              ],
            },
            {
              id: 1,
              title: indexPatternsLabel,
              items: this.state.indexPatterns.flatMap((indexPattern, indexNum, arr) => [
                {
                  name: indexPattern.title,
                  onClick: async () => {
                    await this.setSelectedDataSet({
                      id: indexPattern.id ?? indexPattern.title,
                      title: indexPattern.title,
                      fields: indexPattern.fields,
                      timeFieldName: indexPattern.timeFieldName,
                      type: 'index-pattern',
                    });
                  },
                },
                ...(indexNum < arr.length - 1 ? [{ isSeparator: true }] : []),
              ]) as EuiContextMenuPanelItemDescriptor[],
            },
            {
              id: 2,
              title: this.state.selectedDataSource?.name,
              items: [
                {
                  name: indicesLabel,
                  panel: 3,
                  onClick: async () => {
                    await this.setSelectedObjects(this.state.selectedDataSource!);
                  },
                },
                {
                  name: 'Connected data sources',
                  disabled: true,
                },
              ] as EuiContextMenuPanelItemDescriptor[],
            },
            {
              id: 3,
              title: indicesLabel,
              items: this.state.selectedObjects.flatMap(
                (object: SimpleObject, indexNum: number, arr: any[]) => [
                  {
                    name: object.title,
                    panel: 4,
                    onClick: async () => {
                      await this.setSelectedObject(object);
                    },
                  },
                  ...(indexNum < arr.length - 1 ? [{ isSeparator: true }] : []),
                ]
              ) as EuiContextMenuPanelItemDescriptor[],
            },
            {
              id: 4,
              title: this.state.selectedObject?.title,
              content:
                this.state.isLoading && !this.state.selectedObject ? (
                  loadingSpinner
                ) : (
                  <EuiForm className="dataSetNavigatorFormWrapper">
                    <EuiFormRow
                      label="Time field"
                      helpText="Select the field you want to use for the time filter."
                    >
                      <EuiSelect
                        id="dateFieldSelector"
                        compressed
                        options={[
                          ...(this.state.selectedObject?.timeFields &&
                          this.state.selectedObject?.timeFields.length > 0
                            ? [
                                ...this.state.selectedObject!.timeFields.map((field: any) => ({
                                  value: field.name,
                                  text: field.name,
                                })),
                              ]
                            : []),
                          { value: 'no-time-filter', text: "I don't want to use a time filter" },
                        ]}
                        onChange={(event) => {
                          this.setSelectedObjectTimeField(
                            this.state.selectedObject!,
                            event.target.value !== 'no-time-filter' ? event.target.value : undefined
                          );
                        }}
                        aria-label="Select a date field"
                      />
                    </EuiFormRow>
                    <EuiButton
                      size="s"
                      fullWidth
                      onClick={async () => {
                        await this.setSelectedDataSet({
                          ...this.state.selectedObject!,
                          type: 'temporary',
                        });
                      }}
                    >
                      Select
                    </EuiButton>
                  </EuiForm>
                ),
            },
          ]}
        />
      </EuiPopover>
    );
  }
}
