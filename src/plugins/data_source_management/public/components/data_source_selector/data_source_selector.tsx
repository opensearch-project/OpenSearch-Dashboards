/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox, EuiBadge, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart, SavedObject } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { getDataSourcesWithFields, getDefaultDataSource, getFilteredDataSources } from '../utils';
import { DataSourceAttributes } from '../../types';

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
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  compressed?: boolean;
  uiSettings?: IUiSettingsClient;
}

interface DataSourceSelectorState {
  selectedOption: DataSourceOption[];
  allDataSources: Array<SavedObject<DataSourceAttributes>>;
  defaultDataSource: string | null;
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
      allDataSources: [],
      defaultDataSource: '',
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

    const currentDefaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
    this.setState({
      ...this.state,
      defaultDataSource: currentDefaultDataSource,
    });

    getDataSourcesWithFields(this.props.savedObjectsClient, ['id', 'title', 'auth.type'])
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            allDataSources: fetchedDataSources,
          });
        }
        const dataSources = getFilteredDataSources(
          this.state.allDataSources,
          this.props.dataSourceFilter
        );
        const selectedDataSource = getDefaultDataSource(
          dataSources,
          LocalCluster,
          this.props.uiSettings,
          this.props.hideLocalCluster,
          this.props.defaultOption
        );
        if (selectedDataSource.length === 0) {
          this.props.notifications.addWarning('No connected data source available.');
        } else {
          this.props.onSelectedDataSource(selectedDataSource);
          this.setState({
            selectedOption: selectedDataSource,
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

    // The filter condition can be changed, thus we filter again here to make sure each time we will get the filtered data sources before rendering
    const dataSources = getFilteredDataSources(
      this.state.allDataSources,
      this.props.dataSourceFilter
    );

    const options = dataSources.map((ds) => ({ id: ds.id, label: ds.attributes?.title || '' }));
    if (!this.props.hideLocalCluster) {
      options.unshift(LocalCluster);
    }

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
        options={options}
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
        renderOption={(option) => (
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={1}>{option.label}</EuiFlexItem>
            {option.id === this.state.defaultDataSource && (
              <EuiFlexItem grow={false}>
                <EuiBadge iconSide="left">Default</EuiBadge>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        )}
      />
    );
  }
}
