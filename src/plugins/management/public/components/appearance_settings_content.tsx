/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, SyntheticEvent, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiLink,
  EuiCompressedSelect,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { themeVersionLabelMap, themeVersionValueMap } from '@osd/ui-shared-deps/theme_config';

interface AppearanceSettingsContentProps {
  core: CoreStart;
  onApply?: () => void;
}

export const AppearanceSettingsContent = ({ core, onApply }: AppearanceSettingsContentProps) => {
  const { uiSettings } = core;
  
  const themeVersionOptions = Object.keys(themeVersionLabelMap).map((v) => ({
    value: v,
    text: themeVersionLabelMap[v],
  }));
  
  const colorModeOptions = [
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
  
  const defaultThemeVersion = uiSettings.getDefault('theme:version');
  const defaultIsDarkMode = uiSettings.getDefault('theme:darkMode');
  const isUsingBrowserColorScheme =
    (window.localStorage.getItem('useBrowserColorScheme') && window.matchMedia) || false;
  const isDarkMode = uiSettings.get<boolean>('theme:darkMode');
  const themeVersion = uiSettings.get<string>('theme:version');
  
  // Check if settings are overridden by server
  const isThemeVersionOverridden = uiSettings.isOverridden('theme:version');
  const isDarkModeOverridden = uiSettings.isOverridden('theme:darkMode');

  const [selectedThemeVersion, setSelectedThemeVersion] = useState(
    themeVersionOptions.find((t) => t.value === themeVersionValueMap[themeVersion])?.value ||
      themeVersionValueMap[defaultThemeVersion]
  );
  
  const [selectedColorMode, setSelectedColorMode] = useState(
    isUsingBrowserColorScheme
      ? colorModeOptions[2].value
      : isDarkMode
      ? colorModeOptions[1].value
      : colorModeOptions[0].value
  );

  const handleThemeVersionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedThemeVersion(e.target.value);
  };

  const handleColorModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedColorMode(e.target.value);
  };

  const applyAppearanceSettings = async (e: SyntheticEvent) => {
    e.preventDefault();
    
    const pendingActions = [];

    // Only update theme version if not overridden
    if (!isThemeVersionOverridden) {
      pendingActions.push(
        uiSettings.set(
          'theme:version',
          themeVersionOptions.find((t) => selectedThemeVersion === t.value)?.value ?? ''
        )
      );
    }

    // Only update dark mode if not overridden
    if (!isDarkModeOverridden) {
      if (selectedColorMode === 'automatic') {
        const systemPrefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        window.localStorage.setItem('useBrowserColorScheme', 'true');

        if (systemPrefersDarkMode !== isDarkMode) {
          pendingActions.push(uiSettings.set('theme:darkMode', systemPrefersDarkMode));
        }
      } else if ((selectedColorMode === 'dark') !== isDarkMode) {
        pendingActions.push(uiSettings.set('theme:darkMode', selectedColorMode === 'dark'));
        window.localStorage.removeItem('useBrowserColorScheme');
      } else {
        window.localStorage.removeItem('useBrowserColorScheme');
      }
    }
    
    if (pendingActions.length > 0) {
      await Promise.all(pendingActions);
      
      if (onApply) {
        onApply();
      }
      
      window.location.reload();
    } else {
      // If no changes to apply, just close the popover
      if (onApply) {
        onApply();
      }
    }
  };

  return (
    <div style={{ maxWidth: 300, padding: '8px' }}>
      <EuiCompressedFormRow
        label={i18n.translate('management.settings.appearances.themeVersion', {
          defaultMessage: 'Theme version',
        })}
        helpText={
          isThemeVersionOverridden
            ? i18n.translate('management.settings.appearances.themeVersionOverridden', {
                defaultMessage: 'This setting is overridden by the server',
              })
            : i18n.translate('management.settings.appearances.themeVersionHelp', {
                defaultMessage: 'Default: {defaultVersion}',
                values: { defaultVersion: defaultThemeVersion },
              })
        }
      >
        <EuiCompressedSelect
          options={themeVersionOptions}
          value={selectedThemeVersion}
          onChange={handleThemeVersionChange}
          disabled={isThemeVersionOverridden}
        />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={i18n.translate('management.settings.appearances.screenMode', {
          defaultMessage: 'Screen mode',
        })}
        helpText={
          isDarkModeOverridden
            ? i18n.translate('management.settings.appearances.screenModeOverridden', {
                defaultMessage: 'This setting is overridden by the server',
              })
            : i18n.translate('management.settings.appearances.screenModeHelp', {
                defaultMessage: 'Default: {defaultMode}',
                values: {
                  defaultMode: colorModeOptions.find((t) => {
                    const defaultValue = defaultIsDarkMode ? 'dark' : 'light';
                    return defaultValue === t.value;
                  })?.text,
                },
              })
        }
      >
        <EuiCompressedSelect
          options={colorModeOptions}
          value={selectedColorMode}
          onChange={handleColorModeChange}
          disabled={isDarkModeOverridden}
        />
      </EuiCompressedFormRow>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCompressedFormRow hasEmptyLabelSpace>
            <EuiLink
              target="_blank"
              href="https://forum.opensearch.org/t/feedback-on-dark-mode-experience/15725"
            >
              {i18n.translate('management.settings.appearances.feedback', {
                defaultMessage: 'Theme feedback',
              })}
            </EuiLink>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow hasEmptyLabelSpace>
            <EuiSmallButton
              onClick={applyAppearanceSettings}
              type="submit"
              disabled={isThemeVersionOverridden && isDarkModeOverridden}
            >
              {i18n.translate('management.settings.appearances.apply', {
                defaultMessage: 'Apply',
              })}
            </EuiSmallButton>
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
