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
import { ApplicationStart } from 'opensearch-dashboards/public';
import type { DashboardProvider } from '../../../types';

const ManualCreateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2 6.66667C2 7.03487 2.29848 7.33333 2.66667 7.33333H8C8.3682 7.33333 8.66667 7.03487 8.66667 6.66667V2.66667C8.66667 2.29848 8.3682 2 8 2H2.66667C2.29848 2 2 2.29848 2 2.66667V6.66667ZM7.33333 13.3333C7.33333 13.7015 7.6318 14 8 14H13.3333C13.7015 14 14 13.7015 14 13.3333V9.33333C14 8.96513 13.7015 8.66667 13.3333 8.66667H8C7.6318 8.66667 7.33333 8.96513 7.33333 9.33333V13.3333ZM8.66667 10H12.6667V12.6667H8.66667V10ZM2 13.3333C2 13.7015 2.29848 14 2.66667 14H5.33333C5.70153 14 6 13.7015 6 13.3333V9.33333C6 8.96513 5.70153 8.66667 5.33333 8.66667H2.66667C2.29848 8.66667 2 8.96513 2 9.33333V13.3333ZM3.33333 12.6667V10H4.66667V12.6667H3.33333ZM3.33333 6V3.33333H7.33333V6H3.33333ZM13.3333 7.33333C13.7015 7.33333 14 7.03487 14 6.66667V2.66667C14 2.29848 13.7015 2 13.3333 2H10.6667C10.2985 2 10 2.29848 10 2.66667V6.66667C10 7.03487 10.2985 7.33333 10.6667 7.33333H13.3333ZM12.6667 6H11.3333V3.33333H12.6667V6Z"
      fill="#6F6F6F"
    />
  </svg>
);

const AIGenerateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.33329 2.95801C10.2308 2.95801 10.9583 2.23047 10.9583 1.33301H11.7083C11.7083 2.23047 12.4358 2.95801 13.3333 2.95801V3.70801C12.4358 3.70801 11.7083 4.43555 11.7083 5.33301H10.9583C10.9583 4.43555 10.2308 3.70801 9.33329 3.70801V2.95801ZM0.666626 7.33301C2.87577 7.33301 4.66663 5.54215 4.66663 3.33301H5.99996C5.99996 5.54215 7.79083 7.33301 9.99996 7.33301V8.66634C7.79083 8.66634 5.99996 10.4572 5.99996 12.6663H4.66663C4.66663 10.4572 2.87577 8.66634 0.666626 8.66634V7.33301ZM3.25063 7.99967C4.12474 8.48474 4.84825 9.20821 5.33329 10.0823C5.81834 9.20821 6.54185 8.48474 7.41596 7.99967C6.54185 7.51461 5.81834 6.79114 5.33329 5.91701C4.84825 6.79114 4.12474 7.51461 3.25063 7.99967ZM11.5 9.33301C11.5 10.5296 10.5299 11.4997 9.33329 11.4997V12.4997C10.5299 12.4997 11.5 13.4697 11.5 14.6663H12.5C12.5 13.4697 13.47 12.4997 14.6666 12.4997V11.4997C13.47 11.4997 12.5 10.5296 12.5 9.33301H11.5Z"
      fill="#6F6F6F"
    />
  </svg>
);

interface CreateButtonProps {
  dashboardProviders?: { [key: string]: DashboardProvider };
  core: ApplicationStart;
  text2dashEnabled?: boolean;
}

const CreateButton = ({ dashboardProviders = {}, core, text2dashEnabled }: CreateButtonProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const TEXT2DASH_APP_ID = 'text2dash';

  const onMenuButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const getPopupMenuItems = () => {
    const items: JSX.Element[] = [];

    const dashboardProvider = dashboardProviders.dashboard;
    if (dashboardProvider) {
      items.push(
        <EuiContextMenuItem
          key="manual-create"
          href={dashboardProvider.createUrl}
          data-test-subj="contextMenuItem-manual-create"
          icon={<ManualCreateIcon />}
        >
          <div style={{ paddingLeft: '8px' }}>
            <FormattedMessage
              id="dashboard.createButton.manualCreate"
              defaultMessage="Manual Create"
            />
          </div>
        </EuiContextMenuItem>
      );
    }

    if (text2dashEnabled) {
      items.push(
        <EuiContextMenuItem
          key="ai-generate"
          onClick={() => {
            const url = core.getUrlForApp(TEXT2DASH_APP_ID, { absolute: true });
            core.navigateToUrl(url);
            closePopover();
          }}
          data-test-subj="contextMenuItem-ai-generate"
          icon={<AIGenerateIcon />}
        >
          <div style={{ paddingLeft: '8px' }}>
            <FormattedMessage id="dashboard.createButton.aiGenerate" defaultMessage="AI generate" />
          </div>
        </EuiContextMenuItem>
      );
    }

    return items;
  };

  const renderCreateMenuDropDown = () => {
    const button = (
      <EuiSmallButton
        iconType="plus"
        onClick={onMenuButtonClick}
        fill
        data-test-subj="createMenuDropdown"
      >
        <FormattedMessage
          id="dashboard.listing.createMenuDropDownText"
          defaultMessage="Create Dashboard"
        />
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
          <div style={{ padding: '8px' }}>
            <EuiContextMenuPanel items={getPopupMenuItems()} size="s" />
          </div>
        </EuiPopover>
      </EuiFlexItem>
    );
  };

  const renderCreateSingleButton = () => {
    const provider: DashboardProvider = Object.values(dashboardProviders!)[0];
    return (
      <EuiFlexItem grow={false}>
        <EuiSmallButton
          href={provider.createUrl}
          data-test-subj="newItemButton"
          iconType="plus"
          fill
        >
          <FormattedMessage id="dashboard.listing.createSingleButtonText" defaultMessage="Create" />{' '}
          {provider.createLinkText}
        </EuiSmallButton>
      </EuiFlexItem>
    );
  };

  const renderMenu = () => {
    if (!dashboardProviders || Object.keys(dashboardProviders).length === 0) {
      return null;
    }
    if (text2dashEnabled || Object.keys(dashboardProviders).length > 1) {
      return renderCreateMenuDropDown();
    }
    return renderCreateSingleButton();
  };

  return renderMenu();
};

export { CreateButton };
