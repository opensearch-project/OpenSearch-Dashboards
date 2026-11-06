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
 * @param fromServer Whether the server wrote the text: it then says what went wrong and what to
 *   do, so a short lead naming the source replaces the generic "Check your connection" sentence.
 */
export function ErrorCallout({
  error,
  sourceLabel,
  fromServer = false,
}: {
  error: string;
  sourceLabel?: string;
  fromServer?: boolean;
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
          {fromServer ? (
            <p>
              {source
                ? i18n.translate('explore.metricsExplore.serverErrorLeadWithSource', {
                    defaultMessage: 'The {sourceLabel} data source returned an error:',
                    values: { sourceLabel: source },
                  })
                : i18n.translate('explore.metricsExplore.serverErrorLeadGeneric', {
                    defaultMessage: 'The data source returned an error:',
                  })}
            </p>
          ) : (
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
          )}
          <p
            data-test-subj="metricsExploreErrorMessage"
            // The server's own sentence reads as text; anything else (a status, a code) as code.
            style={
              fromServer
                ? { wordBreak: 'break-word' }
                : { fontFamily: 'monospace', wordBreak: 'break-word' }
            }
          >
            {message}
          </p>
        </EuiText>
      }
    />
  );
}
