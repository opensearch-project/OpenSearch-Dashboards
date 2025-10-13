/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartError, GraphTimeseriesDataArgs } from './types';

/**
 * Enhanced error types for comprehensive error handling
 */
export type ExtendedErrorType =
  | 'data_format'
  | 'empty_data'
  | 'render_error'
  | 'transformation_error'
  | 'validation_error'
  | 'network_error'
  | 'timeout_error'
  | 'memory_error'
  | 'browser_compatibility'
  | 'unknown_error';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced error interface with additional context
 */
export interface EnhancedChartError extends ChartError {
  type: ExtendedErrorType;
  severity: ErrorSeverity;
  timestamp: number;
  userAgent?: string;
  stackTrace?: string;
  context?: {
    dataSize?: number;
    seriesCount?: number;
    timeRange?: string;
    componentState?: any;
  };
  suggestions?: string[];
  recoverable: boolean;
}

/**
 * Error logging configuration
 */
interface ErrorLogConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogEntries: number;
}

/**
 * Default error logging configuration
 */
const DEFAULT_LOG_CONFIG: ErrorLogConfig = {
  enableConsoleLogging: true,
  enableRemoteLogging: false, // Would need backend endpoint
  logLevel: 'error',
  maxLogEntries: 100,
};

/**
 * In-memory error log for debugging
 */
class ErrorLogger {
  private logs: EnhancedChartError[] = [];
  private config: ErrorLogConfig;

  constructor(config: Partial<ErrorLogConfig> = {}) {
    this.config = { ...DEFAULT_LOG_CONFIG, ...config };
  }

  /**
   * Log an error with enhanced context
   */
  logError(error: EnhancedChartError): void {
    // Add to in-memory log
    this.logs.push(error);

    // Maintain max log entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift();
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      const logMethod = this.getConsoleMethod(error.severity);
      logMethod(`[GraphVisualization] ${error.type}: ${error.message}`, {
        error,
        timestamp: new Date(error.timestamp).toISOString(),
        context: error.context,
      });
    }

    // Remote logging (placeholder for future implementation)
    if (this.config.enableRemoteLogging) {
      this.sendToRemoteLogger(error);
    }
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(count: number = 10): EnhancedChartError[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear error logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ExtendedErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.logs.filter((log) => log.timestamp > oneHourAgo);

    const errorsByType = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<ExtendedErrorType, number>);

