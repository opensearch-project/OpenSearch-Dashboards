/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { getDataSources } from '../utils';

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
}

interface DataSourceSelectorState {
  dataSourceOptions: DataSourceOption[];
  selectedOption: DataSourceOption[];
}

export interface DataSourceOption {
  label: string;
  id: string;
}

export class DataSourceSelector extends React.Component<
  DataSourceSelectorProps,
  DataSourceSelectorState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceSelectorProps) {
    super(props);

    this.state = {
      dataSourceOptions: this.props.hideLocalCluster ? [] : [LocalCluster],
      selectedOption: this.props.hideLocalCluster ? [] : [LocalCluster],
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    getDataSources(this.props.savedObjectsClient)
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          const dataSourceOptions = fetchedDataSources.map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.title,
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
    return (
      <EuiComboBox
        aria-label={i18n.translate('dataSourceSelectorComboBoxAriaLabel', {
          defaultMessage: 'Select a data source',
        })}
        placeholder={i18n.translate('dataSourceSelectorComboBoxPlaceholder', {
          defaultMessage: 'Select a data source',
        })}
        singleSelection={{ asPlainText: true }}
        options={this.state.dataSourceOptions}
        selectedOptions={this.state.selectedOption}
        onChange={(e) => this.onChange(e)}
        prepend={i18n.translate('dataSourceSelectorComboBoxPrepend', {
          defaultMessage: 'Data source',
        })}
        compressed
        isDisabled={this.props.disabled}
        fullWidth={this.props.fullWidth || false}
        data-test-subj={'dataSourceSelectorComboBox'}
      />
    );
  }
}
