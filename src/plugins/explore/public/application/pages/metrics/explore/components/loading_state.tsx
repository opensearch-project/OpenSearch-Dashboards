/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiLoadingChart } from '@elastic/eui';
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
  return (
    <EuiCallOut
      title={i18n.translate('explore.metricsExplore.errorTitle', { defaultMessage: 'Error' })}
      color="danger"
      iconType="alert"
    >
      {error}
    </EuiCallOut>
  );
}
