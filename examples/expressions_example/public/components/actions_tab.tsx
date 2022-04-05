/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiCodeBlock, EuiFormLabel, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useCallback } from 'react';
import { ReactExpressionRenderer } from '../../../../src/plugins/expressions/public';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { ExpressionsExampleServices } from '../types';

export function ActionsTab() {
  const {
    services: { notifications },
  } = useOpenSearchDashboards<ExpressionsExampleServices>();
  const handleEvent = useCallback(
    ({ data }) => {
      notifications.toasts.addSuccess(data);
    },
    [notifications.toasts]
  );

  const expressionString = `quick-form label="Toast message" buttonLabel="Toast"`;

  return (
    <>
      <EuiSpacer />
      <EuiCallOut
        title={i18n.translate('expressionsExample.tab.demo3.title', {
          defaultMessage: 'Expression handlers',
        })}
        iconType="gear"
      >
        <FormattedMessage
          id="expressionsExample.tab.demo3.description"
          defaultMessage="Using expression handlers to trigger a toast"
        />
      </EuiCallOut>
      <EuiSpacer />
      <EuiFormLabel>
        <FormattedMessage
          id="expressionsExample.tab.demo3.expression"
          defaultMessage="Expression that we are running"
        />
      </EuiFormLabel>
      <EuiCodeBlock>{expressionString}</EuiCodeBlock>
      <EuiSpacer />
      <ReactExpressionRenderer expression={expressionString} onEvent={handleEvent} />
    </>
  );
}
