/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCallOut,
  EuiDescriptionList,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiBasicTable,
  EuiText,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useMemo } from 'react';
import { ExpressionFunction } from '../../../../src/plugins/expressions';

interface Props {
  fn: ExpressionFunction;
}

export function ExplorerSection({ fn }: Props) {
  const argumentItems = useMemo(
    () =>
      Object.values(fn.args).map((arg) => ({
        name: arg.name,
        default: arg.default,
        types: String(arg.types),
        required: arg.required,
        help: arg.help,
      })),
    [fn]
  );

  return (
    <EuiPanel className="explorer_section">
      {/* arguments */}
      <EuiTitle size="xxs">
        <h3>
          <FormattedMessage
            id="expressionsExample.tab.explorer.section.arguments"
            defaultMessage="Arguments"
          />
        </h3>
      </EuiTitle>
      <EuiBasicTable
        compressed
        columns={[
          {
            field: 'name',
            name: 'Name',
            truncateText: true,
          },
          {
            field: 'default',
            name: 'Default',
          },
          {
            field: 'types',
            name: 'Types',
          },
          {
            field: 'required',
            name: 'Required',
          },
          {
            field: 'help',
            name: 'help',
          },
        ]}
        items={argumentItems}
      />
    </EuiPanel>
  );
}
