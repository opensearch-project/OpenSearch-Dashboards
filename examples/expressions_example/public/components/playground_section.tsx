/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCodeBlock,
  EuiFormLabel,
  EuiSpacer,
  EuiCodeEditor,
  EuiPanel,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiTitle,
  EuiProgress,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useEffect, useState } from 'react';
import { ReactExpressionRenderer } from '../../../../src/plugins/expressions/public';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { ExpressionsExampleServices } from '../types';

interface Props {
  title: string;
  defaultInput?: string;
  defaultExpression: string;
  renderType?: boolean;
}

export function PlaygroundSection({
  title,
  defaultExpression,
  defaultInput = '10',
  renderType = false,
}: Props) {
  const {
    services: { expressions },
  } = useOpenSearchDashboards<ExpressionsExampleServices>();
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(defaultInput);
  const [expression, setExpression] = useState(defaultExpression);
  const [result, setResult] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (renderType) return;

    try {
      setLoading(true);
      const execution = expressions.execute(expression, input);
      execution.getData().then((data: any) => {
        if (!isMounted) return;

        const value =
          data?.type === 'error'
            ? `Error: ${data?.error?.message ?? 'Something went wrong'}`
            : data;

        setLoading(false);
        setResult(String(value));
      });
    } catch (error) {
      setLoading(false);
      setResult(String(error));
    }

    return () => {
      isMounted = false;
    };
  }, [expressions, input, expression, renderType]);

  return (
    <>
      <EuiPanel>
        <EuiTitle size="s">
          <h3>{title}</h3>
        </EuiTitle>
        <EuiSpacer />
        {/* Rendered the input field only for non renderable expressions */}
        {!renderType && (
          <>
            <EuiForm>
              <EuiFormRow
                label={i18n.translate('expressionsExample.tab.demo4.input', {
                  defaultMessage: 'Expression Input',
                })}
              >
                <EuiFieldText value={input} onChange={(e) => setInput(e.target.value)} />
              </EuiFormRow>
            </EuiForm>
            <EuiSpacer />
          </>
        )}
        <EuiFormLabel>
          <FormattedMessage
            id="expressionsExample.tab.demo4.expression"
            defaultMessage="Expression that we are running"
          />
        </EuiFormLabel>
        <EuiCodeEditor
          width="100%"
          height="100px"
          value={expression}
          onChange={(value) => setExpression(value)}
        />
        <EuiSpacer />
        <EuiFormLabel>
          <FormattedMessage
            id="expressionsExample.tab.demo4.result"
            defaultMessage="Expression Result"
          />
        </EuiFormLabel>
        {renderType ? (
          <ReactExpressionRenderer expression={expression} />
        ) : (
          <EuiCodeBlock>
            {loading && <EuiProgress size="xs" color="accent" position="absolute" />}
            {result}
          </EuiCodeBlock>
        )}
      </EuiPanel>
    </>
  );
}
