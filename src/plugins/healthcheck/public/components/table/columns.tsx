/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTableProps, EuiButtonIcon, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TaskInfo } from '../../../../../core/common/healthcheck';
import { RESULT } from '../../constants';
import { BadgeResults } from '../utils/badge_results';

export const tableColumns = (
  openFlyout: (item?: TaskInfo | null) => void
): EuiBasicTableProps<TaskInfo>['columns'] => [
  {
    render: (item: TaskInfo) => (
      <EuiButtonIcon
        iconType="inspect"
        aria-label={i18n.translate(
          'healthcheck.statusPage.statusTable.columns.inspectButtonAriaLabel',
          { defaultMessage: 'Inspect' }
        )}
        onClick={() => openFlyout(item)}
      />
    ),
    width: '32px',
  },
  {
    field: 'name',
    name: i18n.translate('healthcheck.statusPage.statusTable.columns.nameHeader', {
      defaultMessage: 'Check',
    }),
    render: (name: string) => {
      const [type, check] = name.split(':');

      return (
        <EuiText>
          {type}:<strong>{check}</strong>
        </EuiText>
      );
    },
    width: '450px',
    truncateText: true,
  },
  {
    field: 'result',
    name: i18n.translate('healthcheck.statusPage.statusTable.columns.resultHeader', {
      defaultMessage: 'Result',
    }),
    width: '100px',
    render: (result: RESULT, item: TaskInfo) => (
      <BadgeResults result={result} isEnabled={item.enabled} />
    ),
  },
  {
    field: 'status',
    name: i18n.translate('healthcheck.statusPage.statusTable.columns.statusHeader', {
      defaultMessage: 'Status',
    }),
    width: '150px',
  },
];
