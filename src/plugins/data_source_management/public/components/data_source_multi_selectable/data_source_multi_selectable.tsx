/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceFilterGroup, SelectedDataSourceOption } from './data_source_filter_group';
import { NoDataSource } from '../no_data_source';
import { getDataSourcesWithFields, handleDataSourceFetchError } from '../utils';
import { DataSourceBaseState } from '../data_source_menu/types';
import { DataSourceErrorMenu } from '../data_source_error_menu';

export interface DataSourceMultiSeletableProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSources: (dataSources: SelectedDataSourceOption[]) => void;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  uiSettings?: IUiSettingsClient;
}

interface DataSourceMultiSeletableState extends DataSourceBaseState {
  dataSourceOptions: SelectedDataSourceOption[];
  selectedOptions: SelectedDataSourceOption[];
  defaultDataSource: string | null;
}

export class DataSourceMultiSelectable extends React.Component<
  DataSourceMultiSeletableProps,
  DataSourceMultiSeletableState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceMultiSeletableProps) {
    super(props);

    this.state = {
      dataSourceOptions: [],
      selectedOptions: [],
      defaultDataSource: null,
      showEmptyState: false,
      showError: false,
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    try {
      const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
      let selectedOptions: SelectedDataSourceOption[] = [];
      const fetchedDataSources = await getDataSourcesWithFields(this.props.savedObjectsClient, [
        'id',
        'title',
        'auth.type',
      ]);

      if (fetchedDataSources?.length) {
        selectedOptions = fetchedDataSources.map((dataSource) => ({
          id: dataSource.id,
          label: dataSource.attributes?.title || '',
          checked: 'on',
          visible: true,
        }));
      }

      if (!this.props.hideLocalCluster) {
        selectedOptions.unshift({
          id: '',
          label: 'Local cluster',
          checked: 'on',
          visible: true,
        });
      }

      if (!this._isMounted) return;

      this.setState({
        ...this.state,
        selectedOptions,
        defaultDataSource,
        showEmptyState: (fetchedDataSources?.length === 0 && this.props.hideLocalCluster) || false,
      });

      this.props.onSelectedDataSources(selectedOptions);
    } catch (error) {
      handleDataSourceFetchError(
        this.onError.bind(this),
        this.props.notifications,
        this.props.onSelectedDataSources
      );
    }
  }

  onError() {
    this.setState({ showError: true });
  }

  onChange(selectedOptions: SelectedDataSourceOption[]) {
    if (!this._isMounted) return;
    this.setState({
      selectedOptions,
    });
    this.props.onSelectedDataSources(selectedOptions.filter((option) => option.checked === 'on'));
  }

  render() {
    if (this.state.showEmptyState) {
      return <NoDataSource />;
    }
    if (this.state.showError) {
      return <DataSourceErrorMenu />;
    }
    return (
      <DataSourceFilterGroup
        selectedOptions={this.state.selectedOptions}
        setSelectedOptions={this.onChange.bind(this)}
        defaultDataSource={this.state.defaultDataSource}
      />
    );
  }
}
