/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiPopover, EuiButtonEmpty, EuiButtonIcon, EuiContextMenu } from '@elastic/eui';
import { DataSourceOption } from '../data_source_selector/data_source_selector';

interface DataSourceViewProps {
  fullWidth: boolean;
  selectedOption?: DataSourceOption[];
}

interface DataSourceViewState {
  dataSourceOptions: DataSourceOption[];
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

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }

  async componentDidMount() {
    this._isMounted = true;
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

    if (this.props.selectedOption) {
      items = this.props.selectedOption.map((option) => {
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
          {this.props.selectedOption && this.props.selectedOption.length > 0
            ? this.props.selectedOption[0].label
            : ''}
        </EuiButtonEmpty>
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
