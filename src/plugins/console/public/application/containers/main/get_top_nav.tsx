/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { EuiSmallButton, EuiSmallButtonEmpty, EuiSmallButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TopNavMenuItem } from '../../components';
import { MenuItemPosition } from '../../components/top_nav_menu';

interface Props {
  onClickHistory: () => void;
  onClickSettings: () => void;
  onClickHelp: () => void;
  onClickExport: () => void;
  onClickImport: () => void;
  useUpdatedUX?: boolean;
}

export function getTopNavConfig({
  onClickHistory,
  onClickSettings,
  onClickHelp,
  onClickExport,
  onClickImport,
  useUpdatedUX,
}: Props): TopNavMenuItem[] {
  const helpItem: TopNavMenuItem = {
    id: 'help',
    label: i18n.translate('console.topNav.helpTabLabel', {
      defaultMessage: 'Help',
    }),
    description: i18n.translate('console.topNav.helpTabDescription', {
      defaultMessage: 'Help',
    }),
    onClick: () => {
      onClickHelp();
    },
    testId: 'consoleHelpButton',
    render: (commonProps) => (
      <EuiToolTip
        content={i18n.translate('console.topNav.helpTabLabel', {
          defaultMessage: 'Help',
        })}
      >
        <EuiSmallButtonIcon iconType="questionInCircle" display="base" {...commonProps} />
      </EuiToolTip>
    ),
    position: MenuItemPosition.RIGHT,
  };
  const settingsItem = {
    id: 'settings',
    label: i18n.translate('console.topNav.settingsTabLabel', {
      defaultMessage: 'Settings',
    }),
    description: i18n.translate('console.topNav.settingsTabDescription', {
      defaultMessage: 'Settings',
    }),
    onClick: () => {
      onClickSettings();
    },
    testId: 'consoleSettingsButton',
    render: (commonProps) => (
      <EuiToolTip
        content={i18n.translate('console.topNav.settingsToolTipContent', {
          defaultMessage: 'Console settings',
        })}
      >
        <EuiSmallButtonIcon iconType="gear" display="base" {...commonProps} />
      </EuiToolTip>
    ),
    position: MenuItemPosition.RIGHT,
  };
  return [
    {
      id: 'history',
      label: i18n.translate('console.topNav.historyTabLabel', {
        defaultMessage: 'History',
      }),
      description: i18n.translate('console.topNav.historyTabDescription', {
        defaultMessage: 'History',
      }),
      onClick: () => {
        onClickHistory();
      },
      testId: 'consoleHistoryButton',
      render: (commonProps) => (
        <EuiSmallButtonEmpty {...commonProps} flush="both" iconType="arrowDown" iconSide="right">
          {i18n.translate('console.topNav.historyTabLabel', {
            defaultMessage: 'History',
          })}
        </EuiSmallButtonEmpty>
      ),
      position: MenuItemPosition.LEFT,
    },
    ...(useUpdatedUX ? [helpItem, settingsItem] : [settingsItem, helpItem]),
    {
      id: 'export',
      label: i18n.translate('console.topNav.exportTabLabel', {
        defaultMessage: 'Export',
      }),
      description: i18n.translate('console.topNav.exportTabDescription', {
        defaultMessage: 'Export',
      }),
      onClick: () => {
        onClickExport();
      },
      testId: 'consoleExportButton',
      render: (commonProps) => (
        <EuiSmallButton minWidth="unset" {...commonProps}>
          {i18n.translate('console.topNav.exportTabLabel', {
            defaultMessage: 'Export',
          })}
        </EuiSmallButton>
      ),
      position: MenuItemPosition.RIGHT,
    },
    {
      id: 'import',
      label: i18n.translate('console.topNav.importTabLabel', {
        defaultMessage: 'Import',
      }),
      description: i18n.translate('console.topNav.importTabDescription', {
        defaultMessage: 'Import',
      }),
      onClick: () => {
        onClickImport();
      },
      testId: 'consoleImportButton',
      render: (commonProps) => (
        <EuiSmallButton minWidth="unset" fill {...commonProps}>
          {i18n.translate('console.topNav.importButtonLabel', {
            defaultMessage: 'Import query',
          })}
        </EuiSmallButton>
      ),
      position: MenuItemPosition.RIGHT,
    },
  ];
}
