/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPopover,
  EuiContextMenuPanel,
  EuiPanel,
  EuiButtonEmpty,
  EuiSelectable,
  EuiSpacer,
} from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { getDataSourcesWithFields } from '../utils';
import { LocalCluster } from '../data_source_selector/data_source_selector';
import { SavedObject } from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';
import { DataSourceOption } from '../data_source_menu/types';

interface DataSourceSelectableProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
  disabled: boolean;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  selectedOption?: DataSourceOption[];
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
}

interface DataSourceSelectableState {
  dataSourceOptions: SelectedDataSourceOption[];
  isPopoverOpen: boolean;
  selectedOption?: SelectedDataSourceOption[];
}

interface SelectedDataSourceOption extends DataSourceOption {
  checked?: boolean;
}

export class DataSourceSelectable extends React.Component<
  DataSourceSelectableProps,
  DataSourceSelectableState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceSelectableProps) {
    super(props);

    this.state = {
      dataSourceOptions: [],
      isPopoverOpen: false,
      selectedOption: this.props.selectedOption
        ? this.props.selectedOption
        : this.props.hideLocalCluster
        ? []
        : [LocalCluster],
    };

    this.onChange.bind(this);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }

  async componentDidMount() {
    this._isMounted = true;
    getDataSourcesWithFields(this.props.savedObjectsClient, ['id', 'title', 'auth.type'])
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          let filteredDataSources: Array<SavedObject<DataSourceAttributes>> = [];
          if (this.props.dataSourceFilter) {
            filteredDataSources = fetchedDataSources.filter((ds) =>
              this.props.dataSourceFilter!(ds)
            );
          }

          if (filteredDataSources.length === 0) {
            filteredDataSources = fetchedDataSources;
          }

          const dataSourceOptions = filteredDataSources
            .map((dataSource) => ({
              id: dataSource.id,
              label: dataSource.attributes?.title || '',
            }))
            .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
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

  onChange(options: SelectedDataSourceOption[]) {
    if (!this._isMounted) return;
    const selectedDataSource = options.find(({ checked }) => checked);

    this.setState({ dataSourceOptions: options });

    if (selectedDataSource) {
      this.setState({
        selectedOption: [selectedDataSource],
      });

      this.props.onSelectedDataSources([
        { id: selectedDataSource.id!, label: selectedDataSource.label },
      ]);
    }
  }

  render() {
    const button = (
      <>
        <EuiButtonEmpty
          className="euiHeaderLink"
          onClick={this.onClick.bind(this)}
          data-test-subj="dataSourceSelectableContextMenuHeaderLink"
          aria-label={i18n.translate('dataSourceSelectable.dataSourceOptionsButtonAriaLabel', {
            defaultMessage: 'dataSourceMenuButton',
          })}
          iconType="database"
          iconSide="left"
          size="s"
          disabled={this.props.disabled || false}
        >
          {(this.state.selectedOption &&
            this.state.selectedOption.length > 0 &&
            this.state.selectedOption[0].label) ||
            ''}
        </EuiButtonEmpty>
      </>
    );

    return (
      <EuiPopover
        id={'dataSourceSelectableContextMenuPopover'}
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
        data-test-subj={'dataSourceSelectableContextMenuPopover'}
      >
        <EuiContextMenuPanel>
          <EuiPanel color="transparent" paddingSize="s">
            <EuiSpacer size="s" />
            <EuiSelectable
              aria-label="Search"
              searchable
              searchProps={{
                placeholder: 'Search',
              }}
              options={this.state.dataSourceOptions}
              onChange={(newOptions) => this.onChange(newOptions)}
              singleSelection={true}
              data-test-subj={'dataSourceSelectable'}
            >
              {(list, search) => (
                <>
                  {search}
                  {list}
                </>
              )}
            </EuiSelectable>
          </EuiPanel>
        </EuiContextMenuPanel>
      </EuiPopover>
    );
  }
}
