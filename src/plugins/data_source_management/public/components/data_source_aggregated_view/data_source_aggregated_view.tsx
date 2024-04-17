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
import { getDataSourcesWithFields, handleDataSourceFetchError } from '../utils';
import { SavedObject } from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';
import { DataSourceErrorMenu } from '../data_source_error_menu';
import { DataSourceBaseState } from '../data_source_menu/types';

interface DataSourceAggregatedViewProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  activeDataSourceIds?: string[];
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  displayAllCompatibleDataSources: boolean;
}

interface DataSourceAggregatedViewState extends DataSourceBaseState {
  isPopoverOpen: boolean;
  allDataSourcesIdToTitleMap: Map<string, any>;
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
      allDataSourcesIdToTitleMap: new Map(),
      showError: false,
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
          if (this.props.dataSourceFilter) {
            filteredDataSources = fetchedDataSources.filter((ds) =>
              this.props.dataSourceFilter!(ds)
            );
          }

          const allDataSourcesIdToTitleMap = new Map();

          filteredDataSources.forEach((ds) => {
            allDataSourcesIdToTitleMap.set(ds.id, ds.attributes!.title || '');
          });

          if (!this.props.hideLocalCluster) {
            allDataSourcesIdToTitleMap.set('', 'Local cluster');
          }

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            allDataSourcesIdToTitleMap,
          });
        }
      })
      .catch(() => {
        handleDataSourceFetchError(this.onError.bind(this), this.props.notifications);
      });
  }

  onError() {
    this.setState({ showError: true });
  }

  render() {
    if (this.state.showError) {
      return <DataSourceErrorMenu />;
    }
    const button = (
      <EuiButtonIcon
        data-test-subj="dataSourceAggregatedViewInfoButton"
        iconType="iInCircle"
        display="empty"
        aria-label="show data sources"
        onClick={this.onClick.bind(this)}
      />
    );

    let items = [];

    // only display active data sources
    if (this.props.displayAllCompatibleDataSources) {
      items = [...this.state.allDataSourcesIdToTitleMap.values()].map((title) => {
        return {
          name: title,
          disabled: true,
        };
      });
    } else {
      items = this.props.activeDataSourceIds!.map((id) => {
        return {
          name: this.state.allDataSourcesIdToTitleMap.get(id),
          disabled: true,
        };
      });
    }

    const title = this.props.displayAllCompatibleDataSources
      ? `Data sources (${this.state.allDataSourcesIdToTitleMap.size})`
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
          {(this.props.displayAllCompatibleDataSources && 'All') ||
            this.props.activeDataSourceIds!.length}
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
