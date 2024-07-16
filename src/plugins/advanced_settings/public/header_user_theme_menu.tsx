/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, SyntheticEvent, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelect,
  EuiSpacer,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards, useUiSetting$ } from '../../opensearch_dashboards_react/public';

export const HeaderUserThemeMenu = () => {
  const {
    services: {
      http: { basePath },
      uiSettings,
    },
  } = useOpenSearchDashboards<CoreStart>();
  // TODO: move to central location?
  const themeOptions = [
    {
      value: 'v7',
      text: 'v7',
    },
    {
      value: 'next',
      text: 'Next (preview)',
    },
  ];
  const screenModeOptions = [
    {
      value: 'light',
      text: 'Light mode',
    },
    {
      value: 'dark',
      text: 'Dark mode',
    },
    {
      value: 'automatic',
      text: 'Use browser settings',
    },
  ];
  const prefersAutomatic =
    (window.localStorage.getItem('useBrowserColorScheme') && window.matchMedia) || false;
  const [darkMode, setDarkMode] = useUiSetting$<boolean>('theme:darkMode');
  const [themeVersion, setThemeVersion] = useUiSetting$<string>('theme:version');
  const [isPopoverOpen, setPopover] = useState(false);
  // TODO: improve naming?
  const [theme, setTheme] = useState(themeOptions.find((t) => t.text === themeVersion)?.value);
  const [screenMode, setScreenMode] = useState(
    prefersAutomatic
      ? screenModeOptions[2].value
      : darkMode
      ? screenModeOptions[1].value
      : screenModeOptions[0].value
  );
  const allSettings = uiSettings.getAll();
  const defaultTheme = allSettings['theme:version'].value;
  const defaultScreenMode = allSettings['theme:darkMode'].value;

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const onThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };

  const onScreenModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setScreenMode(e.target.value);
  };

  const onAppearanceSubmit = async (e: SyntheticEvent) => {
    const actions = [setThemeVersion(themeOptions.find((t) => theme === t.value)?.text ?? '')];

    if (screenMode === 'automatic') {
      const browserMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      window.localStorage.setItem('useBrowserColorScheme', 'true');

      if (browserMode !== darkMode) {
        actions.push(setDarkMode(browserMode));
      }
    } else if ((screenMode === 'dark') !== darkMode) {
      actions.push(setDarkMode(screenMode === 'dark'));
      window.localStorage.removeItem('useBrowserColorScheme');
    } else {
      window.localStorage.removeItem('useBrowserColorScheme');
    }
    // TODO: only set changed
    await await Promise.all([actions]);
    window.location.reload();
  };

  const closePopover = () => {
    setPopover(false);
  };

  const button = (
    <EuiHeaderSectionItemButton
      aria-expanded="false"
      aria-haspopup="true"
      aria-label={i18n.translate('advancedSettings.headerGlobalNav.themeMenuButtonAriaLabel', {
        defaultMessage: 'Appearance menu',
      })}
      onClick={onButtonClick}
    >
      <EuiIcon
        type="color"
        size="m"
        title={i18n.translate('advancedSettings.headerGlobalNav.themeMenuButtonTitle', {
          defaultMessage: 'Appearance',
        })}
      />
    </EuiHeaderSectionItemButton>
  );

  // TODO: make i18n, check all translation ids
  // TODO: fix focus behavior
  const appearanceContent = (
    <div style={{ maxWidth: 300 }}>
      <EuiFormRow label="Theme version" helpText={`Default: ${defaultTheme}`}>
        <EuiSelect options={themeOptions} value={theme} onChange={onThemeChange} />
      </EuiFormRow>
      <EuiFormRow
        label="Screen mode"
        helpText={`Default: ${
          screenModeOptions.find((t) => {
            const defaultValue = defaultScreenMode ? 'dark' : 'light';
            return defaultValue === t.value;
          })?.text
        }`}
      >
        <EuiSelect options={screenModeOptions} value={screenMode} onChange={onScreenModeChange} />
      </EuiFormRow>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiLink
              target="_blank"
              href="https://forum.opensearch.org/t/feedback-on-dark-mode-experience/15725"
            >
              Theme feedback
            </EuiLink>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFormRow hasEmptyLabelSpace>
            {/* TODO: disable submit until changes */}
            <EuiButton fill onClick={onAppearanceSubmit} type="submit">
              Apply
            </EuiButton>
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );

  return (
    <EuiPopover
      id="headerUserThemeContextMenu"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      panelPaddingSize="s"
    >
      <EuiPopoverTitle>
        <h2>
          <FormattedMessage
            id="advancedSettings.headerGlobalNav.appearanceMenuTitle"
            defaultMessage="Appearance"
          />
        </h2>
      </EuiPopoverTitle>
      {appearanceContent}
    </EuiPopover>
  );
};
