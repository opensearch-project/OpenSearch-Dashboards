/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiCodeBlock } from '@elastic/eui';
import { formatMsg, formatStack } from '../../../../../opensearch_dashboards_legacy/public';

interface Props {
  error: Error | string;
}

export function DocViewerError({ error }: Props) {
  const errMsg = formatMsg(error);
  const errStack = typeof error === 'object' ? formatStack(error) : '';

  return (
    <EuiCallOut title={errMsg} color="danger" iconType="cross" data-test-subj="docViewerError">
      {errStack && <EuiCodeBlock>{errStack}</EuiCodeBlock>}
    </EuiCallOut>
  );
}
