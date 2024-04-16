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
  EuiHorizontalRule,
} from '@elastic/eui';
import {
  ApplicationStart,
  IUiSettingsClient,
  SavedObjectsClientContract,
  ToastsStart,
} from 'opensearch-dashboards/public';
import {
  dataSourceOptionGroupLabel,
  getDataSourcesWithFields,
  getDefaultDataSource,
  getFilteredDataSources,
  handleDataSourceFetchError,
} from '../utils';
import { LocalCluster } from '../data_source_selector/data_source_selector';
import { SavedObject } from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';
import {
  DataSourceBaseState,
  DataSourceGroupLabelOption,
  DataSourceOption,
} from '../data_source_menu/types';
import { DataSourceErrorMenu } from '../data_source_error_menu';
import { DataSourceItem } from '../data_source_item';
import './data_source_selectable.scss';
import { DataSourceDropDownHeader } from '../drop_down_header';

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
}

interface DataSourceSelectableState extends DataSourceBaseState {
  dataSourceOptions: DataSourceOption[];
  isPopoverOpen: boolean;
  selectedOption?: DataSourceOption[];
  defaultDataSource: string | null;
}

export const opensearchClusterGroupLabel: DataSourceGroupLabelOption = {
  id: 'opensearchClusterGroupLabel',
  label: 'OpenSearch cluster',
  isGroupLabel: true,
};

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
      showError: false,
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
        i18n.translate('dataSource.fetchDataSourceError', {
          defaultMessage: `Data source with id: ${id} is not available`,
        })
      );
      this.setState({
        ...this.state,
        dataSourceOptions,
        selectedOption: [],
        defaultDataSource,
      });
      this.props.onSelectedDataSources([]);
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
    this.props.onSelectedDataSources([{ id, label: dsOption.label }]);
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
      this.props.onSelectedDataSources([]);
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

    this.props.onSelectedDataSources(selectedDataSource);
  }

  async componentDidMount() {
    this._isMounted = true;

    try {
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

      const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;

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
        this.props.onSelectedDataSources
      );
    }
  }

  onError() {
    this.setState({ showError: true });
  }

  onChange(options: DataSourceOption[]) {
    if (!this._isMounted) return;
    const optionsWithoutGroupLabel = options.filter(
      (option) => !option.hasOwnProperty('isGroupLabel')
    );
    const selectedDataSource = options.find(({ checked }) => checked);

    this.setState({ dataSourceOptions: optionsWithoutGroupLabel });

    if (selectedDataSource) {
      this.setState({
        selectedOption: [selectedDataSource],
      });

      this.props.onSelectedDataSources([
        { id: selectedDataSource.id!, label: selectedDataSource.label },
      ]);
    }
  }

  getOptionsWithGroupLabel = (dataSourceOptions: DataSourceOption[]): DataSourceOption[] => {
    let optionsWithGroupLabel: DataSourceOption[] = [];
    if (dataSourceOptions.length === 0) {
      optionsWithGroupLabel = [];
    } else {
      optionsWithGroupLabel = [dataSourceOptionGroupLabel.opensearchCluster, ...dataSourceOptions];
    }
    return optionsWithGroupLabel;
  };

  render() {
    if (this.state.showError) {
      return <DataSourceErrorMenu />;
    }
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
          {this.state.selectedOption &&
            this.state.selectedOption.length > 0 &&
            this.state.selectedOption[0]?.label}
        </EuiButtonEmpty>
      </>
    );

    return (
      <EuiPopover
        initialFocus={'.euiSelectableSearch'}
        id={'dataSourceSelectableContextMenuPopover'}
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
        data-test-subj={'dataSourceSelectableContextMenuPopover'}
      >
        <EuiContextMenuPanel>
          <EuiPanel className={'dataSourceSelectableOuiPanel'} color="transparent" paddingSize="s">
            <DataSourceDropDownHeader
              totalDataSourceCount={this.state.dataSourceOptions.length}
              application={this.props.application}
            />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="s" />
            <EuiSelectable
              aria-label="Search"
              searchable
              searchProps={{
                placeholder: 'Search',
                compressed: true,
              }}
              options={this.getOptionsWithGroupLabel(this.state.dataSourceOptions)}
              onChange={(newOptions) => this.onChange(newOptions)}
              singleSelection={true}
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
