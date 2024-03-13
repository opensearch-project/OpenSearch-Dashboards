/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenu,
  EuiNotificationBadge,
  EuiPopover,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { DataSourceOption } from '../data_source_selector/data_source_selector';
import { getDataSourcesWithFields } from '../utils';

interface DataSourceAggregatedViewProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  activeDatasourceIds?: string[];
  filterFn?: (dataSource: any) => boolean;
  displayAllCompatibleDataSources: boolean;
}

interface DataSourceAggregatedViewState {
  dataSourceOptions: DataSourceOption[];
  selectedOption: DataSourceOption[];
  isPopoverOpen: boolean;
  allDataSourcesIdMap: Map<string, any>;
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
      allDataSourcesIdMap: new Map(),
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
    getDataSourcesWithFields(this.props.savedObjectsClient, ['id', 'title', 'auth.type'])
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          let filteredDataSources = fetchedDataSources;
          if (this.props.filterFn) {
            filteredDataSources = fetchedDataSources.filter((ds) => this.props.filterFn!(ds));
          }

          const allDataSourcesIdMap = new Map();

          filteredDataSources.forEach((ds) => {
            allDataSourcesIdMap.set(ds.id, ds.attributes!.title || '');
          });

          if (!this.props.hideLocalCluster) {
            allDataSourcesIdMap.set('', 'Local cluster');
          }

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            allDataSourcesIdMap,
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

  render() {
    const button = (
      <EuiButtonIcon
        iconType="iInCircle"
        display="empty"
        aria-label="Next"
        onClick={this.onClick.bind(this)}
      />
    );

    let items = [];

    // only display active data sources
    if (this.props.activeDatasourceIds && this.props.activeDatasourceIds.length > 0) {
      items = this.props.activeDatasourceIds.map((id) => {
        return {
          name: this.state.allDataSourcesIdMap.get(id),
          disabled: true,
        };
      });
    } else {
      items = [...this.state.allDataSourcesIdMap.values()].map((v) => {
        return {
          name: v,
          disabled: true,
        };
      });
    }

    const title = this.props.displayAllCompatibleDataSources
      ? `Data sources (${this.state.allDataSourcesIdMap.size})`
      : 'Selected data sources';

    const panels = [
      {
        id: 0,
        title,
        items,
      },
    ];

    return (
      <>
        <EuiButtonEmpty
          className="euiHeaderLink"
          data-test-subj="dataSourceAggregatedViewContextMenuHeaderLink"
          aria-label={i18n.translate('dataSourceAggregatedView.dataSourceOptionsButtonAriaLabel', {
            defaultMessage: 'dataSourceAggregatedViewMenuButton',
          })}
          iconType="database"
          iconSide="left"
          size="s"
          disabled={true}
        >
          {'Data sources'}
        </EuiButtonEmpty>
        <EuiNotificationBadge color={'subdued'}>
          {this.props.activeDatasourceIds?.length || 'All'}
        </EuiNotificationBadge>
        <EuiPopover
          id={'dataSourceSViewContextMenuPopover'}
          button={button}
          isOpen={this.state.isPopoverOpen}
          closePopover={this.closePopover.bind(this)}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenu initialPanelId={0} panels={panels} />
        </EuiPopover>
      </>
    );
  }
}
