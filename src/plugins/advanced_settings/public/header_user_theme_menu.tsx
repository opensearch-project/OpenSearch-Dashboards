/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, SyntheticEvent, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiCompressedSelect,
  EuiToolTip,
  EuiButtonIcon,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { themeVersionLabelMap, themeVersionValueMap } from '@osd/ui-shared-deps/theme_config';
import { useOpenSearchDashboards, useUiSetting$ } from '../../opensearch_dashboards_react/public';

export const HeaderUserThemeMenu = () => {
  const {
    services: { uiSettings },
  } = useOpenSearchDashboards<CoreStart>();
  const themeOptions = Object.keys(themeVersionLabelMap).map((v) => ({
    value: v,
    text: themeVersionLabelMap[v],
  }));
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
  const defaultTheme = uiSettings.getDefault('theme:version');
  const defaultScreenMode = uiSettings.getDefault('theme:darkMode');
  const prefersAutomatic =
    (window.localStorage.getItem('useBrowserColorScheme') && window.matchMedia) || false;
  const [darkMode, setDarkMode] = useUiSetting$<boolean>('theme:darkMode');
  const [themeVersion, setThemeVersion] = useUiSetting$<string>('theme:version');
  const [isPopoverOpen, setPopover] = useState(false);
  // TODO: improve naming?
  const [theme, setTheme] = useState(
    themeOptions.find((t) => t.value === themeVersionValueMap[themeVersion])?.value ||
      themeVersionValueMap[defaultTheme]
  );
  const [screenMode, setScreenMode] = useState(
    prefersAutomatic
      ? screenModeOptions[2].value
      : darkMode
      ? screenModeOptions[1].value
      : screenModeOptions[0].value
  );

  const useLegacyAppearance = !uiSettings.get('home:useNewHomePage');

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
    const actions = [setThemeVersion(themeOptions.find((t) => theme === t.value)?.value ?? '')];

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

  const innerButton = useLegacyAppearance ? (
    <EuiHeaderSectionItemButton
      aria-expanded="false"
      aria-haspopup="true"
      aria-label={i18n.translate('advancedSettings.headerGlobalNav.themeMenuButtonAriaLabel', {
        defaultMessage: 'Appearance menu',
      })}
      onClick={onButtonClick}
    >
      <EuiIcon type="color" size="m" />
    </EuiHeaderSectionItemButton>
  ) : (
    <EuiButtonIcon
      iconType="color"
      color="primary"
      size="xs"
      aria-expanded="false"
      aria-haspopup="true"
      aria-label={i18n.translate('advancedSettings.headerGlobalNav.themeMenuButtonAriaLabel', {
        defaultMessage: 'Appearance menu',
      })}
      onClick={onButtonClick}
    />
  );

  const button = (
    <EuiToolTip
      content={i18n.translate('advancedSettings.headerGlobalNav.themeMenuButtonTitle', {
        defaultMessage: 'Appearance',
      })}
      delay="long"
      position="bottom"
    >
      {innerButton}
    </EuiToolTip>
  );

  // TODO: make i18n, check all translation ids
  // TODO: fix focus behavior
  const appearanceContent = (
    <div style={{ maxWidth: 300 }}>
      <EuiCompressedFormRow label="Theme version" helpText={`Default: ${defaultTheme}`}>
        <EuiCompressedSelect options={themeOptions} value={theme} onChange={onThemeChange} />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label="Screen mode"
        helpText={`Default: ${
          screenModeOptions.find((t) => {
            const defaultValue = defaultScreenMode ? 'dark' : 'light';
            return defaultValue === t.value;
          })?.text
        }`}
      >
        <EuiCompressedSelect
          options={screenModeOptions}
          value={screenMode}
          onChange={onScreenModeChange}
        />
      </EuiCompressedFormRow>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCompressedFormRow hasEmptyLabelSpace>
            <EuiLink
              target="_blank"
              href="https://forum.opensearch.org/t/feedback-on-dark-mode-experience/15725"
            >
              Theme feedback
            </EuiLink>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow hasEmptyLabelSpace>
            {/* TODO: disable submit until changes */}
            <EuiSmallButton onClick={onAppearanceSubmit} type="submit">
              Apply
            </EuiSmallButton>
          </EuiCompressedFormRow>
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
      anchorPosition={useLegacyAppearance ? 'downLeft' : 'rightDown'}
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
