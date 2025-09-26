/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EuiButton, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import { ErrorDisplay } from './error_display';
import {
  createEnhancedError,
  logChartError,
  EnhancedChartError,
  ExtendedErrorType,
} from './error_handler';

/**
 * Props for the error boundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

/**
 * State for the error boundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: EnhancedChartError | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Enhanced error boundary specifically designed for chart components
 * Provides comprehensive error handling, logging, and recovery options
 */
export class ChartErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];
  private _isMounted = false;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    };

    this.previousResetKeys = props.resetKeys || [];
  }

  componentDidMount() {
    this._isMounted = true;
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `chart_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine error type based on error message and stack
    let errorType: ExtendedErrorType = 'render_error';

    if (error.message.includes('memory') || error.message.includes('Maximum call stack')) {
      errorType = 'memory_error';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network_error';
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout_error';
    } else if (error.message.includes('browser') || error.message.includes('compatibility')) {
      errorType = 'browser_compatibility';
    }

    const enhancedError = createEnhancedError(
      errorType,
      error.message || 'Chart rendering failed',
      {
        severity: errorType === 'memory_error' ? 'critical' : 'high',
        originalError: error,
        context: {
          componentState: 'error_boundary_catch',
          timestamp: Date.now(),
        },
        suggestions: [
          'Try refreshing the page',
          'Check browser console for additional details',
          'Reduce data size if working with large datasets',
        ],
        recoverable: true,
      }
    );

    return {
      hasError: true,
      error: enhancedError,
      errorId,
    };
  }

  /**
   * Component did catch - handle error logging and reporting
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { error: enhancedError } = this.state;

    // Enhanced error logging
    if (enhancedError) {
      const errorWithContext = {
        ...enhancedError,
        context: {
          ...enhancedError.context,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ChartErrorBoundary',
          retryCount: this.state.retryCount,
        },
      };

      logChartError(errorWithContext, {
        componentName: 'ChartErrorBoundary',
        userAction: 'component_render',
        additionalInfo: {
          errorInfo,
          props: this.props,
        },
      });
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external error tracking service if available
    this.reportToExternalService(error, errorInfo);
  }

  /**
   * Component did update - check for reset conditions
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on props change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
      return;
    }

    // Reset on resetKeys change
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => this.previousResetKeys[index] !== key
      );

      if (hasResetKeyChanged) {
        this.previousResetKeys = resetKeys;
        this.resetErrorBoundary();
      }
    }
  }

  /**
   * Component will unmount - cleanup
   */
  componentWillUnmount() {
    this._isMounted = false;
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Reset the error boundary state
   */
  private resetErrorBoundary = () => {
    const { onReset } = this.props;

    if (this._isMounted) {
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: 0,
      });
    }

    if (onReset) {
      onReset();
    }
  };

  /**
   * Handle retry with exponential backoff
   */
  private handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      // Maximum retry attempts reached
      return;
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;

    if (this._isMounted) {
      this.setState({ retryCount: retryCount + 1 });
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  /**
   * Handle error dismissal
   */
  private handleDismiss = () => {
    this.resetErrorBoundary();
  };

  /**
   * Report error to external service (placeholder)
   */
  private reportToExternalService(error: Error, errorInfo: ErrorInfo) {
    // Placeholder for external error reporting
    // Could integrate with services like Sentry, Bugsnag, etc.
    if (process.env.NODE_ENV === 'development') {
      // Chart Error Boundary - error details would be logged in production via proper logging service
    }
  }

  /**
   * Get fallback UI based on error type and context
   */
  private getFallbackUI(): ReactNode {
    const { fallback } = this.props;
    const { error, retryCount } = this.state;

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Use enhanced error display
    if (error) {
      return (
        <ErrorDisplay
          error={error}
          onRetry={retryCount < 3 ? this.handleRetry : undefined}
          onDismiss={this.handleDismiss}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    // Default fallback
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Something went wrong</h3>
        <p>An error occurred while rendering the chart.</p>
        <EuiFlexGroup justifyContent="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton onClick={this.handleRetry} size="s">
              Try again
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={this.handleDismiss} size="s">
              Dismiss
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  render() {
    const { children, isolate } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      const fallbackUI = this.getFallbackUI();

      // Isolate error to prevent propagation if requested
      if (isolate) {
        return <div style={{ isolation: 'isolate' }}>{fallbackUI}</div>;
      }

      return fallbackUI;
    }

    return children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<EnhancedChartError | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((err: Error | EnhancedChartError) => {
    let enhancedError: EnhancedChartError;

    if ('type' in err && 'severity' in err) {
      enhancedError = err as EnhancedChartError;
    } else {
      enhancedError = createEnhancedError(
        'unknown_error',
        err.message || 'Unknown error occurred',
        {
          severity: 'medium',
          originalError: err as Error,
          recoverable: true,
        }
      );
    }

    logChartError(enhancedError);
    setError(enhancedError);
  }, []);

  return {
    error,
    resetError,
    handleError,
    hasError: error !== null,
  };
};

/**
 * Higher-order component for adding error boundary to any component
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ChartErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ChartErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ComponentWithErrorBoundary;
}

/**
 * Async error boundary for handling promise rejections
 */
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  const { handleError } = useErrorHandler();

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

      handleError(error);

      if (onError) {
        onError(error);
      }

      // Prevent the default browser behavior
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError, onError]);

  return <>{children}</>;
};
