/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCodeBlock,
  EuiFieldText,
  EuiForm,
  EuiFormLabel,
  EuiFormRow,
  EuiSpacer,
  EuiSelect,
  EuiCallOut,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { ReactExpressionRenderer } from '../../../../src/plugins/expressions/public';

export function RenderTab() {
  const [value, setValue] = useState('OpenSearch Dashboards');
  const [size, setSize] = useState('xl');
  const expressionString = `avatar name="${value}" size="${size}"`;

  return (
    <>
      <EuiSpacer />
      <EuiCallOut
        title={i18n.translate('expressionsExample.tab.demo2.title', {
          defaultMessage: 'Using expressions to render content',
        })}
        iconType="gear"
      >
        <FormattedMessage
          id="expressionsExample.tab.demo2.description"
          defaultMessage="Lets render an avatar using the arguments we provide"
        />
      </EuiCallOut>
      <EuiSpacer />
      <EuiForm>
        <EuiFormRow
          label={i18n.translate('expressionsExample.tab.demo2.name', {
            defaultMessage: 'Expression Argument (name)',
          })}
        >
          <EuiFieldText value={value} onChange={(e) => setValue(String(e.target.value))} />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('expressionsExample.tab.demo2.size', {
            defaultMessage: 'Expression Argument (size)',
          })}
        >
          <EuiSelect
            options={[
              {
                text: 'xl',
              },
              {
                text: 'l',
              },
              {
                text: 's',
              },
            ]}
            value={size}
            onChange={(e) => setSize(String(e.target.value))}
          />
        </EuiFormRow>
      </EuiForm>
      <EuiSpacer />
      <EuiFormLabel>
        <FormattedMessage
          id="expressionsExample.tab.demo2.expression"
          defaultMessage="Expression that we are running"
        />
      </EuiFormLabel>
      <EuiCodeBlock>{expressionString}</EuiCodeBlock>
      <EuiSpacer />
      <EuiFormLabel>
        <FormattedMessage
          id="expressionsExample.tab.demo2.result"
          defaultMessage="Rendered output"
        />
      </EuiFormLabel>
      <ReactExpressionRenderer expression={expressionString} />
    </>
  );
}
