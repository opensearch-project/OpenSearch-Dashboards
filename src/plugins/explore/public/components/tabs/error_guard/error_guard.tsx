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
import { useCannotBuildTabQuery } from '../../../application/utils/hooks/use_cannot_build_tab_query';
import { EXPLORE_PATTERNS_TAB_ID } from '../../../../common';
import { PatternsErrorGuard } from './patterns_error_guard';

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
  const cannotBuildQuery = useCannotBuildTabQuery(registryTab);

  // No cache key means no recorded error to key off, so the patterns tab would
  // otherwise lose the empty state that lets the user pick a field.
  if (registryTab.id === EXPLORE_PATTERNS_TAB_ID && (error != null || cannotBuildQuery)) {
    return <PatternsErrorGuard registryTab={registryTab} />;
  }

  if (error == null) {
    return <EuiErrorBoundary>{children}</EuiErrorBoundary>;
  }

  return (
    <EuiErrorBoundary>
      <EuiFlexGroup direction="column" alignItems="center" className="exploreErrorGuard">
        <EuiIcon type="alert" size="xl" color="red" />
        <EuiTitle size="l">
          {/* Stable, user-facing headline. The raw backend reason (which can be a
              verbose engine exception, e.g. a java.sql.SQLException) is shown in
              the Details block below rather than as the title. */}
          <h1>{errorDefaultTitle}</h1>
        </EuiTitle>
        <div className="exploreErrorGuard__errorsSection">
          <ErrorCodeBlock
            title={detailsText}
            text={error.message.details || error.message.reason}
          />
          {error.message.type ? (
            <ErrorCodeBlock title={typeText} text={error.message.type} />
          ) : null}
        </div>
      </EuiFlexGroup>
    </EuiErrorBoundary>
  );
};
