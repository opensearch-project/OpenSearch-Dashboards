/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonIcon, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { DEFAULT_NAV_GROUPS } from '../../../../core/public';

export function SettingsIcon({ core }: { core: CoreStart }) {
  const [isPopoverOpen, setPopover] = useState(false);
  const items = [
    <EuiContextMenuItem
      key={DEFAULT_NAV_GROUPS.settingsAndSetup.id}
      onClick={() => {
        setPopover(false);
      }}
    >
      {DEFAULT_NAV_GROUPS.settingsAndSetup.title}
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key={DEFAULT_NAV_GROUPS.dataAdministration.id}
      onClick={() => {
        setPopover(false);
      }}
    >
      {DEFAULT_NAV_GROUPS.dataAdministration.title}
    </EuiContextMenuItem>,
  ];

  return (
    <EuiPopover
      id="popoverForSettingsIcon"
      button={<EuiButtonIcon iconType="managementApp" onClick={() => setPopover(true)} />}
      isOpen={isPopoverOpen}
    >
      <EuiContextMenuPanel size="s" items={items} />
    </EuiPopover>
  );
}
