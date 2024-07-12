/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { EuiButtonIcon, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { Observable } from 'rxjs';
import { DEFAULT_NAV_GROUPS, NavGroupItemInMap } from '../../../../core/public';

export function SettingsIcon({ core }: { core: CoreStart }) {
  const [isPopoverOpen, setPopover] = useState(false);
  const navGroupsMapRef = useRef<Observable<Record<string, NavGroupItemInMap>>>(
    core.chrome.navGroup.getNavGroupsMap$()
  );
  const navGroupMap = useObservable(navGroupsMapRef.current, undefined);
  const onItemClick = (groupId: string) => {
    setPopover(false);
    core.chrome.navGroup.setCurrentNavGroup(groupId);
    if (navGroupMap) {
      const firstNavItem = navGroupMap[groupId]?.navLinks[0];
      if (firstNavItem?.id) {
        core.application.navigateToApp(firstNavItem.id);
      }
    }
  };
  const items = [
    <EuiContextMenuItem
      key={DEFAULT_NAV_GROUPS.settingsAndSetup.id}
      onClick={() => onItemClick(DEFAULT_NAV_GROUPS.settingsAndSetup.id)}
    >
      {DEFAULT_NAV_GROUPS.settingsAndSetup.title}
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key={DEFAULT_NAV_GROUPS.dataAdministration.id}
      onClick={() => onItemClick(DEFAULT_NAV_GROUPS.dataAdministration.id)}
    >
      {DEFAULT_NAV_GROUPS.dataAdministration.title}
    </EuiContextMenuItem>,
  ];

  return (
    <EuiPopover
      id="popoverForSettingsIcon"
      button={<EuiButtonIcon iconType="managementApp" onClick={() => setPopover(true)} />}
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      ownFocus={false}
    >
      <EuiContextMenuPanel hasFocus={false} size="s" items={items} />
    </EuiPopover>
  );
}
