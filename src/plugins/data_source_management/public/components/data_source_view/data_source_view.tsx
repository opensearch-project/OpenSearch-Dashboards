/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiPopover,
  EuiContextMenuPanel,
  EuiPanel,
  EuiSelectable,
  EuiSwitch,
} from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceOption } from '../data_source_menu/types';
import { getDataSourceById, getDataSources, handleDataSourceFetchError } from '../utils';
import './_data_source_view.scss';
import { DataSourceOptionItem } from '../data_source_option';

interface DataSourceViewProps {
  fullWidth: boolean;
  selectedOption: DataSourceOption[];
  savedObjectsClient?: SavedObjectsClientContract;
  notifications?: ToastsStart;
  uiSettings?: IUiSettingsClient;
}

interface DataSourceOptionDisplay extends DataSourceOption {
  disabled?: boolean;
  checked?: string;
}

interface DataSourceViewState {
  selectedOption: DataSourceOptionDisplay[];
  isPopoverOpen: boolean;
  defaultDataSource: string | null;
  allDataSources: any;
  checked: boolean;
  dataSourceOptionDisplay: DataSourceOptionDisplay[];
}

export class DataSourceView extends React.Component<DataSourceViewProps, DataSourceViewState> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceViewProps) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      selectedOption: this.props.selectedOption ? this.props.selectedOption : [],
      defaultDataSource: null,
      allDataSources: [],
      checked: true,
      dataSourceOptionDisplay: [],
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  async componentDidMount() {
    this._isMounted = true;
    const selectedOption = this.props.selectedOption;
    // early return if not possible to fetch data source

    const option = selectedOption[0];
    const optionId = option.id;
    const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
    const allDataSources = await getDataSources(this.props.savedObjectsClient!);
    if (!option.label) {
      try {
        const title = (await getDataSourceById(optionId, this.props.savedObjectsClient!)).title;
        if (!title) {
          handleDataSourceFetchError(optionId, this.props.notifications!);
        } else {
          if (!this._isMounted) return;
          this.setState({
            selectedOption: [{ id: optionId, label: title, checked: 'on', disabled: true }],
            dataSourceOptionDisplay: [
              { id: optionId, label: title, checked: 'on', disabled: true },
            ],
            defaultDataSource,
            allDataSources,
          });
          return;
        }
      } catch (error) {
        handleDataSourceFetchError(optionId, this.props.notifications!, error);
      }
    }
    this.setState({
      ...this.state,
      selectedOption: [{ id: optionId, label: option.label, checked: 'on', disabled: true }],
      dataSourceOptionDisplay: [
        { id: optionId, label: option.label, checked: 'on', disabled: true },
      ],
      defaultDataSource,
      allDataSources,
    });
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }

  onChange(e) {
    const checked = e.target.checked;
    let dataSourcesAggreated = this.state.allDataSources.map((dataSource) => {
      if (dataSource.id === this.state.selectedOption[0].id) {
        return {
          id: this.state.selectedOption[0].id,
          label: this.state.selectedOption[0].label,
          checked: 'on',
          disabled: true,
        };
      } else {
        return { id: dataSource.id, label: dataSource.title!, disabled: true };
      }
    });
    dataSourcesAggreated = checked
      ? dataSourcesAggreated.filter((item) => item.checked === 'on')
      : dataSourcesAggreated;
    this.setState({ checked, dataSourceOptionDisplay: dataSourcesAggreated });
  }

  render() {
    const options = this.state.dataSourceOptionDisplay;
    const label = this.state.selectedOption[0].label;
    const button = (
      <>
        <EuiButtonEmpty
          className="dataSourceViewButton"
          data-test-subj="dataSourceViewrButton"
          onClick={this.onClick.bind(this)}
          aria-label={i18n.translate('dataSourceView.dataSourceOptionsViewAriaLabel', {
            defaultMessage: 'dataSourceViewButton',
          })}
          iconType="database"
          iconSide="left"
          size="s"
        >
          {label}
        </EuiButtonEmpty>
      </>
    );

    return (
      <EuiPopover
        id={'dataSourceViewPopover'}
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <EuiContextMenuPanel title={`DATA SOURCE 1/${this.state.allDataSources.length}`}>
          <EuiPanel color="transparent" paddingSize="s" className="panelWidth">
            <EuiSelectable
              options={options}
              renderOption={(option) => (
                <DataSourceOptionItem
                  item={option}
                  defaultDataSource={this.state.defaultDataSource}
                />
              )}
            >
              {(list) => list}
            </EuiSelectable>
            <div className="euiContextMenuItem">
              <EuiSwitch
                label={`Used on this page (1)`}
                checked={this.state.checked}
                onChange={(e) => this.onChange(e)}
              />
            </div>
          </EuiPanel>
        </EuiContextMenuPanel>
      </EuiPopover>
    );
  }
}
