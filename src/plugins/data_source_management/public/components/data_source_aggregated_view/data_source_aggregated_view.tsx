/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButtonEmpty,
  EuiPopover,
  EuiBadge,
  EuiSelectable,
  EuiContextMenuPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { getDataSourcesWithFields, getFilteredDataSources } from '../utils';
import { SavedObject } from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';
import { DataSourceOption } from '../data_source_menu/types';

export const LocalCluster: DataSourceOption = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

interface PanelOption {
  id: string;
  label: string;
  disabled?: boolean;
  checked?: string;
}

interface DataSourceAggregatedViewProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  activeDataSourceIds?: string[];
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  displayAllCompatibleDataSources: boolean;
  uiSettings?: IUiSettingsClient;
}

interface DataSourceAggregatedViewState {
  isPopoverOpen: boolean;
  dataSourceOptions: DataSourceOption[];
  defaultDataSource: string | null;
}

export class DataSourceAggregatedView extends React.Component<
  DataSourceAggregatedViewProps,
  DataSourceAggregatedViewState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceAggregatedViewProps) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      dataSourceOptions: [],
      defaultDataSource: '',
    };
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
    try {
      const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
      const fetchedDataSources = await getDataSourcesWithFields(this.props.savedObjectsClient, [
        'id',
        'title',
        'auth.type',
      ]);

      const dataSourceOptions: DataSourceOption[] = getFilteredDataSources(
        fetchedDataSources,
        this.props.dataSourceFilter
      );

      if (!this.props.hideLocalCluster) {
        dataSourceOptions.unshift(LocalCluster);
      }

      if (!this._isMounted) return;

      this.setState({
        ...this.state,
        dataSourceOptions,
        defaultDataSource,
      });
    } catch (error) {
      this.props.notifications.addWarning(
        i18n.translate('dataSource.fetchDataSourceError', {
          defaultMessage: 'Unable to fetch existing data sources',
        })
      );
    }
  }

  render() {
    let items: PanelOption[] = [];

    // only display active data sources
    if (this.props.displayAllCompatibleDataSources) {
      items = this.state.dataSourceOptions.map((dataSource) => ({
        id: dataSource.id,
        label: dataSource.label!,
        disabled: true,
        checked: 'on',
      }));
    } else {
      items = this.state.dataSourceOptions
        .filter((dataSource) => this.props.activeDataSourceIds!.includes(dataSource.id))
        .map((dataSource) => ({
          id: dataSource.id,
          label: dataSource.label!,
          disabled: true,
          checked: 'on',
        }));
    }

    const button = (
      <EuiButtonEmpty
        data-test-subj="dataSourceAggregatedViewInfoButton"
        iconType="database"
        iconSide="left"
        size="s"
        aria-label="show data sources"
        onClick={this.onClick.bind(this)}
      >
        Data sources
      </EuiButtonEmpty>
    );

    return (
      <>
        <EuiPopover
          id={'dataSourceSViewContextMenuPopover'}
          button={button}
          isOpen={this.state.isPopoverOpen}
          closePopover={this.closePopover.bind(this)}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenuPanel title="Data sources">
            <EuiPanel color="transparent" paddingSize="s" style={{ width: '300px' }}>
              <EuiSpacer size="s" />
              <EuiSelectable
                options={items}
                data-test-subj={'dataSourceSelectable'}
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
              >
                {(list) => list}
              </EuiSelectable>
            </EuiPanel>
          </EuiContextMenuPanel>
        </EuiPopover>
      </>
    );
  }
}
