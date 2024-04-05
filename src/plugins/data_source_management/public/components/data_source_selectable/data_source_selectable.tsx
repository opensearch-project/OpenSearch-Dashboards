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
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
} from '@elastic/eui';
import {
  IUiSettingsClient,
  SavedObjectsClientContract,
  ToastsStart,
} from 'opensearch-dashboards/public';
import { getDataSourcesWithFields, getDefaultDataSource } from '../utils';
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
  uiSettings?: IUiSettingsClient;
}

interface DataSourceSelectableState {
  dataSourceOptions: SelectedDataSourceOption[];
  isPopoverOpen: boolean;
  selectedOption?: SelectedDataSourceOption[];
  defaultDataSource: string | null;
}

interface SelectedDataSourceOption extends DataSourceOption {
  checked?: string;
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
    try {
      let filteredDataSources: Array<SavedObject<DataSourceAttributes>> = [];
      let dataSourceOptions: DataSourceOption[] = [];

      // Fetch data sources with fields
      const fetchedDataSources = await getDataSourcesWithFields(this.props.savedObjectsClient, [
        'id',
        'title',
        'auth.type',
      ]);

      if (fetchedDataSources?.length) {
        filteredDataSources = this.props.dataSourceFilter
          ? fetchedDataSources.filter((ds) => this.props.dataSourceFilter!(ds))
          : fetchedDataSources;
        dataSourceOptions = filteredDataSources
          .map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.attributes?.title || '',
          }))
          .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
      }

      // Add local cluster to the list of data sources if it is not hidden.
      if (!this.props.hideLocalCluster) {
        dataSourceOptions.unshift(LocalCluster);
      }

      const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
      const selectedDataSource = getDefaultDataSource(
        filteredDataSources,
        LocalCluster,
        this.props.uiSettings,
        this.props.hideLocalCluster,
        this.props.selectedOption
      );

      if (selectedDataSource.length === 0) {
        this.props.notifications.addWarning('No connected data source available.');
      } else {
        // Update the checked status of the selected data source.
        const updatedDataSourceOptions: SelectedDataSourceOption[] = dataSourceOptions.map(
          (option) => ({
            ...option,
            ...(option.id === selectedDataSource[0].id && { checked: 'on' }),
          })
        );

        if (!this._isMounted) return;

        this.setState({
          ...this.state,
          dataSourceOptions: updatedDataSourceOptions,
          selectedOption: selectedDataSource,
          defaultDataSource,
        });

        this.props.onSelectedDataSources(selectedDataSource);
      }
    } catch (error) {
      this.props.notifications.addWarning(
        i18n.translate('dataSource.fetchDataSourceError', {
          defaultMessage: 'Unable to fetch existing data sources',
        })
      );
    }
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

  getLable(): string {
    const selectedOption =
      this.state.selectedOption &&
      this.state.selectedOption.length > 0 &&
      this.state.selectedOption[0]
        ? this.state.selectedOption[0]
        : '';
    if (!selectedOption) return '';
    else {
      if (selectedOption.id === '' || (selectedOption.id && selectedOption.label)) {
        return selectedOption.label;
      } else {
        // label not exist, get it from dataSourceOptions
        const options = this.state.dataSourceOptions;
        if (options && options.length > 0) {
          // if dataSourceOptions is not empty
          const mappingOption = options.find((option) => selectedOption.id! === option.id);
          if (mappingOption && mappingOption.label) {
            return mappingOption.label;
          } else {
            this.props.notifications.addWarning(
              i18n.translate('dataSource.fetchDataSourceError', {
                defaultMessage: `Data source with id ${selectedOption.id} is not available`,
              })
            );
          }
        }
      }
    }
  }
  render() {
    const label = this.getLable();
    const button = (
      <>
        <EuiButtonEmpty
          id={'dataSourceSelectableContextMenuHeaderLink'}
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
          {label}
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
          <EuiPanel color="transparent" paddingSize="s" style={{ width: '300px' }}>
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
