/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';

import {
  EuiBadge,
  EuiSmallButton,
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiPopover,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

interface State {
  isPopoverOpen: boolean;
}

interface Props {
  options: Array<{
    text: string;
    description?: string;
    testSubj?: string;
    isBeta?: boolean;
    onClick: () => void;
  }>;
}

export class CreateButton extends Component<Props, State> {
  public state = {
    isPopoverOpen: false,
  };

  public render() {
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    const { options, children } = this.props;
    const { isPopoverOpen } = this.state;

    if (!options || !options.length) {
      return null;
    }

    if (options.length === 1) {
      return (
        <EuiSmallButton
          data-test-subj="createDatasetButton"
          fill={true}
          onClick={options[0].onClick}
          iconType="plus"
        >
          {children}
        </EuiSmallButton>
      );
    }

    const button = (
      <EuiButton
        data-test-subj="createDatasetButton"
        fill={true}
        size="s"
        iconType="arrowDown"
        iconSide="right"
        onClick={this.togglePopover}
      >
        {children}
      </EuiButton>
    );

    if (options.length > 1) {
      return (
        <EuiPopover
          id="singlePanel"
          button={button}
          isOpen={isPopoverOpen}
          closePopover={this.closePopover}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenuPanel
            size="s"
            items={options.map((option) => {
              return (
                <EuiContextMenuItem
                  key={option.text}
                  onClick={option.onClick}
                  data-test-subj={option.testSubj}
                >
                  <EuiDescriptionList style={{ whiteSpace: 'nowrap' }} compressed={true}>
                    <EuiDescriptionListTitle>
                      {option.text}
                      {option.isBeta ? <Fragment> {this.renderBetaBadge()}</Fragment> : null}
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {option.description}
                    </EuiDescriptionListDescription>
                  </EuiDescriptionList>
                </EuiContextMenuItem>
              );
            })}
          />
        </EuiPopover>
      );
    }
  }

  private togglePopover = () => {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen,
    });
  };

  private closePopover = () => {
    this.setState({
      isPopoverOpen: false,
    });
  };

  private renderBetaBadge = () => {
    return (
      <EuiBadge color="accent">
        <FormattedMessage
          id="datasetManagement.datasetList.createButton.betaLabel"
          defaultMessage="Beta"
        />
      </EuiBadge>
    );
  };
}
