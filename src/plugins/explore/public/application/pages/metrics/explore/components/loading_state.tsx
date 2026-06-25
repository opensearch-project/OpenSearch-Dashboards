/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiLoadingChart, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export function LoadingIndicator(): JSX.Element {
  return (
    <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: 300 }}>
      <EuiFlexItem grow={false}>
        <EuiLoadingChart size="xl" />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

export function ErrorCallout({ error }: { error: string }): JSX.Element {
  const message = error.replace(/^Error:\s*/, '');
  return (
    <EuiEmptyPrompt
      iconType="alert"
      iconColor="danger"
      title={
        <h2>
          {i18n.translate('explore.metricsExplore.unableToLoadMetrics', {
            defaultMessage: 'Unable to load metrics',
          })}
        </h2>
      }
      body={
        <EuiText size="s" color="subdued">
          <p>
            {i18n.translate('explore.metricsExplore.errorBody', {
              defaultMessage:
                'We encountered a problem fetching data from the Prometheus data source. Check your connection and try again.',
            })}
          </p>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>{message}</p>
        </EuiText>
      }
    />
  );
}
