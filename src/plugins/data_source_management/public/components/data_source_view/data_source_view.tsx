/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiPopover, EuiButtonEmpty, EuiButtonIcon, EuiContextMenu } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { DataSourceOption } from '../data_source_menu/types';
import { getDataSourceById } from '../utils';

interface DataSourceViewProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  fullWidth: boolean;
  selectedOption?: DataSourceOption[];
}

interface DataSourceViewState {
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
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  async componentDidMount() {
    this._isMounted = true;
    const selectedOption = this.props.selectedOption;
    if (selectedOption && selectedOption.length === 1) {
      if (selectedOption[0].id && !selectedOption[0].label) {
        const title = (await getDataSourceById(selectedOption[0].id, this.props.savedObjectsClient))
          .title;
        if (!title) {
          this.props.notifications.addWarning(
            i18n.translate('dataSource.fetchDataSourceError', {
              defaultMessage: `Invalid selectedOption: ${selectedOption[0].id}`,
            })
          );
        } else {
          if (!this._isMounted) return;
          this.setState({
            selectedOption: [{ id: selectedOption[0].id, label: title }],
          });
        }
      }
    }
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
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

    let items: Array<{ name: string | undefined; disabled: boolean }> = [];

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
