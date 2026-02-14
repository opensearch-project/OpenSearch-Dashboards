/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { EuiButtonIcon, EuiContextMenu, EuiPopover, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { Observable } from 'rxjs';
import { DEFAULT_NAV_GROUPS, NavGroupItemInMap } from '../../../../core/public';
import { AppearanceSettingsContent } from './appearance_settings_content';

export function SettingsIcon({ core }: { core: CoreStart }) {
  const [isPopoverOpen, setPopover] = useState(false);
  const navGroupsMapRef = useRef<Observable<Record<string, NavGroupItemInMap>>>(
    core.chrome.navGroup.getNavGroupsMap$()
  );
  const navGroupMap = useObservable(navGroupsMapRef.current, undefined);
  const enableUserControl = core.uiSettings.get('theme:enableUserControl');

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

  const handleAppearanceApply = () => {
    setPopover(false);
  };

  const mainPanelItems: Array<{
    name: string;
    key: string;
    onClick?: () => void;
    icon?: string;
    panel?: number;
  }> = [
    {
      name: DEFAULT_NAV_GROUPS.settingsAndSetup.title,
      key: DEFAULT_NAV_GROUPS.settingsAndSetup.id,
      onClick: () => onItemClick(DEFAULT_NAV_GROUPS.settingsAndSetup.id),
    },
    {
      name: DEFAULT_NAV_GROUPS.dataAdministration.title,
      key: DEFAULT_NAV_GROUPS.dataAdministration.id,
      onClick: () => onItemClick(DEFAULT_NAV_GROUPS.dataAdministration.id),
    },
  ];

  if (enableUserControl) {
    mainPanelItems.push({
      name: i18n.translate('management.settings.appearances.title', {
        defaultMessage: 'Appearances',
      }),
      key: 'appearances',
      panel: 1,
    });
  }

  const panels = [
    {
      id: 0,
      items: mainPanelItems,
    },
    {
      id: 1,
      title: i18n.translate('management.settings.appearances.title', {
        defaultMessage: 'Appearances',
      }),
      content: <AppearanceSettingsContent core={core} onApply={handleAppearanceApply} />,
    },
  ];

  return (
    <EuiPopover
      id="popoverForSettingsIcon"
      button={
        <EuiToolTip
          content={i18n.translate('management.settings.icon.nav.title', {
            defaultMessage: 'Settings',
          })}
        >
          <EuiButtonIcon
            aria-label="show-apps"
            iconType="managementApp"
            onClick={() => setPopover(true)}
            color="text"
          />
        </EuiToolTip>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      ownFocus={false}
      panelPaddingSize="none"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
}
