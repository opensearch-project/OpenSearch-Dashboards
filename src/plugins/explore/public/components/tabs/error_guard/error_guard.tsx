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
  EuiCallOut,
  EuiSpacer,
  EuiAccordion,
  EuiText,
  EuiBadge,
  EuiButtonEmpty,
  EuiButton,
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

const errorDefaultTitle = i18n.translate('explore.errorPanel.defaultTitle', {
  defaultMessage: 'Query execution failed',
});
const detailsText = i18n.translate('explore.errorPanel.details', {
  defaultMessage: 'Error details',
});
const typeText = i18n.translate('explore.errorPanel.type', {
  defaultMessage: 'Error type',
});
const technicalDetailsText = i18n.translate('explore.errorPanel.technicalDetails', {
  defaultMessage: 'Technical details',
});
const availableFieldsText = i18n.translate('explore.errorPanel.availableFields', {
  defaultMessage: 'Available fields',
});
const suggestedFieldsText = i18n.translate('explore.errorPanel.suggestedFields', {
  defaultMessage: 'Did you mean one of these fields?',
});
const errorSuggestionText = i18n.translate('explore.errorPanel.suggestion', {
  defaultMessage: 'Suggestion',
});
const askAiButtonText = i18n.translate('explore.errorPanel.askAi', {
  defaultMessage: 'Ask AI for help',
});

export interface ErrorGuardProps {
  registryTab: TabDefinition;
  children?: React.ReactNode;
}

export const ErrorGuard = ({ registryTab, children }: ErrorGuardProps): JSX.Element | null => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (React rules of hooks)
  const error = useTabError(registryTab);
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector(selectQuery);

  // Check if chat service is available
  const chatService = services.core?.chat;
  const isChatAvailable = chatService?.isAvailable() ?? false;

  // Prepare error context for AI (must be before early returns)
  const errorContextData = useMemo(
    () =>
      error
        ? {
            id: `query-error-${Date.now()}`,
            description: 'Failed query with error details from Explore',
            value: {
              query: query?.query,
              error: {
                reason: error.message.reason,
                details: error.message.details,
                type: error.message.type,
                ...(error.errorContext?.context && { context: error.errorContext.context }),
                ...(error.errorContext?.code && { code: error.errorContext.code }),
                ...(error.errorContext?.location && { location: error.errorContext.location }),
              },
            },
            label: 'Query Error',
            categories: ['explore', 'error', 'dynamic'],
          }
        : null,
    [query, error]
  );

  // Register dynamic context for AI (like AskAIActionItem pattern)
  // Hook must be called unconditionally - it will handle null/undefined gracefully
  const useDynamicContext =
    services.contextProvider?.hooks?.useDynamicContext ||
    ((_options: any, _shouldCleanup?: boolean): string => '');
  useDynamicContext(errorContextData, false);

  // Handle asking AI about the error
  const handleAskAi = useCallback(async () => {
    if (!chatService || !isChatAvailable) return;

    setIsAskingAi(true);
    try {
      // Pre-filled question about the error
      const question = 'Why did my query fail and how can I fix it?';
      await chatService.sendMessageWithWindow(question, []);
    } catch (err) {
      services.toastNotifications.addWarning({
        title: 'Failed to send message to AI',
        text: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsAskingAi(false);
    }
  }, [chatService, isChatAvailable, services.toastNotifications]);

  // Early returns AFTER all hooks
  if (error == null) {
    return <EuiErrorBoundary>{children}</EuiErrorBoundary>;
  }

  if (registryTab.id === EXPLORE_PATTERNS_TAB_ID) {
    return <PatternsErrorGuard registryTab={registryTab} />;
  }

  // Extract rich error context if available
  const availableFields = error.errorContext?.context?.available_fields;
  const requestedField = error.errorContext?.context?.requested_field;
  const errorSuggestion = error.errorBody?.error?.suggestion;
  const hasFieldSuggestions = availableFields && availableFields.length > 0;
  const hasSuggestion = errorSuggestion && errorSuggestion.length > 0;

  return (
    <EuiErrorBoundary>
      <EuiFlexGroup
        direction="column"
        alignItems="center"
        className="exploreErrorGuard"
        gutterSize="l"
      >
        <EuiFlexItem grow={false} style={{ maxWidth: '800px', width: '100%' }}>
          <EuiCallOut
            title={error.message.reason || errorDefaultTitle}
            color="danger"
            iconType="alert"
            size="m"
          >
            {error.message.details && (
              <>
                <EuiText size="s">
                  <p>{error.message.details}</p>
                </EuiText>
                <EuiSpacer size="s" />
              </>
            )}

            {/* Ask AI button if chat is available */}
            {isChatAvailable && (
              <>
                <EuiButton
                  size="s"
                  iconType="discuss"
                  onClick={handleAskAi}
                  isLoading={isAskingAi}
                  disabled={isAskingAi}
                >
                  {askAiButtonText}
                </EuiButton>
                <EuiSpacer size="m" />
              </>
            )}

            {/* Show suggestion if available */}
            {hasSuggestion && (
              <>
                <EuiText size="s">
                  <strong>{errorSuggestionText}:</strong> {errorSuggestion}
                </EuiText>
                <EuiSpacer size="s" />
              </>
            )}

            {/* Show available field suggestions when a field is not found */}
            {hasFieldSuggestions && (
              <>
                <EuiSpacer size="m" />
                <EuiText size="s">
                  <strong>
                    {requestedField
                      ? `Field "${requestedField}" not found. ${suggestedFieldsText}`
                      : suggestedFieldsText}
                  </strong>
                </EuiText>
                <EuiSpacer size="s" />
                <EuiFlexGroup wrap responsive={false} gutterSize="s">
                  {availableFields.slice(0, 8).map((field) => (
                    <EuiFlexItem grow={false} key={field}>
                      <EuiBadge color="hollow">{field}</EuiBadge>
                    </EuiFlexItem>
                  ))}
                  {availableFields.length > 8 && (
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        +{availableFields.length - 8} more fields available
                      </EuiText>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </>
            )}

            {/* Collapsible technical details */}
            {(error.message.type || error.originalErrorMessage) && (
              <>
                <EuiSpacer size="m" />
                <EuiButtonEmpty
                  size="xs"
                  iconType={isTechnicalDetailsOpen ? 'arrowDown' : 'arrowRight'}
                  onClick={() => setIsTechnicalDetailsOpen(!isTechnicalDetailsOpen)}
                >
                  {technicalDetailsText}
                </EuiButtonEmpty>
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
          </EuiCallOut>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiErrorBoundary>
  );
};
