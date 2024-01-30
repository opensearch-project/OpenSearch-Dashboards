/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getDataSources } from '../utils';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';

export const LocalCluster = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

export class DataSourcePicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataSources: [],
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
          const dataSourceOptions = fetchedDataSources.map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.title,
          }));

          dataSourceOptions.push(LocalCluster);

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            dataSources: dataSourceOptions,
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
        aria-label={i18n.translate('dataSourceComboBoxAriaLabel', {
          defaultMessage: 'Select a data source',
        })}
        placeholder={i18n.translate('dataSourceComboBoxPlaceholder', {
          defaultMessage: 'Select a data source',
        })}
        singleSelection={{ asPlainText: true }}
        options={this.state.dataSources}
        selectedOptions={this.state.selectedOption}
        onChange={(e) => this.onChange(e)}
        prepend={i18n.translate('dataSourceComboBoxPrepend', {
          defaultMessage: 'Data source',
        })}
        compressed
        isDisabled={this.props.disabled}
      />
    );
  }
}
