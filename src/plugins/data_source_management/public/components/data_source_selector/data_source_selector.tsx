/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { getDataSourcesWithFields } from '../utils';

export const LocalCluster: DataSourceOption = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

export interface DataSourceSelectorProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSource: (dataSourceOption: DataSourceOption[]) => void;
  disabled: boolean;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  defaultOption?: DataSourceOption[];
  placeholderText?: string;
  removePrepend?: boolean;
  filterFn?: (dataSource: any) => boolean;
  compressed?: boolean;
}

interface DataSourceSelectorState {
  dataSourceOptions: DataSourceOption[];
  selectedOption: DataSourceOption[];
}

export interface DataSourceOption {
  label: string;
  id: string;
  checked?: string;
}

export class DataSourceSelector extends React.Component<
  DataSourceSelectorProps,
  DataSourceSelectorState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceSelectorProps) {
    super(props);

    this.state = {
      dataSourceOptions: this.props.defaultOption
        ? this.props.defaultOption
        : this.props.hideLocalCluster
        ? []
        : [LocalCluster],
      selectedOption: this.props.defaultOption
        ? this.props.defaultOption
        : this.props.hideLocalCluster
        ? []
        : [LocalCluster],
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    getDataSourcesWithFields(this.props.savedObjectsClient, ['id', 'title', 'auth.type'])
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          let filteredDataSources = [];
          if (this.props.filterFn) {
            filteredDataSources = fetchedDataSources.filter((ds) => this.props.filterFn!(ds));
          }

          if (filteredDataSources.length === 0) {
            filteredDataSources = fetchedDataSources;
          }
          const dataSourceOptions = filteredDataSources.map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.attributes?.title || '',
          }));

          if (!this.props.hideLocalCluster) {
            dataSourceOptions.unshift(LocalCluster);
          }

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            dataSourceOptions,
          });
        }
      })
      .catch(() => {
        this.props.notifications.addWarning(
          i18n.translate('dataSource.fetchDataSourceError', {
            defaultMessage: 'Unable to fetch existing data sources',
          })
        );
      });
  }

  onChange(e) {
    if (!this._isMounted) return;
    this.setState({
      selectedOption: e,
    });
    this.props.onSelectedDataSource(e);
  }

  render() {
    const placeholderText =
      this.props.placeholderText === undefined
        ? 'Select a data source'
        : this.props.placeholderText;
    return (
      <EuiComboBox
        aria-label={
          placeholderText
            ? i18n.translate('dataSourceSelectorComboBoxAriaLabel', {
                defaultMessage: placeholderText,
              })
            : 'dataSourceSelectorCombobox'
        }
        placeholder={
          placeholderText
            ? i18n.translate('dataSourceSelectorComboBoxPlaceholder', {
                defaultMessage: placeholderText,
              })
            : ''
        }
        singleSelection={{ asPlainText: true }}
        options={this.state.dataSourceOptions}
        selectedOptions={this.state.selectedOption}
        onChange={(e) => this.onChange(e)}
        prepend={
          this.props.removePrepend
            ? undefined
            : i18n.translate('dataSourceSelectorComboBoxPrepend', {
                defaultMessage: 'Data source',
              })
        }
        compressed={this.props.compressed || false}
        isDisabled={this.props.disabled}
        fullWidth={this.props.fullWidth || false}
        data-test-subj={'dataSourceSelectorComboBox'}
      />
    );
  }
}
