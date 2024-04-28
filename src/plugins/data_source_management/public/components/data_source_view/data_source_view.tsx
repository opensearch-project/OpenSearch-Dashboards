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
import { DataSource } from 'src/plugins/data/public';
import { DataSourceBaseState, DataSourceOption } from '../data_source_menu/types';
<<<<<<< HEAD
import { DataSourceErrorMenu } from '../data_source_error_menu';
import {
  getDataSourceById,
  handleDataSourceFetchError,
  generateComponentId,
  getDataSourceSelection,
  getDefaultDataSourceId,
=======
import {
  DataSourceViewErrorWithDefaultParams,
  getDataSourceById,
  handleDataSourceFetchError,
  handleDataSourceViewErrorWithSwitchToDefaultOption,
>>>>>>> add invalid id handling for DataSourceView
} from '../utils';
import { DataSourceDropDownHeader } from '../drop_down_header';
import { DataSourceItem } from '../data_source_item';
import { LocalCluster } from '../constants';
import './data_source_view.scss';
import { DataSourceMenuPopoverButton } from '../popover_button/popover_button';
import { DataSourceViewError } from './data_source_view_error';

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
    const defaultDataSourceId = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
    const defaultDataSourceObj = defaultDataSourceId
      ? await this.getDefaultDataSourceObj(defaultDataSourceId)
      : null;
    const filteredDefaultDataSourceOption = this.getFilteredDataSource(defaultDataSourceObj);

    if (optionId === '' && !this.props.hideLocalCluster) {
      this.setState({
        selectedOption: [LocalCluster],
        defaultDataSource: filteredDefaultDataSourceOption,
      });
      this.onSelectedDataSources([LocalCluster]);
      return;
    }

    if (
      (optionId === '' && this.props.hideLocalCluster) ||
      (this.props.dataSourceFilter && !this.props.dataSourceFilter(this.props.selectedOption))
    ) {
      this.setState({
        selectedOption: [],
      });
      this.onSelectedDataSources([]);
      return;
    }

    const handleDataSourceViewErrorParams = {
      changeState: this.onError.bind(this, filteredDefaultDataSourceOption),
      notifications: this.props.notifications!,
      failedDataSourceId: optionId,
      defaultDataSourceOption: filteredDefaultDataSourceOption,
      handleSwitch: this.handleSwitchDefaultDatasource.bind(this, filteredDefaultDataSourceOption),
      callback: this.props.onSelectedDataSources,
    } as DataSourceViewErrorWithDefaultParams;

    if (!option.label) {
      try {
        const selectedDataSource = await getDataSourceById(
          optionId,
          this.props.savedObjectsClient!
        );
        if (!this._isMounted) return;
        const filteredSelectedDataSourceOption = this.getFilteredDataSource(selectedDataSource);

        // if the selectedOption has been filtered out, treat it as invalid id error and early return
        if (!filteredSelectedDataSourceOption) {
          handleDataSourceViewErrorWithSwitchToDefaultOption(handleDataSourceViewErrorParams);
          return;
        }
        this.setState({
          selectedOption: [filteredSelectedDataSourceOption],
          defaultDataSource: filteredDefaultDataSourceOption,
        });
        this.onSelectedDataSources([{ id: optionId, label: selectedDataSource.title }]);
      } catch (error) {
        // handle fetch data source error and provide switch to default option
        handleDataSourceViewErrorWithSwitchToDefaultOption(handleDataSourceViewErrorParams);
      }
    } else {
      this.setState({
        ...this.state,
        defaultDataSource: filteredDefaultDataSourceOption,
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

  /**
   * when defaultDataSourceId exist, get the complete defaultDataSource obj by calling getDataSourceById
   * @param defaultDataSourceId non-null string
   */
  async getDefaultDataSourceObj(defaultDataSourceId: string) {
    try {
      return await getDataSourceById(defaultDataSourceId!, this.props.savedObjectsClient!);
    } catch (error) {
      // when need to call getDataSourceById, user has to provide the notification and saveObjectClient
      // pass null as defaultDataSourceOption since failed to get it
      handleDataSourceFetchError(this.onError.bind(this, null), this.props.notifications!);
      return null;
    }
  }

  /**
   * set the showError state and also default data source option when handle the error at get data source
   * @param defaultDataSourceOption
   */
  onError(defaultDataSourceOption: DataSourceOption | null) {
    this.setState({ showError: true, defaultDataSource: defaultDataSourceOption });
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }
  getFilteredDataSource(dataSourceObj: any): DataSourceOption | null {
    if (!dataSourceObj) return null;
    const { dataSourceFilter } = this.props;
    // check if the defaultDataSouce can be filtered out
    const canFilteredDataSource: boolean = dataSourceFilter
      ? dataSourceFilter(dataSourceObj)
      : false;
    return canFilteredDataSource ? { id: dataSourceObj.id, label: dataSourceObj.title } : null;
  }
  /**
   * when call handleSwitchDefaultDatasource, the default data source must exist,
   * since the button only display when defaultDataSource exist
   */
  async handleSwitchDefaultDatasource(defaultDataSourceOption: DataSourceOption | null) {
    // reset the state to close popover and error, selectedOption will be replaced by default option
    if (!defaultDataSourceOption) return;
    this.setState({
      selectedOption: [defaultDataSourceOption!],
      showError: false,
      isPopoverOpen: false,
    });
  }

  render() {
    if (this.state.showError) {
      return (
        <DataSourceViewError
          application={this.props.application}
          dataSourceId={this.props.selectedOption[0].id}
          showSwitchButton={!!this.state.defaultDataSource}
          handleSwitchDefaultDatasource={() =>
            this.handleSwitchDefaultDatasource(this.state.defaultDataSource)
          }
        />
      );
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
                  defaultDataSource={this.state.defaultDataSource?.id || null}
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
