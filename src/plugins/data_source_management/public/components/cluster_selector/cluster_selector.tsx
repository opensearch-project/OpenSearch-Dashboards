/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { getDataSources } from '../utils';

export const LocalCluster: ClusterOption = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

interface ClusterSelectorProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSource: (clusterOption: ClusterOption[]) => void;
  disabled: boolean;
  fullWidth: boolean;
}

interface ClusterSelectorState {
  clusterOptions: ClusterOption[];
  selectedOption: ClusterOption[];
}

export interface ClusterOption {
  label: string;
  id: string;
}

export class ClusterSelector extends React.Component<ClusterSelectorProps, ClusterSelectorState> {
  private _isMounted: boolean = false;

  constructor(props: ClusterSelectorProps) {
    super(props);

    this.state = {
      clusterOptions: [],
      selectedOption: [LocalCluster],
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
          const clusterOptions = fetchedDataSources.map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.title,
          }));

          clusterOptions.push(LocalCluster);

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            clusterOptions,
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
        aria-label={i18n.translate('clusterSelectorComboBoxAriaLabel', {
          defaultMessage: 'Select a data source',
        })}
        placeholder={i18n.translate('clusterSelectorComboBoxPlaceholder', {
          defaultMessage: 'Select a data source',
        })}
        singleSelection={{ asPlainText: true }}
        options={this.state.clusterOptions}
        selectedOptions={this.state.selectedOption}
        onChange={(e) => this.onChange(e)}
        prepend={i18n.translate('clusterSelectorComboBoxPrepend', {
          defaultMessage: 'Data source',
        })}
        compressed
        isDisabled={this.props.disabled}
        fullWidth={this.props.fullWidth || false}
        data-test-subj={'clusterSelectorComboBox'}
      />
    );
  }
}
