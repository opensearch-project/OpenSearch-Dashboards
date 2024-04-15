/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiPopover, EuiButtonEmpty, EuiButtonIcon, EuiContextMenu } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { DataSourceBaseState, DataSourceOption } from '../data_source_menu/types';
import { getDataSourceById } from '../utils';
import { MenuPanelItem } from '../../types';
import { NoDataSource } from '../no_data_source';

interface DataSourceViewProps {
  fullWidth: boolean;
  selectedOption: DataSourceOption[];
  savedObjectsClient?: SavedObjectsClientContract;
  notifications?: ToastsStart;
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
      showEmptyState: !(this.props.selectedOption?.length ?? 0),
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
    if (!option.label) {
      try {
        const title = (await getDataSourceById(optionId, this.props.savedObjectsClient)).title;
        if (!title) {
          this.props.notifications.addWarning(
            i18n.translate('dataSource.fetchDataSourceError', {
              defaultMessage: `Data source with id ${optionId} is not available`,
            })
          );
        } else {
          if (!this._isMounted) return;
          this.setState({
            selectedOption: [{ id: optionId, label: title }],
          });
        }
      } catch (error) {
        this.props.notifications.addWarning(
          i18n.translate('dataSource.fetchDataSourceError', {
            defaultMessage: `Failed to fetch data source due to ${error}`,
          })
        );
      }
    }
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
    if (this.state.showEmptyState) {
      return <NoDataSource />;
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
