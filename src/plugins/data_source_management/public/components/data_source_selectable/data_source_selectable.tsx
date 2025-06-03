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
  EuiSelectable,
  EuiPopoverTitle,
  EuiSelectableOption,
} from '@elastic/eui';
import {
  ApplicationStart,
  IUiSettingsClient,
  SavedObjectsClientContract,
  ToastsStart,
} from 'opensearch-dashboards/public';
import {
  getDataSourcesWithFields,
  getDefaultDataSource,
  getFilteredDataSources,
  handleDataSourceFetchError,
  handleNoAvailableDataSourceError,
  generateComponentId,
  getDataSourceSelection,
  getDefaultDataSourceId,
} from '../utils';
import { LocalCluster } from '../data_source_selector/data_source_selector';
import { SavedObject } from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';
import { DataSourceBaseState, DataSourceOption } from '../data_source_menu/types';
import { DataSourceErrorMenu } from '../data_source_error_menu';
import { DataSourceItem } from '../data_source_item';
import { NoDataSource } from '../no_data_source';
import './data_source_selectable.scss';
import { DataSourceDropDownHeader } from '../drop_down_header';
import './data_source_selectable.scss';
import { DataSourceMenuPopoverButton } from '../popover_button/popover_button';

interface DataSourceSelectableProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
  disabled: boolean;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  application?: ApplicationStart;
  selectedOption?: DataSourceOption[];
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  uiSettings?: IUiSettingsClient;
  onManageDataSource: () => void;
}

