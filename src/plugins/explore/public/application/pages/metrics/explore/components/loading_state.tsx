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

/**
 * @param error The failure, as text.
 * @param sourceLabel The name of the selected source type (what the source picker shows), if
 *   known; without one the text says "the data source".
 */
export function ErrorCallout({
  error,
  sourceLabel,
}: {
  error: string;
  sourceLabel?: string;
}): JSX.Element {
  const message = error.replace(/^Error:\s*/, '');
  const source = sourceLabel?.trim();
  return (
    <EuiEmptyPrompt
      iconType="alert"
      iconColor="danger"
      data-test-subj="metricsExploreErrorCallout"
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
            {source
              ? i18n.translate('explore.metricsExplore.errorBodyWithSource', {
                  defaultMessage:
                    'We encountered a problem fetching data from the {sourceLabel} data source. Check your connection and try again.',
                  values: { sourceLabel: source },
                })
              : i18n.translate('explore.metricsExplore.errorBodyGeneric', {
                  defaultMessage:
                    'We encountered a problem fetching data from the data source. Check your connection and try again.',
                })}
          </p>
          <p
            data-test-subj="metricsExploreErrorMessage"
            style={{ fontFamily: 'monospace', wordBreak: 'break-word' }}
          >
            {message}
          </p>
        </EuiText>
      }
    />
  );
}
