/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './error_guard.scss';

import React, { useState, useCallback, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiErrorBoundary,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiButtonEmpty,
  EuiButton,
  EuiIcon,
  EuiTitle,
} from '@elastic/eui';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ErrorCodeBlock } from './error_code_block';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { useTabError } from '../../../application/utils/hooks/use_tab_error';
import { EXPLORE_PATTERNS_TAB_ID } from '../../../../common';
import { PatternsErrorGuard } from './patterns_error_guard';
import { ExploreServices } from '../../../types';
import { selectQuery } from '../../../application/utils/state_management/selectors';

const errorDefaultTitle = i18n.translate('explore.errorPanel.enhancedDefaultTitle', {
  defaultMessage: 'Query execution failed',
});
const detailsText = i18n.translate('explore.errorPanel.enhancedDetails', {
  defaultMessage: 'Error details',
});
const typeText = i18n.translate('explore.errorPanel.enhancedType', {
  defaultMessage: 'Error type',
});
const technicalDetailsText = i18n.translate('explore.errorPanel.technicalDetails', {
  defaultMessage: 'Technical details',
});
const askAiButtonText = i18n.translate('explore.errorPanel.askAi', {
  defaultMessage: 'Ask AI for help',
});
const genericQueryError = i18n.translate('explore.errorPanel.genericQueryError', {
  defaultMessage: 'Query Error',
});
const whyFailedQuestion = i18n.translate('explore.errorPanel.askAiQuestion', {
  defaultMessage: 'Why did my query fail and how can I fix it?',
});
const failedToSendMessage = i18n.translate('explore.errorPanel.failedToSendMessage', {
  defaultMessage: 'Failed to send message to AI',
});

export interface ErrorGuardProps {
  registryTab: TabDefinition;
  children?: React.ReactNode;
}

export const ErrorGuard = ({ registryTab, children }: ErrorGuardProps): JSX.Element | null => {
  const error = useTabError(registryTab);
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector(selectQuery);

  const chatService = services.core?.chat;
  const isChatAvailable = chatService?.isAvailable() ?? false;

  const errorContextData = useMemo(
    () =>
      error
        ? {
            id: `query-error`,
            description: 'Failed query with error details from Explore',
            value: {
              query: query?.query,
              error: {
                ...(error.errorBody && { fullErrorBody: error.errorBody }),
              },
            },
            label: genericQueryError,
            categories: ['explore', 'error', 'dynamic'],
          }
        : null,
    [query, error]
  );

  // Hook must be called unconditionally
  const noopDynamicContext = useCallback(
    (_options: any, _shouldCleanup?: boolean): string => '',
    []
  );
  const useDynamicContext =
    services.contextProvider?.hooks?.useDynamicContext || noopDynamicContext;
  useDynamicContext(errorContextData, !error);

  const handleAskAi = useCallback(async () => {
    if (!chatService || !isChatAvailable) return;

    setIsAskingAi(true);
    try {
      await chatService.sendMessageWithWindow(whyFailedQuestion, []);
    } catch (err) {
      services.toastNotifications.addWarning({
        title: failedToSendMessage,
        text: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsAskingAi(false);
    }
  }, [chatService, isChatAvailable, services.toastNotifications]);

  if (error == null) {
    return <EuiErrorBoundary>{children}</EuiErrorBoundary>;
  }

  if (registryTab.id === EXPLORE_PATTERNS_TAB_ID) {
    return <PatternsErrorGuard registryTab={registryTab} />;
  }

  const errorSuggestion = error.errorBody?.error?.suggestion;
  const hasSuggestion = errorSuggestion && errorSuggestion.length > 0;

  const shouldShowDetails = error.message.details && error.message.details !== error.message.reason;

  return (
    <EuiErrorBoundary>
      <EuiFlexGroup
        direction="column"
        alignItems="center"
        className="exploreErrorGuard"
        gutterSize="l"
      >
        <EuiFlexItem grow={false} style={{ maxWidth: '800px', width: '100%' }}>
          <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
            <EuiFlexItem grow={false}>
              <EuiIcon type="alert" size="xl" color="danger" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle size="m">
                <h2>{error.message.reason || errorDefaultTitle}</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="l" />

          {shouldShowDetails && (
            <>
              <EuiText size="s" textAlign="center" color="subdued">
                <p>{error.message.details}</p>
              </EuiText>
              <EuiSpacer size="m" />
            </>
          )}

          {hasSuggestion && (
            <>
              <EuiText size="s" textAlign="center">
                <p>{errorSuggestion}</p>
              </EuiText>
              <EuiSpacer size="m" />
            </>
          )}

          {isChatAvailable && (
            <>
              <EuiFlexGroup justifyContent="center">
                <EuiFlexItem grow={false}>
                  <EuiButton
                    size="s"
                    iconType="generate"
                    onClick={handleAskAi}
                    isLoading={isAskingAi}
                    disabled={isAskingAi}
                  >
                    {askAiButtonText}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="m" />
            </>
          )}

          {(error.message.type || error.originalErrorMessage) && (
            <>
              <EuiFlexGroup justifyContent="center">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size="xs"
                    iconType={isTechnicalDetailsOpen ? 'arrowDown' : 'arrowRight'}
                    onClick={() => setIsTechnicalDetailsOpen(!isTechnicalDetailsOpen)}
                  >
                    {technicalDetailsText}
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
              {isTechnicalDetailsOpen && (
                <>
                  <EuiSpacer size="s" />
                  <div className="exploreErrorGuard__errorsSection">
                    {error.message.type && (
                      <ErrorCodeBlock title={typeText} text={error.message.type} />
                    )}
                    {error.originalErrorMessage &&
                      error.originalErrorMessage !== error.message.details && (
                        <ErrorCodeBlock title={detailsText} text={error.originalErrorMessage} />
                      )}
                  </div>
                </>
              )}
            </>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiErrorBoundary>
  );
};
