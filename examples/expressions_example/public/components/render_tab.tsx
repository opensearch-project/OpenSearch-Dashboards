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
  EuiText,
  EuiTitle,
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
      <EuiTitle size="s">
        <h3>
          <FormattedMessage
            id="expressionsExample.tab.demo2.title"
            defaultMessage="{name}"
            values={{ name: 'Using expressions to render content' }}
          />
        </h3>
      </EuiTitle>
      <EuiText>
        <p>
          <FormattedMessage
            id="expressionsExample.tab.demo2.description"
            defaultMessage="Lets render an avatar using the name we provide"
          />
        </p>
      </EuiText>
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
