/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './error_guard.scss';

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiErrorBoundary, EuiFlexGroup, EuiIcon, EuiTitle } from '@elastic/eui';
import { ErrorCodeBlock } from './error_code_block';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { useTabError } from '../../../application/utils/hooks/use_tab_error';

const errorDefaultTitle = i18n.translate('explore.errorPanel.defaultTitle', {
  defaultMessage: 'An error occurred while executing the query',
});
const detailsText = i18n.translate('explore.errorPanel.details', {
  defaultMessage: 'Details',
});
const typeText = i18n.translate('explore.errorPanel.type', {
  defaultMessage: 'Type',
});

export interface ErrorGuardProps {
  registryTab: TabDefinition;
  children?: React.ReactNode;
}

export const ErrorGuard = ({ registryTab, children }: ErrorGuardProps): JSX.Element | null => {
  const error = useTabError(registryTab);

  if (error == null) {
    return <EuiErrorBoundary>{children}</EuiErrorBoundary>;
  }

  return (
    <EuiErrorBoundary>
      <EuiFlexGroup direction="column" alignItems="center" className="exploreErrorGuard">
        <EuiIcon type="alert" size="xl" color="red" />
        <EuiTitle size="l">
          <h1>{error.message.reason || errorDefaultTitle}</h1>
        </EuiTitle>
        <div className="exploreErrorPanel__errorsSection">
          <ErrorCodeBlock title={detailsText} text={error.message.details} />
          {error.message.type ? (
            <ErrorCodeBlock title={typeText} text={error.message.type} />
          ) : null}
        </div>
      </EuiFlexGroup>
    </EuiErrorBoundary>
  );
};
