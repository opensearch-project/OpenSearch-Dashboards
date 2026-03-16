/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/**
 * Performance metric structure for recording quantitative measurements.
 * Used for tracking durations, counts, sizes, and other numeric values.
 *
 * @example
 * ```typescript
 * telemetry.recordMetric({
 *   name: 'search_duration_ms',
 *   value: 150,
 *   unit: 'ms',
 *   labels: { queryType: 'dql' }
 * });
 * ```
 */
export interface TelemetryMetric {
  /**
   * Name of the metric. Should be descriptive and follow naming conventions.
   * Examples: 'search_duration_ms', 'page_load_time', 'response_size_bytes'
   */
  name: string;

  /**
   * Numeric value of the metric.
   * For durations, use milliseconds. For sizes, use bytes.
   */
  value: number;

  /**
   * Unit of measurement for the metric value.
   * Common units: 'ms' (milliseconds), 'bytes', 'count', 'percent'
   */
  unit?: string;

  /**
   * Key-value labels for categorizing and filtering metrics.
   * Use labels to add dimensions like query type, result size category, etc.
   * Example: { queryType: 'dql', resultSize: 'large' }
   */
  labels?: Record<string, string>;

  /**
   * Source plugin ID that recorded this metric.
   * Auto-populated when using PluginTelemetryRecorder.
   */
  source?: string;
}

/**
 * Custom telemetry event structure for recording application events.
 * Used for tracking user actions, feature usage, and other discrete occurrences.
 *
 * @example
 * ```typescript
 * telemetry.recordEvent({
 *   name: 'search_executed',
 *   data: { queryType: 'dql', resultCount: 42 }
 * });
 * ```
 */
export interface TelemetryEvent {
  /**
   * Event name. Should be descriptive and follow naming conventions.
   * Examples: 'search_executed', 'dashboard_loaded', 'visualization_created'
   */
  name: string;

  /**
   * Event payload data. Can contain any values (strings, numbers, objects, arrays).
   * Include relevant context but avoid PII.
   * Example: { queryType: 'dql', resultCount: 42, duration: 150 }
   */
  data: Record<string, any>;

  /**
   * Source plugin ID that recorded this event.
   * Auto-populated when using PluginTelemetryRecorder.
   */
  source?: string;
}

/**
 * Error telemetry structure for recording application errors.
 * Used for tracking errors, exceptions, and failures.
 *
 * @example
 * ```typescript
 * telemetry.recordError({
 *   type: 'QueryParseError',
 *   message: 'Invalid syntax at position 15',
 *   context: { query: 'user: @invalid' }
 * });
 * ```
 */
export interface TelemetryError {
  /**
   * Error type or category. Use consistent naming for grouping.
   * Examples: 'NetworkError', 'ValidationError', 'QueryParseError', 'TimeoutError'
   */
  type: string;

  /**
   * Human-readable error message.
   * Should be informative but avoid including sensitive data like PII.
   */
  message: string;

  /**
   * Error stack trace for debugging.
   * Optional - may be omitted or sanitized for security reasons.
   */
  stack?: string;

  /**
   * Additional context about the error.
   * Include relevant information that helps understand the error circumstances.
   * Example: { endpoint: '/api/search', requestDuration: 5000 }
   */
  context?: Record<string, any>;

  /**
   * Source plugin ID that recorded this error.
   * Auto-populated when using PluginTelemetryRecorder.
   */
  source?: string;
}

/**
 * Scoped telemetry recorder that automatically includes plugin context.
 * Obtained via `core.telemetry.getPluginRecorder()` (pluginId auto-injected).
 *
 * The recorder automatically adds the plugin ID as the source for all events,
 * making it easier to track which plugin generated each telemetry item.
 *
 * @example
 * ```typescript
 * // In your plugin's start() method:
 * const recorder = core.telemetry.getPluginRecorder();
 *
 * // Record events - source is automatically set to your plugin name
 * recorder.recordEvent({ name: 'search_executed', data: { duration: 150 } });
 * recorder.recordMetric({ name: 'query_time_ms', value: 50, unit: 'ms' });
 * recorder.recordError({ type: 'SearchError', message: 'Timeout' });
 * ```
 */
export interface PluginTelemetryRecorder {
  /**
   * Record a custom telemetry event.
   * The plugin ID is automatically added as the source.
   *
   * @param event - Event object (source field is auto-populated)
   */
  recordEvent(event: Omit<TelemetryEvent, 'source'>): void;

