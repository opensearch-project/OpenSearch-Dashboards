/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPopover, EuiContextMenuPanel, EuiPanel, EuiSelectable } from '@elastic/eui';
import {
  SavedObjectsClientContract,
  ToastsStart,
  ApplicationStart,
} from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceBaseState, DataSourceOption } from '../data_source_menu/types';
import { DataSourceErrorMenu } from '../data_source_error_menu';
import {
  getDataSourceById,
  handleDataSourceFetchError,
  generateComponentId,
  getDataSourceSelection,
  getDefaultDataSourceId,
} from '../utils';
import { DataSourceDropDownHeader } from '../drop_down_header';
import { DataSourceItem } from '../data_source_item';
import { LocalCluster } from '../constants';
import './data_source_view.scss';
import { DataSourceMenuPopoverButton } from '../popover_button/popover_button';

interface DataSourceViewProps {
  fullWidth: boolean;
  selectedOption: DataSourceOption[];
  hideLocalCluster: boolean;
  application?: ApplicationStart;
  savedObjectsClient?: SavedObjectsClientContract;
  notifications?: ToastsStart;
  uiSettings?: IUiSettingsClient;
  dataSourceFilter?: (dataSource: any) => boolean;
  onSelectedDataSources?: (dataSources: DataSourceOption[]) => void;
}

interface DataSourceViewState extends DataSourceBaseState {
  selectedOption: DataSourceOption[];
  isPopoverOpen: boolean;
  defaultDataSource: string | null;
  componentId: string;
}

export class DataSourceView extends React.Component<DataSourceViewProps, DataSourceViewState> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceViewProps) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      selectedOption: this.props.selectedOption ? this.props.selectedOption : [],
      showEmptyState: false,
      showError: false,
      defaultDataSource: null,
      componentId: generateComponentId(),
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
    getDataSourceSelection().remove(this.state.componentId);
  }
  async componentDidMount() {
    this._isMounted = true;

    const selectedOption = this.props.selectedOption;
    const option = selectedOption[0];
    const optionId = option.id;
    // for data source view, get default data source from cache
    const defaultDataSource = (await getDefaultDataSourceId(this.props.uiSettings)) ?? null;
    if (optionId === '' && !this.props.hideLocalCluster) {
      this.setState({
        selectedOption: [LocalCluster],
        defaultDataSource,
      });
      this.onSelectedDataSources([LocalCluster]);
      return;
    }

    if (optionId === '' && this.props.hideLocalCluster) {
      this.setState({
        selectedOption: [],
      });
      this.onSelectedDataSources([]);
      return;
    }

    if (!option.label) {
      try {
        const selectedDataSource = await getDataSourceById(
          optionId,
          this.props.savedObjectsClient!
        );
        if (
          this.props.dataSourceFilter &&
          [selectedDataSource].filter(this.props.dataSourceFilter).length === 0
        ) {
          this.setState({
            selectedOption: [],
          });
          this.onSelectedDataSources([]);
          return;
        }

        if (!this._isMounted) return;
        this.setState({
          selectedOption: [{ id: optionId, label: selectedDataSource.title }],
          defaultDataSource,
        });
        this.onSelectedDataSources([{ id: optionId, label: selectedDataSource.title }]);
      } catch (error) {
        handleDataSourceFetchError(
          this.onError.bind(this),
          this.props.notifications!,
          this.onSelectedDataSources.bind(this)
        );
      }
    } else {
      this.setState({
        ...this.state,
        defaultDataSource,
      });
      this.onSelectedDataSources([option]);
    }
  }

  onSelectedDataSources(dataSource: DataSourceOption[]) {
    getDataSourceSelection().selectDataSource(this.state.componentId, dataSource);

    if (this.props.onSelectedDataSources) {
      this.props.onSelectedDataSources(dataSource);
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

  render() {
    if (this.state.showError) {
      return <DataSourceErrorMenu application={this.props.application} />;
    }
    const label =
      this.state.selectedOption.length > 0 && this.state.selectedOption[0].label
        ? this.state.selectedOption[0].label
        : '';
    const options =
      this.state.selectedOption.length > 0
        ? this.state.selectedOption.map((option) => ({
            ...option,
            checked: 'on',
            disabled: true,
          }))
        : [];

    return (
      <EuiPopover
        id={'dataSourceViewPopover'}
        button={
          <DataSourceMenuPopoverButton
            className={'dataSourceView'}
            label={label}
            onClick={this.onClick.bind(this)}
            isDisabled
          />
        }
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <DataSourceDropDownHeader totalDataSourceCount={1} application={this.props.application} />
        <EuiContextMenuPanel className={'dataSourceViewOuiPanel'}>
          <EuiPanel color="subdued" paddingSize="none" borderRadius="none">
            <EuiSelectable
              options={options}
              singleSelection={true}
              data-test-subj={'dataSourceView'}
              renderOption={(option) => (
                <DataSourceItem
                  option={option}
                  defaultDataSource={this.state.defaultDataSource}
                  className={'dataSourceView'}
                />
              )}
            >
              {(list) => list}
            </EuiSelectable>
          </EuiPanel>
        </EuiContextMenuPanel>
      </EuiPopover>
    );
  }
}
