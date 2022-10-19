/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCodeBlock,
  EuiFieldNumber,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiStat,
  EuiFormLabel,
  EuiCallOut,
  EuiProgress,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useEffect, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { ExpressionsExampleServices } from '../types';

export function BasicTab() {
  const {
    services: { expressions },
  } = useOpenSearchDashboards<ExpressionsExampleServices>();
  const [input, setInput] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(
    i18n.translate('expressionsExample.tab.demo1.loading', {
      defaultMessage: 'Still sleeping',
    })
  );
  const expression = `sleep time=2000 | square`;

  useEffect(() => {
    let isMounted = true;

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
  }, [expressions, input, expression]);

  return (
    <>
      <EuiSpacer />
      <EuiCallOut
        title={i18n.translate('expressionsExample.tab.demo1.title', {
          defaultMessage: 'Running a simple expression',
        })}
        iconType="gear"
      >
        <FormattedMessage
          id="expressionsExample.tab.demo1.description"
          defaultMessage="Lets run a simple expression that squares a number we input after a delay of 2 seconds"
        />
      </EuiCallOut>
      <EuiSpacer />
      <EuiForm>
        <EuiFormRow
          label={i18n.translate('expressionsExample.tab.demo1.input', {
            defaultMessage: 'Expression Input',
          })}
        >
          <EuiFieldNumber value={input} onChange={(e) => setInput(Number(e.target.value))} />
        </EuiFormRow>
      </EuiForm>
      <EuiSpacer />
      <EuiFormLabel>
        <FormattedMessage
          id="expressionsExample.tab.demo1.expression"
          defaultMessage="Expression that we are running"
        />
      </EuiFormLabel>
      <EuiCodeBlock>
        {loading && <EuiProgress size="xs" color="accent" position="absolute" />}
        {expression}
      </EuiCodeBlock>
      <EuiSpacer />
      <EuiStat
        title={result}
        description={i18n.translate('expressionsExample.tab.demo1.result', {
          defaultMessage: 'Result',
        })}
      />
    </>
  );
}
