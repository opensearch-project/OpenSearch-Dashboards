/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  EuiEmptyPrompt,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCollapsibleNav,
  EuiText,
  EuiSpacer,
  EuiAccordion,
  EuiCodeBlock,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiIcon,
  EuiToolTip,
  EuiLink,
} from '@elastic/eui';

import {
  EnhancedChartError,
  getErrorDisplayInfo,
  getRecoveryActions,
  errorLogger,
} from './error_handler';

/**
 * Props for the main error display component
 */
interface ErrorDisplayProps {
  error: EnhancedChartError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Props for error details component
 */
interface ErrorDetailsProps {
  error: EnhancedChartError;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Props for error suggestions component
 */
interface ErrorSuggestionsProps {
  error: EnhancedChartError;
  onAction?: (action: string) => void;
}

/**
 * Main error display component with comprehensive error information
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false,
}) => {
  const [showDetailsState, setShowDetailsState] = useState(showDetails);
  const displayInfo = getErrorDisplayInfo(error);
  const recoveryActions = getRecoveryActions(error);

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'retry':
          onRetry?.();
          break;
        case 'dismiss':
          onDismiss?.();
          break;
        case 'view_docs':
          // Open documentation in new tab
          window.open('/app/opensearch-dashboards/docs/graph-visualization', '_blank');
          break;
        case 'check_format':
          // Could open a modal with format examples
          // Data format help requested
          break;
        default:
        // Action requested
      }
    },
    [onRetry, onDismiss]
  );

  const toggleDetails = useCallback(() => {
    setShowDetailsState((prev) => !prev);
  }, []);

  // Compact version for inline display
  if (compact) {
    return (
      <EuiCallOut
        title={displayInfo.title}
        color={displayInfo.color}
        iconType={displayInfo.iconType}
        size="s"
      >
        <EuiText size="s">
          <p>{displayInfo.description}</p>
        </EuiText>
        {onRetry && (
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton size="s" onClick={onRetry}>
                Retry
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="s" onClick={toggleDetails}>
                {showDetailsState ? 'Hide details' : 'Show details'}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
        {showDetailsState && (
          <>
            <EuiSpacer size="s" />
            <ErrorDetails error={error} isOpen={showDetailsState} onToggle={toggleDetails} />
          </>
        )}
      </EuiCallOut>
    );
  }

  // Full error display for empty states
  const actions = [];

  // Add primary action (usually retry)
  const primaryAction = recoveryActions.find((action) => action.primary);
  if (primaryAction && onRetry) {
    actions.push(
      <EuiButton
        key="primary"
        color="primary"
        fill
        onClick={() => handleAction(primaryAction.action)}
      >
        {primaryAction.label}
      </EuiButton>
    );
  }

  // Add secondary actions
  const secondaryActions = recoveryActions.filter((action) => !action.primary);
  if (secondaryActions.length > 0) {
    actions.push(
      <EuiFlexGroup key="secondary" gutterSize="s" justifyContent="center">
        {secondaryActions.map((action) => (
          <EuiFlexItem key={action.action} grow={false}>
            <EuiButtonEmpty size="s" onClick={() => handleAction(action.action)}>
              {action.label}
            </EuiButtonEmpty>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    );
  }

  // Add details toggle
  if (!showDetailsState) {
    actions.push(
      <EuiButtonEmpty key="details" size="s" onClick={toggleDetails} iconType="arrowDown">
        Show error details
      </EuiButtonEmpty>
    );
  }

  return (
    <div>
      <EuiEmptyPrompt
        iconType={displayInfo.iconType}
        color={displayInfo.color}
        title={<h3>{displayInfo.title}</h3>}
        body={
          <div>
            <p>{displayInfo.description}</p>
            <ErrorSeverityBadge error={error} />
            {error.suggestions && error.suggestions.length > 0 && (
              <ErrorSuggestions error={error} onAction={handleAction} />
            )}
          </div>
        }
        actions={actions}
      />

      {showDetailsState && (
        <>
          <EuiSpacer size="m" />
          <ErrorDetails error={error} isOpen={showDetailsState} onToggle={toggleDetails} />
        </>
      )}
    </div>
  );
};

/**
 * Error severity badge component
 */
const ErrorSeverityBadge: React.FC<{ error: EnhancedChartError }> = ({ error }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="center">
      <EuiFlexItem grow={false}>
        <EuiBadge color={getSeverityColor(error.severity)}>{error.severity} severity</EuiBadge>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiBadge color="hollow">{error.type.replace('_', ' ')}</EuiBadge>
      </EuiFlexItem>
      {!error.recoverable && (
        <EuiFlexItem grow={false}>
          <EuiToolTip content="This error cannot be automatically recovered">
            <EuiBadge color="danger" iconType="alert">
              Non-recoverable
            </EuiBadge>
          </EuiToolTip>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

/**
 * Error suggestions component
 */
const ErrorSuggestions: React.FC<ErrorSuggestionsProps> = ({ error, onAction }) => {
  if (!error.suggestions || error.suggestions.length === 0) {
    return null;
  }

  return (
    <div>
      <EuiSpacer size="s" />
      <EuiText size="s">
        <strong>Suggestions:</strong>
      </EuiText>
      <ul>
        {error.suggestions.map((suggestion, index) => (
          <li key={index}>
            <EuiText size="s">{suggestion}</EuiText>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Detailed error information component
 */
const ErrorDetails: React.FC<ErrorDetailsProps> = ({ error, isOpen, onToggle }) => {
  const errorStats = errorLogger.getErrorStats();
  const recentLogs = errorLogger.getRecentLogs(5);

  const errorDetailsJson = JSON.stringify(
    {
      type: error.type,
      message: error.message,
      severity: error.severity,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context,
      details: error.details,
      userAgent: error.userAgent,
    },
    null,
    2
  );

  return (
    <EuiAccordion
      id="error-details"
      buttonContent={
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiIcon type="inspect" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Error Details</strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      initialIsOpen={isOpen}
      onToggle={onToggle}
    >
      <EuiSpacer size="s" />

      {/* Error Context */}
      {error.context && (
        <div>
          <EuiText size="s">
            <strong>Context:</strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiCodeBlock language="json" fontSize="s" paddingSize="s">
            {JSON.stringify(error.context, null, 2)}
          </EuiCodeBlock>
          <EuiSpacer size="s" />
        </div>
      )}

      {/* Stack Trace */}
      {error.stackTrace && (
        <div>
          <EuiText size="s">
            <strong>Stack Trace:</strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiCodeBlock language="text" fontSize="s" paddingSize="s">
            {error.stackTrace}
          </EuiCodeBlock>
          <EuiSpacer size="s" />
        </div>
      )}

      {/* Full Error Object */}
      <div>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Full Error Details:</strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiCopy textToCopy={errorDetailsJson}>
              {(copy) => (
                <EuiButtonEmpty size="xs" onClick={copy} iconType="copy">
                  Copy
                </EuiButtonEmpty>
              )}
            </EuiCopy>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />
        <EuiCodeBlock language="json" fontSize="s" paddingSize="s">
          {errorDetailsJson}
        </EuiCodeBlock>
      </div>

      {/* Error Statistics */}
      <EuiSpacer size="s" />
      <div>
        <EuiText size="s">
          <strong>Error Statistics:</strong>
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiBadge>Total: {errorStats.totalErrors}</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiBadge>Recent: {errorStats.recentErrorRate}</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiBadge>Type: {errorStats.errorsByType[error.type] || 0}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* Recent Similar Errors */}
      {recentLogs.length > 0 && (
        <div>
          <EuiSpacer size="s" />
          <EuiText size="s">
            <strong>Recent Similar Errors:</strong>
          </EuiText>
          <EuiSpacer size="xs" />
          {recentLogs
            .filter((log) => log.type === error.type)
            .slice(0, 3)
            .map((log, index) => (
              <div key={index}>
                <EuiText size="xs" color="subdued">
                  {new Date(log.timestamp).toLocaleString()}: {log.message}
                </EuiText>
              </div>
            ))}
        </div>
      )}

      {/* Help Links */}
      <EuiSpacer size="s" />
      <div>
        <EuiText size="s">
          <strong>Need Help?</strong>
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiLink href="/app/opensearch-dashboards/docs/graph-visualization" target="_blank">
              Documentation
            </EuiLink>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiLink
              href="https://github.com/opensearch-project/OpenSearch-Dashboards/issues"
              target="_blank"
            >
              Report Issue
            </EuiLink>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiAccordion>
  );
};

/**
 * Empty data specific display component
 */
export const EmptyDataDisplay: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  suggestions?: string[];
}> = ({
  title = 'No data to display',
  message = 'The query returned no data points. Try adjusting your query or time range.',
  onRetry,
  suggestions = [],
}) => {
  return (
    <EuiEmptyPrompt
      iconType="empty"
      title={<h4>{title}</h4>}
      body={
        <div>
          <p>{message}</p>
          {suggestions.length > 0 && (
            <div>
              <EuiSpacer size="s" />
              <EuiText size="s">
                <strong>Try:</strong>
              </EuiText>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <EuiText size="s">{suggestion}</EuiText>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
      actions={
        onRetry ? (
          <EuiButton size="s" onClick={onRetry}>
            Retry
          </EuiButton>
        ) : undefined
      }
    />
  );
};

/**
 * Loading error display for timeout scenarios
 */
export const LoadingErrorDisplay: React.FC<{
  onRetry?: () => void;
  onCancel?: () => void;
}> = ({ onRetry, onCancel }) => {
  return (
    <EuiEmptyPrompt
      iconType="clock"
      color="warning"
      title={<h4>Loading timeout</h4>}
      body={<p>The chart is taking longer than expected to load.</p>}
      actions={[
        <EuiButton key="retry" color="primary" fill onClick={onRetry}>
          Retry
        </EuiButton>,
        <EuiButtonEmpty key="cancel" onClick={onCancel}>
          Cancel
        </EuiButtonEmpty>,
      ]}
    />
  );
};

/**
 * Performance warning display for large datasets
 */
export const PerformanceWarningDisplay: React.FC<{
  dataSize: number;
  onProceed?: () => void;
  onOptimize?: () => void;
  onCancel?: () => void;
}> = ({ dataSize, onProceed, onOptimize, onCancel }) => {
  return (
    <EuiCallOut title="Large dataset detected" color="warning" iconType="alert">
      <p>
        This chart contains {dataSize.toLocaleString()} data points, which may cause performance
        issues.
      </p>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton size="s" color="warning" onClick={onOptimize}>
            Optimize data
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" onClick={onProceed}>
            Proceed anyway
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" onClick={onCancel}>
            Cancel
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