  /**
   * Record a performance metric.
   * The plugin ID is automatically added as the source.
   *
   * @param metric - Metric object (source field is auto-populated)
   */
  recordMetric(metric: Omit<TelemetryMetric, 'source'>): void;

  /**
   * Record an error event.
   * The plugin ID is automatically added as the source.
   *
   * @param error - Error object (source field is auto-populated)
   */
  recordError(error: Omit<TelemetryError, 'source'>): void;
}

/**
 * Telemetry service interface exposed via CoreStart.
 * Provides APIs for plugins to emit custom telemetry events, metrics, and errors.
 *
 * Always available - use `isEnabled()` to check if collection is active.
 * When no telemetry provider is registered, `isEnabled()` returns false and
 * recording methods are no-ops.
 *
 * @remarks
 * - Events are batched and sent to the server periodically
 * - Server forwards events to configured backends (e.g., Kinesis)
 * - Always use `getPluginRecorder()` to ensure proper source attribution
 *
 * @example
 * ```typescript
 * // Get a scoped recorder for your plugin (source is auto-populated)
 * const telemetry = core.telemetry.getPluginRecorder();
 * telemetry.recordEvent({ name: 'search_executed', data: { duration: 150 } });
 * telemetry.recordMetric({ name: 'query_time_ms', value: 50, unit: 'ms' });
 * telemetry.recordError({ type: 'SearchError', message: 'Timeout' });
 * ```
 */
export interface TelemetryService {
  /**
   * Check if telemetry collection is enabled.
   * Use this to avoid expensive data collection when telemetry is disabled.
   *
   * @returns true if telemetry is enabled and collecting events
   *
   * @example
   * ```typescript
   * if (core.telemetry.isEnabled()) {
   *   const expensiveMetrics = collectDetailedMetrics();
   *   core.telemetry.getPluginRecorder().recordEvent({ name: 'detailed_metrics', data: expensiveMetrics });
   * }
   * ```
   */
  isEnabled(): boolean;

  /**
   * Get a scoped telemetry recorder for your plugin.
   * The returned recorder automatically adds plugin context to all events.
   *
   * When called without arguments from a plugin's start() method, the plugin ID
   * is automatically injected by the core system.
   *
   * @param pluginId - Optional plugin ID. Auto-injected when called from plugin context.
   * @returns A scoped recorder that auto-populates the source field
   *
   * @example
   * ```typescript
   * // In plugin start() - pluginId is auto-injected
   * const recorder = core.telemetry.getPluginRecorder();
   * recorder.recordEvent({ name: 'search_executed', data: { duration: 100 } });
   * // Event will include source: 'yourPluginId' automatically
   * ```
   */
  getPluginRecorder(pluginId?: string): PluginTelemetryRecorder;
}

/**
 * Telemetry provider interface for plugins implementing telemetry collection.
 * This is registered by the telemetry plugin during setup phase.
 *
 * @remarks
 * Only one provider can be registered. Subsequent registrations are ignored.
 */
export interface TelemetryProvider {
  /**
   * Record a custom telemetry event.
   */
  recordEvent(event: TelemetryEvent): void;

  /**
   * Record a performance metric.
   */
  recordMetric(metric: TelemetryMetric): void;

  /**
   * Record an error event.
   */
  recordError(error: TelemetryError): void;

  /**
   * Check if telemetry collection is enabled.
   */
  isEnabled(): boolean;
}

/**
 * Telemetry service setup contract.
 * Exposed via CoreSetup for plugins to register telemetry providers.
 */
export interface TelemetryServiceSetup {
  /**
   * Register a telemetry provider implementation.
   * Should only be called once by the telemetry plugin.
   *
   * @param provider - The telemetry provider implementation
   *
   * @example
   * ```typescript
   * // In telemetry plugin setup()
   * core.telemetry.registerProvider({
   *   recordEvent: (name, data, attrs) => otelCollector.recordEvent(name, data, attrs),
   *   recordMetric: (metric) => otelCollector.recordMetric(metric),
   *   recordError: (error) => otelCollector.recordError(error),
   *   isEnabled: () => config.enabled,
   * });
   * ```
   */
  registerProvider(provider: TelemetryProvider): void;
}

/**
 * Telemetry service start contract.
 * This is the same as TelemetryService, exposed via CoreStart.
 */
export type TelemetryServiceStart = TelemetryService;
