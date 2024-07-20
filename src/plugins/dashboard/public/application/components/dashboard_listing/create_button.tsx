/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiSmallButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexItem,
  EuiPopover,
} from '@elastic/eui';
import type { DashboardProvider } from '../../../types';

interface CreateButtonProps {
  dashboardProviders?: { [key: string]: DashboardProvider };
}

const CreateButton = (props: CreateButtonProps) => {
  const [isPopoverOpen, setPopover] = useState(false);

  const onMenuButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const getPopupMenuItems = () => {
    const providers = Object.values(props.dashboardProviders || {});
    return providers
      .sort((a: DashboardProvider, b: DashboardProvider) =>
        a.createSortText.localeCompare(b.createSortText)
      )
      .map((provider: DashboardProvider) => (
        <EuiContextMenuItem
          key={provider.savedObjectsType}
          href={provider.createUrl}
          data-test-subj={`contextMenuItem-${provider.appId}`}
        >
          {provider.createLinkText}
        </EuiContextMenuItem>
      ));
  };

  const renderCreateMenuDropDown = () => {
    const button = (
      <EuiSmallButton
        iconType="arrowDown"
        iconSide="right"
        onClick={onMenuButtonClick}
        fill
        data-test-subj="createMenuDropdown"
      >
        <FormattedMessage id="dashboard.listing.createButtonText" defaultMessage="Create" />
      </EuiSmallButton>
    );

    return (
      <EuiFlexItem grow={false}>
        <EuiPopover
          id="createMenuPopover"
          button={button}
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
          anchorPosition="downRight"
        >
          <EuiContextMenuPanel items={getPopupMenuItems()} size="s" />
        </EuiPopover>
      </EuiFlexItem>
    );
  };

  const renderCreateSingleButton = () => {
    const provider: DashboardProvider = Object.values(props.dashboardProviders!)[0];
    return (
      <EuiFlexItem grow={false}>
        <EuiSmallButton
          href={provider.createUrl}
          data-test-subj="newItemButton"
          iconType="plus"
          fill
        >
          <FormattedMessage id="dashboard.listing.createButtonText" defaultMessage="Create" />
          &nbsp;{provider.createLinkText}
        </EuiSmallButton>
      </EuiFlexItem>
    );
  };

  const renderMenu = () => {
    if (!props.dashboardProviders || Object.keys(props.dashboardProviders!).length === 0) {
      return null;
    } else if (Object.keys(props.dashboardProviders!).length === 1) {
      return renderCreateSingleButton();
    } else {
      return renderCreateMenuDropDown();
    }
  };

  return renderMenu();
};

export { CreateButton };
