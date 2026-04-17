/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { UiSettingScope } from '../../../core/public';
import { useOpenSearchDashboards } from '../../opensearch_dashboards_react/public';
import sunIconUrl from './sun_icon.svg';
import moonIconUrl from './moon_icon.svg';

export function ThemeToggleIcon() {
  const { services } = useOpenSearchDashboards();
  const isDarkMode = services.uiSettings!.get<boolean>('theme:darkMode');

  const label = isDarkMode
    ? i18n.translate('advancedSettings.themeToggle.switchToLight', {
        defaultMessage: 'Switch to light mode',
      })
    : i18n.translate('advancedSettings.themeToggle.switchToDark', {
        defaultMessage: 'Switch to dark mode',
      });

  const handleToggle = useCallback(async () => {
    await services.uiSettings!.set('theme:darkMode', !isDarkMode, UiSettingScope.GLOBAL);
    window.location.reload();
  }, [isDarkMode, services.uiSettings]);

  return (
    <EuiToolTip content={label} position="right">
      <EuiButtonIcon
        aria-label={label}
        iconType={isDarkMode ? sunIconUrl : moonIconUrl}
        onClick={handleToggle}
        color="text"
        data-test-subj="themeToggleIcon"
      />
    </EuiToolTip>
  );
}