interface DataSourceSelectableState extends DataSourceBaseState {
  dataSourceOptions: DataSourceOption[];
  isPopoverOpen: boolean;
  defaultDataSource: string | null;
  incompatibleDataSourcesExist: boolean;
  selectedOption?: DataSourceOption[];
  componentId: string;
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
      selectedOption: [],
      defaultDataSource: null,
      showEmptyState: false,
      showError: false,
      incompatibleDataSourcesExist: false,
      componentId: generateComponentId(),
    };

    this.onChange.bind(this);
  }

  componentWillUnmount() {
    this._isMounted = false;
    getDataSourceSelection().remove(this.state.componentId);
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }

  onSelectedDataSources(dataSources: DataSourceOption[]) {
    getDataSourceSelection().selectDataSource(this.state.componentId, dataSources);
    this.props.onSelectedDataSources(dataSources);
  }

  // Update the checked status of the selected data source.
  getUpdatedDataSourceOptions(
    selectedDataSourceId: string,
    dataSourceOptions: DataSourceOption[]
  ): DataSourceOption[] {
    return dataSourceOptions.map((option) => ({
      ...option,
      ...(option.id === selectedDataSourceId && { checked: 'on' }),
    }));
  }

  handleSelectedOption(dataSourceOptions: DataSourceOption[], defaultDataSource: string | null) {
    const [{ id }] = this.props.selectedOption!;
    const dsOption = dataSourceOptions.find((ds) => ds.id === id);
    if (!dsOption) {
      this.props.notifications.addWarning(
        i18n.translate('dataSourcesManagement.error.fetchDataSourceById', {
          defaultMessage: 'Data source with ID "{id}" is not available',
          values: { id },
        })
      );
      this.setState({
        ...this.state,
        dataSourceOptions,
        selectedOption: [],
        defaultDataSource,
      });
      this.onSelectedDataSources([]);
      return;
    }
    const updatedDataSourceOptions: DataSourceOption[] = this.getUpdatedDataSourceOptions(
      id,
      dataSourceOptions
    );
    this.setState({
      ...this.state,
      dataSourceOptions: updatedDataSourceOptions,
      selectedOption: [{ id, label: dsOption.label }],
      defaultDataSource,
    });
    this.onSelectedDataSources([{ id, label: dsOption.label }]);
  }

  handleDefaultDataSource(dataSourceOptions: DataSourceOption[], defaultDataSource: string | null) {
    const selectedDataSource = getDefaultDataSource(
      dataSourceOptions,
      LocalCluster,
      defaultDataSource,
      this.props.hideLocalCluster
    );

    // no active option, show warning
    if (selectedDataSource.length === 0) {
      this.props.notifications.addWarning('No connected data source available.');
      this.onSelectedDataSources([]);
      return;
    }

    const updatedDataSourceOptions: DataSourceOption[] = this.getUpdatedDataSourceOptions(
      selectedDataSource[0].id,
      dataSourceOptions
    );

    this.setState({
      ...this.state,
      selectedOption: selectedDataSource,
      dataSourceOptions: updatedDataSourceOptions,
      defaultDataSource,
    });

    this.onSelectedDataSources(selectedDataSource);
  }

  async componentDidMount() {
    this._isMounted = true;

    try {
      const fetchedDataSources = await getDataSourcesWithFields(this.props.savedObjectsClient, [
        'id',
        'title',
        'auth.type',
        'dataSourceVersion',
        'installedPlugins',
      ]);

      const dataSourceOptions: DataSourceOption[] = getFilteredDataSources(
        fetchedDataSources,
        this.props.dataSourceFilter
      );

      if (dataSourceOptions.length === 0 && this.props.hideLocalCluster) {
        this.setState({ showEmptyState: true });
      }

      if (!this.props.hideLocalCluster) {
        dataSourceOptions.unshift(LocalCluster);
      }

      if (dataSourceOptions.length === 0) {
        handleNoAvailableDataSourceError({
          changeState: this.onEmptyState.bind(this, !!fetchedDataSources?.length),
          notifications: this.props.notifications,
          application: this.props.application,
          callback: this.onSelectedDataSources.bind(this),
          incompatibleDataSourcesExist: !!fetchedDataSources?.length,
        });
        return;
      }
      // for data source selectable, get default data source from cache
      const defaultDataSource = (await getDefaultDataSourceId(this.props.uiSettings)) ?? null;

      if (this.props.selectedOption?.length) {
        this.handleSelectedOption(dataSourceOptions, defaultDataSource);
        return;
      }

      // handle default data source if there is no valid active option
      this.handleDefaultDataSource(dataSourceOptions, defaultDataSource);
    } catch (error) {
      handleDataSourceFetchError(
        this.onError.bind(this),
        this.props.notifications,
        this.onSelectedDataSources.bind(this)
      );
    }
  }

  onEmptyState(incompatibleDataSourcesExist: boolean) {
    this.setState({ showEmptyState: true, incompatibleDataSourcesExist });
  }

  onError() {
    this.setState({ showError: true });
  }

  onChange(options: DataSourceOption[]) {
    if (!this._isMounted) return;
    const selectedDataSource = options.find(({ checked }) => checked);

    this.setState({ dataSourceOptions: options });

    if (selectedDataSource) {
      this.setState({
        selectedOption: [selectedDataSource],
        isPopoverOpen: false,
      });

      this.onSelectedDataSources([{ id: selectedDataSource.id!, label: selectedDataSource.label }]);
    }
  }

  render() {
    if (this.state.showEmptyState) {
      return (
        <NoDataSource
          application={this.props.application}
          incompatibleDataSourcesExist={this.state.incompatibleDataSourcesExist}
        />
      );
    }

    if (this.state.showError) {
      return <DataSourceErrorMenu application={this.props.application} />;
    }

    const label =
      (this.state.selectedOption &&
        this.state.selectedOption.length > 0 &&
        this.state.selectedOption[0]?.label) ||
      '';

    return (
      <EuiPopover
        initialFocus={'.euiSelectableSearch'}
        id={'dataSourceSelectableContextMenuPopover'}
        button={
          <DataSourceMenuPopoverButton
            className={'dataSourceSelectable'}
            label={label}
            onClick={this.onClick.bind(this)}
          />
        }
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
        data-test-subj={'dataSourceSelectableContextMenuPopover'}
      >
        <DataSourceDropDownHeader
          onManageDataSource={this.props.onManageDataSource}
          totalDataSourceCount={this.state.dataSourceOptions.length}
          application={this.props.application}
        />
        <EuiContextMenuPanel>
          <EuiPanel
            className={'dataSourceSelectableOuiPanel'}
            color="transparent"
            paddingSize="none"
          >
            <EuiSelectable
              aria-label="Search"
              searchable
              searchProps={{
                placeholder: 'Search',
                compressed: true,
              }}
              listProps={{
                onFocusBadge: false,
              }}
              options={this.state.dataSourceOptions as Array<EuiSelectableOption<DataSourceOption>>}
              onChange={(newOptions) => this.onChange(newOptions)}
              singleSelection={'always'}
              data-test-subj={'dataSourceSelectable'}
              renderOption={(option) => (
                <DataSourceItem
                  option={option}
                  defaultDataSource={this.state.defaultDataSource}
                  className={'dataSourceSelectable'}
                />
              )}
            >
              {(list, search) => (
                <>
                  <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
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