    const errorsBySeverity = this.logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    return {
      totalErrors: this.logs.length,
      errorsByType,
      errorsBySeverity,
      recentErrorRate: recentErrors.length,
    };
  }

  private getConsoleMethod(severity: ErrorSeverity): () => void {
    // In production, this would route to proper logging service based on severity
    return () => {};
  }

  private sendToRemoteLogger(error: EnhancedChartError): void {
    // Placeholder for remote logging implementation
    // Could send to OpenSearch Dashboards telemetry or external service
    // Remote logging not implemented - would send to telemetry service
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Create an enhanced error with full context
 */
export function createEnhancedError(
  type: ExtendedErrorType,
  message: string,
  options: {
    severity?: ErrorSeverity;
    details?: any;
    context?: EnhancedChartError['context'];
    suggestions?: string[];
    originalError?: Error;
    recoverable?: boolean;
  } = {}
): EnhancedChartError {
  const {
    severity = 'medium',
    details,
    context,
    suggestions = [],
    originalError,
    recoverable = true,
  } = options;

  return {
    type,
    message,
    severity,
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    stackTrace: originalError?.stack,
    details,
    context,
    suggestions,
    recoverable,
  };
}

/**
 * Validate data and create appropriate error if invalid
 */
export function validateDataForErrors(data: GraphTimeseriesDataArgs): EnhancedChartError | null {
  // Check for null/undefined data
  if (!data) {
    return createEnhancedError('validation_error', 'No data provided to chart component', {
      severity: 'high',
      suggestions: ['Ensure data is passed to the GraphVisualization component'],
      recoverable: false,
    });
  }

  // Check for missing data property
  if (!data.data) {
    return createEnhancedError('validation_error', 'Data property is missing from input', {
      severity: 'high',
      suggestions: ['Ensure the data object has a "data" property'],
      recoverable: false,
    });
  }

  // Check for empty arrays
  if (Array.isArray(data.data) && data.data.length === 0) {
    return createEnhancedError('empty_data', 'Data array is empty', {
      severity: 'low',
      suggestions: [
        'Check if your query returned any results',
        'Verify the time range includes data points',
        'Ensure data source is accessible',
      ],
      recoverable: true,
    });
  }

  // Check for Prometheus empty results
  if (
    typeof data.data === 'object' &&
    'result' in data.data &&
    Array.isArray(data.data.result) &&
    data.data.result.length === 0
  ) {
    return createEnhancedError('empty_data', 'Prometheus query returned no results', {
      severity: 'low',
      suggestions: [
        'Check if your Prometheus query is correct',
        'Verify the time range includes data points',
        'Ensure the metric exists in your Prometheus instance',
      ],
      recoverable: true,
    });
  }

  return null;
}

/**
 * Get user-friendly error messages based on error type
 */
export function getErrorDisplayInfo(
  error: EnhancedChartError
): {
  title: string;
  description: string;
  iconType: string;
  color: 'danger' | 'warning' | 'subdued';
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
} {
  switch (error.type) {
    case 'empty_data':
      return {
        title: 'No data to display',
        description: 'The query returned no data points. Try adjusting your query or time range.',
        iconType: 'empty',
        color: 'subdued',
      };

    case 'data_format':
      return {
        title: 'Invalid data format',
        description: 'The data format is not supported. Please check the data structure.',
        iconType: 'alert',
        color: 'warning',
      };

    case 'transformation_error':
      return {
        title: 'Data processing error',
        description:
          'An error occurred while processing the data. Some data points may be invalid.',
        iconType: 'warning',
        color: 'warning',
      };

    case 'render_error':
      return {
        title: 'Chart rendering failed',
        description:
          'The chart could not be rendered. This may be due to browser compatibility or memory issues.',
        iconType: 'alert',
        color: 'danger',
      };

    case 'validation_error':
      return {
        title: 'Data validation failed',
        description: 'The provided data does not meet the required format or constraints.',
        iconType: 'alert',
        color: 'warning',
      };

    case 'network_error':
      return {
        title: 'Network error',
        description: 'Failed to load chart data due to network issues.',
        iconType: 'offline',
        color: 'danger',
      };

    case 'timeout_error':
      return {
        title: 'Request timeout',
        description: 'The data request took too long to complete.',
        iconType: 'clock',
        color: 'warning',
      };

    case 'memory_error':
      return {
        title: 'Memory limit exceeded',
        description: 'The dataset is too large to render efficiently.',
        iconType: 'memory',
        color: 'danger',
      };

    case 'browser_compatibility':
      return {
        title: 'Browser compatibility issue',
        description: 'Your browser may not support all chart features.',
        iconType: 'browser',
        color: 'warning',
      };

    default:
      return {
        title: 'Unknown error',
        description: 'An unexpected error occurred while rendering the chart.',
        iconType: 'alert',
        color: 'danger',
      };
  }
}

/**
 * Check if error is recoverable and suggest recovery actions
 */
export function getRecoveryActions(
  error: EnhancedChartError
): Array<{
  label: string;
  action: string;
  primary?: boolean;
}> {
  const actions: Array<{ label: string; action: string; primary?: boolean }> = [];

  if (error.recoverable) {
    actions.push({
      label: 'Retry',
      action: 'retry',
      primary: true,
    });
  }

  switch (error.type) {
    case 'empty_data':
      actions.push(
        { label: 'Adjust time range', action: 'adjust_time_range' },
        { label: 'Modify query', action: 'modify_query' }
      );
      break;

    case 'data_format':
      actions.push(
        { label: 'Check data format', action: 'check_format' },
        { label: 'View documentation', action: 'view_docs' }
      );
      break;

    case 'memory_error':
      actions.push(
        { label: 'Reduce data size', action: 'reduce_data' },
        { label: 'Use sampling', action: 'enable_sampling' }
      );
      break;

    case 'network_error':
      actions.push(
        { label: 'Check connection', action: 'check_connection' },
        { label: 'Retry request', action: 'retry_request' }
      );
      break;
  }

  return actions;
}

/**
 * Log error with automatic context detection
 */
export function logChartError(
  error: Error | EnhancedChartError,
  context?: {
    componentName?: string;
    dataSize?: number;
    userAction?: string;
    additionalInfo?: any;
  }
): void {
  let enhancedError: EnhancedChartError;

  if ('type' in error && 'severity' in error) {
    // Already an enhanced error
    enhancedError = error as EnhancedChartError;
  } else {
    // Convert regular Error to EnhancedChartError
    enhancedError = createEnhancedError(
      'unknown_error',
      error.message || 'Unknown error occurred',
      {
        severity: 'medium',
        originalError: error as Error,
        context: context as any,
      }
    );
  }

  errorLogger.logError(enhancedError);
}

/**
 * Create fallback data for edge cases
 */
export function createFallbackData(): {
  series: Array<{ id: string; name: string; data: Array<{ x: Date; y: number }> }>;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
} {
  const now = new Date();
  const fallbackData = Array.from({ length: 5 }, (_, i) => ({
    x: new Date(now.getTime() - (4 - i) * 60000), // 5 points, 1 minute apart
    y: 0,
  }));

  return {
    series: [
      {
        id: 'fallback_series',
        name: 'No Data',
        data: fallbackData,
      },
    ],
    title: 'No Data Available',
    xAxisLabel: 'Time',
    yAxisLabel: 'Value',
  };
}

/**
 * Detect potential performance issues
 */
export function detectPerformanceIssues(dataSize: number): EnhancedChartError | null {
  const MAX_SAFE_POINTS = 10000;
  const CRITICAL_POINTS = 50000;

  if (dataSize > CRITICAL_POINTS) {
    return createEnhancedError(
      'memory_error',
      `Dataset too large (${dataSize.toLocaleString()} points)`,
      {
        severity: 'critical',
        context: { dataSize },
        suggestions: [
          'Use data sampling to reduce the number of points',
          'Implement pagination or time-based filtering',
          'Consider using a different visualization approach',
        ],
        recoverable: true,
      }
    );
  }

  if (dataSize > MAX_SAFE_POINTS) {
    return createEnhancedError(
      'render_error',
      `Large dataset may cause performance issues (${dataSize.toLocaleString()} points)`,
      {
        severity: 'medium',
        context: { dataSize },
        suggestions: [
          'Consider enabling data sampling',
          'Use time-based filtering to reduce data points',
          'Monitor browser performance',
        ],
        recoverable: true,
      }
    );
  }

  return null;
}
