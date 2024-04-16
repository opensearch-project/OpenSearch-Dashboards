/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiPopover, EuiButtonEmpty, EuiButtonIcon, EuiContextMenu } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceBaseState, DataSourceOption } from '../data_source_menu/types';
import { MenuPanelItem } from '../../types';
import { DataSourceErrorMenu } from '../data_source_error_menu';
import {
  getDataSourceById,
  handleDataSourceFetchError,
  handleNoAvailableDataSourceError,
} from '../utils';
import { LocalCluster } from '../constants';

interface DataSourceViewProps {
  fullWidth: boolean;
  selectedOption: DataSourceOption[];
  hideLocalCluster: boolean;
  savedObjectsClient?: SavedObjectsClientContract;
  notifications?: ToastsStart;
  uiSettings?: IUiSettingsClient;
  dataSourceFilter?: (dataSource: any) => boolean;
  onSelectedDataSources?: (dataSources: DataSourceOption[]) => void;
}

interface DataSourceViewState extends DataSourceBaseState {
  selectedOption: DataSourceOption[];
  isPopoverOpen: boolean;
}

export class DataSourceView extends React.Component<DataSourceViewProps, DataSourceViewState> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceViewProps) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      selectedOption: this.props.selectedOption ? this.props.selectedOption : [],
      showError: false,
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  async componentDidMount() {
    this._isMounted = true;

    const selectedOption = this.props.selectedOption;
    const option = selectedOption[0];
    const optionId = option.id;

    if (optionId === '' && !this.props.hideLocalCluster) {
      this.setState({
        selectedOption: [LocalCluster],
      });
      if (this.props.onSelectedDataSources) {
        this.props.onSelectedDataSources([LocalCluster]);
      }
      return;
    }

    if (
      (optionId === '' && this.props.hideLocalCluster) ||
      (this.props.dataSourceFilter &&
        this.props.selectedOption.filter(this.props.dataSourceFilter).length === 0)
    ) {
      this.setState({
        selectedOption: [],
      });
      if (this.props.onSelectedDataSources) {
        this.props.onSelectedDataSources([]);
      }
      handleNoAvailableDataSourceError(this.props.notifications!);
      return;
    }

    if (!option.label) {
      try {
        const selectedDataSource = await getDataSourceById(
          optionId,
          this.props.savedObjectsClient!
        );
        if (!this._isMounted) return;
        this.setState({
          selectedOption: [{ id: optionId, label: selectedDataSource.title }],
        });
        if (this.props.onSelectedDataSources) {
          this.props.onSelectedDataSources([{ id: optionId, label: selectedDataSource.title }]);
        }
      } catch (error) {
        handleDataSourceFetchError(this.onError.bind(this), this.props.notifications!);
      }
    } else if (this.props.onSelectedDataSources) {
      this.props.onSelectedDataSources([option]);
    }
  }

  onError() {
    this.setState({ showError: true });
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }

  getPanels() {
    let items: MenuPanelItem[] = [];
    if (this.state.selectedOption) {
      items = this.state.selectedOption.map((option) => {
        return {
          name: option.label,
          disabled: true,
        };
      });
    }

    const panels = [
      {
        id: 0,
        title: 'Selected data source',
        items,
      },
    ];

    return { panels };
  }

  render() {
    if (this.state.showError) {
      return <DataSourceErrorMenu />;
    }
    const { panels } = this.getPanels();

    const button = (
      <EuiButtonIcon
        iconType="iInCircle"
        display="empty"
        aria-label="Next"
        onClick={this.onClick.bind(this)}
      />
    );
    return (
      <>
        <EuiButtonEmpty
          className="euiHeaderLink"
          data-test-subj="dataSourceViewContextMenuHeaderLink"
          aria-label={i18n.translate('dataSourceView.dataSourceOptionsButtonAriaLabel', {
            defaultMessage: 'dataSourceViewMenuButton',
          })}
          iconType="database"
          iconSide="left"
          size="s"
          disabled={true}
        >
          {this.state.selectedOption && this.state.selectedOption.length > 0
            ? this.state.selectedOption[0].label
            : ''}
        </EuiButtonEmpty>
        <EuiPopover
          id={'dataSourceViewContextMenuPopover'}
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
