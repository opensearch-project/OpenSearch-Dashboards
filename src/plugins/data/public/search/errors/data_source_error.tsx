/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';
import { EuiText, EuiCodeBlock } from '@elastic/eui';
import { OsdError } from '../../../../opensearch_dashboards_utils/common';
import { OpenSearchError, isOpenSearchError } from './types';
import { isPainlessError } from './painless_error';

// The reason addError/HttpFetchError.message never reach is nested in the error body.
export function getDataSourceErrorReason(err: OpenSearchError): string | undefined {
  const error = err.body?.attributes?.error;
  if (!error) return undefined;

  const failedShardReason =
    error.failed_shards?.[0]?.reason?.reason ?? error.caused_by?.failed_shards?.[0]?.reason?.reason;

  return failedShardReason ?? error.root_cause?.[0]?.reason ?? error.reason;
}

// A structured OpenSearch search error that is not a Painless error; surfaces the
// extracted reason as the toast body instead of the bare HTTP status line.
export class DataSourceError extends OsdError {
  reason?: string;

  constructor(err: OpenSearchError) {
    const reason = getDataSourceErrorReason(err);

    super(
      reason ??
        i18n.translate('data.dataSourceError.unknownRootCause', {
          defaultMessage: 'The search request failed. See the browser console for details.',
        })
    );

    this.reason = reason;
    this.name = 'DataSourceError';
  }

  public getErrorMessage() {
    return (
      <EuiText>
        <EuiCodeBlock data-test-subj="dataSourceErrorReason" isCopyable={true} paddingSize="s">
          {this.message}
        </EuiCodeBlock>
      </EuiText>
    );
  }
}

// Excludes Painless errors so this stays mutually exclusive with isPainlessError.
export function isDataSourceError(err: Error | OpenSearchError): boolean {
  if (!isOpenSearchError(err)) return false;
  if (isPainlessError(err)) return false;
  return getDataSourceErrorReason(err as OpenSearchError) !== undefined;
}
