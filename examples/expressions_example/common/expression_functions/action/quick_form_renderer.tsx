/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { EuiForm, EuiFormRow, EuiButton, EuiFieldText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { render, unmountComponentAtNode } from 'react-dom';
import { ExpressionRenderDefinition } from '../../../../../src/plugins/expressions/public';

export interface QuickFormRenderValue {
  label: string;
  buttonLabel: string;
}

export const quickFormRenderer: ExpressionRenderDefinition<QuickFormRenderValue> = {
  name: 'quick-form-renderer',
  displayName: i18n.translate('expressionsExample.form.render.help', {
    defaultMessage: 'Render a simple input form',
  }),
  reuseDomNode: true,
  render: (domNode, config, handlers) => {
    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    render(
      <QuickForm
        {...config}
        onSubmit={(value) =>
          handlers.event({
            data: value,
          })
        }
      />,
      domNode,
      handlers.done
    );
  },
};

interface QuickFormProps extends QuickFormRenderValue {
  onSubmit: Function;
}

const QuickForm = ({ onSubmit, buttonLabel, label }: QuickFormProps) => {
  const [value, setValue] = useState('');
  const handleClick = useCallback(() => {
    onSubmit(value);
  }, [onSubmit, value]);

  return (
    <EuiForm>
      <EuiFormRow label={label}>
        <EuiFieldText value={value} onChange={(e) => setValue(e.target.value)} />
      </EuiFormRow>
      <EuiButton onClick={handleClick}>{buttonLabel}</EuiButton>
    </EuiForm>
  );
};
