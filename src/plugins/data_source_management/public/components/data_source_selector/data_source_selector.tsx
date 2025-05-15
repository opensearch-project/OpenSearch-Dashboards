/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart, SavedObject } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import {
  getDataSourcesWithFields,
  getDefaultDataSource,
  getFilteredDataSources,
  generateComponentId,
  getDataSourceSelection,
  getDefaultDataSourceId,
} from '../utils';
import { DataSourceAttributes } from '../../types';
import { DataSourceItem } from '../data_source_item';
import './data_source_selector.scss';
import { DataSourceOption } from '../data_source_menu/types';

export const LocalCluster: DataSourceOption = {
  label: i18n.translate('dataSourcesManagement.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

export interface DataSourceSelectorProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSource: (dataSourceOption: DataSourceOption[]) => void;
  disabled: boolean;
  fullWidth: boolean;
  hideLocalCluster?: boolean;
  defaultOption?: DataSourceOption[];
  placeholderText?: string;
  removePrepend?: boolean;
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  compressed?: boolean;
  uiSettings?: IUiSettingsClient;
  isClearable?: boolean;
}

interface DataSourceSelectorState {
  selectedOption: DataSourceOption[];
  allDataSources: Array<SavedObject<DataSourceAttributes>>;
  defaultDataSource: string | null;
  dataSourceOptions: DataSourceOption[];
  componentId: string;
}

export class DataSourceSelector extends React.Component<
  DataSourceSelectorProps,
  DataSourceSelectorState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceSelectorProps) {
    super(props);

    this.state = {
      allDataSources: [],
      defaultDataSource: '',
      selectedOption: this.props.hideLocalCluster ? [] : [LocalCluster],
      dataSourceOptions: [],
      componentId: generateComponentId(),
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
    getDataSourceSelection().remove(this.state.componentId);
  }

  onSelectedDataSource(dataSource: DataSourceOption[]) {
    getDataSourceSelection().selectDataSource(this.state.componentId, dataSource);
    this.props.onSelectedDataSource(dataSource);
  }

  handleSelectedOption(
    dataSourceOptions: DataSourceOption[],
    allDataSources: Array<SavedObject<DataSourceAttributes>>,
    defaultDataSource: string | null
  ) {
    const [{ id }] = this.props.defaultOption!;
    const dataSource = dataSourceOptions.find((ds) => ds.id === id);
    const selectedOption = dataSource ? [{ id, label: dataSource.label }] : [];

    // Invalid/filtered out datasource
    if (!dataSource) {
      this.props.notifications.addWarning(
        i18n.translate('dataSourcesManagement.error.fetchDataSourceById', {
          defaultMessage: 'Data source with ID "{id}" is not available',
          values: { id },
        })
      );
    }

    this.setState({
      ...this.state,
      dataSourceOptions,
      selectedOption,
      defaultDataSource,
      allDataSources,
    });
    this.onSelectedDataSource(selectedOption);
  }

  handleDefaultDataSource(
    dataSourceOptions: DataSourceOption[],
    allDataSources: Array<SavedObject<DataSourceAttributes>>,
    defaultDataSource: string | null
  ) {
    const selectedDataSource = getDefaultDataSource(
      dataSourceOptions,
      LocalCluster,
      defaultDataSource,
      this.props.hideLocalCluster
    );

    // No active option, did not find valid option
    if (selectedDataSource.length === 0) {
      this.props.notifications.addWarning('No connected data source available.');
      this.onSelectedDataSource([]);
      return;
    }

    this.setState({
      ...this.state,
      dataSourceOptions,
      selectedOption: selectedDataSource,
      defaultDataSource,
      allDataSources,
    });
    this.onSelectedDataSource(selectedDataSource);
  }

  async componentDidMount() {
    this._isMounted = true;
    try {
      // 1. Fetch
      const fetchedDataSources = await getDataSourcesWithFields(this.props.savedObjectsClient, [
        'id',
        'title',
        'auth.type',
        'dataSourceVersion',
        'installedPlugins',
      ]);

      // 2. Process
      const dataSourceOptions = getFilteredDataSources(
        fetchedDataSources,
        this.props.dataSourceFilter
      );

      // 3. Add local cluster as option
      if (!this.props.hideLocalCluster) {
        dataSourceOptions.unshift(LocalCluster);
      }

      // 4. Error state if filter filters out everything
      if (!dataSourceOptions.length) {
        this.props.notifications.addWarning('No connected data source available.');
        this.onSelectedDataSource([]);
        return;
      }

      const defaultDataSource = (await getDefaultDataSourceId(this.props.uiSettings)) ?? null;
      // 5.1 Empty default option, [], just want to show placeholder
      if (this.props.defaultOption?.length === 0) {
        this.setState({
          ...this.state,
          dataSourceOptions,
          selectedOption: [],
          defaultDataSource,
          allDataSources: fetchedDataSources,
        });
        return;
      }

      // 5.2 Handle active option, [{}]
      if (this.props.defaultOption?.length) {
        this.handleSelectedOption(dataSourceOptions, fetchedDataSources, defaultDataSource);
        return;
      }

      // 5.3 Handle default data source
      this.handleDefaultDataSource(dataSourceOptions, fetchedDataSources, defaultDataSource);
    } catch (err) {
      this.props.notifications.addWarning(
        i18n.translate('dataSourcesManagement.error.fetchExisting', {
          defaultMessage: 'Unable to fetch existing data sources',
        })
      );
    }
  }

  onChange(e: DataSourceOption[]) {
    if (!this._isMounted) return;
    this.setState({
      selectedOption: e,
    });
    this.onSelectedDataSource(e);
  }

  render() {
    const defaultPlaceholderText = i18n.translate(
      'dataSourcesManagement.dataSourceSelector.placeholder',
      {
        defaultMessage: 'Select a data source',
      }
    );
    const placeholderText =
      this.props.placeholderText === undefined
        ? defaultPlaceholderText
        : this.props.placeholderText;

    // The filter condition can be changed, thus we filter again here to make sure each time we will get the filtered data sources before rendering
    const options = getFilteredDataSources(this.state.allDataSources, this.props.dataSourceFilter);

    if (!this.props.hideLocalCluster) {
      options.unshift(LocalCluster);
    }

    return (
      <EuiComboBox
        isClearable={this.props.isClearable}
        aria-label={defaultPlaceholderText}
        placeholder={placeholderText}
        singleSelection={{ asPlainText: true }}
        options={options as EuiComboBoxOptionOption[]}
        selectedOptions={this.state.selectedOption as EuiComboBoxOptionOption[]}
        onChange={(e) => this.onChange(e)}
        prepend={
          this.props.removePrepend
            ? undefined
            : i18n.translate('dataSourcesManagement.dataSourceSelectorComboBoxPrepend', {
                defaultMessage: 'Data source',
              })
        }
        compressed={this.props.compressed || false}
        isDisabled={this.props.disabled}
        fullWidth={this.props.fullWidth || false}
        data-test-subj={'dataSourceSelectorComboBox'}
        renderOption={(option: EuiComboBoxOptionOption<DataSourceItem>) => (
          <DataSourceItem
            className={'dataSourceSelector'}
            option={option}
            defaultDataSource={this.state.defaultDataSource}
          />
        )}
      />
    );
  }
}
