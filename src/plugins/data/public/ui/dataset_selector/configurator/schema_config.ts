/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

/**
 * Configuration for schema mappings.
 * Defines what schemas and attributes are available for field mapping.
 */

export interface SchemaAttributeConfig {
  /** Display name shown in the UI */
  displayName: string;
  /** Description shown as help text */
  description: string;
  /** Optional field type to filter available fields */
  type?: string;
}

export interface SchemaConfig {
  /** Display name of the schema */
  displayName: string;
  /** Description of the schema */
  description: string;
  /** Signal type for filtering schemas */
  signalType: string;
  /** Map of attribute key to attribute configuration */
  attributes: Record<string, SchemaAttributeConfig>;
}

/**
 * Factory function to get predefined schema configurations with i18n support.
 * Add or modify schemas here to change what's available in the UI.
 */
export const getSchemaConfigs = (): Record<string, SchemaConfig> => ({
  otelLogs: {
    displayName: i18n.translate('data.schemaConfig.otelLogs.displayName', {
      defaultMessage: 'OTel logs',
    }),
    description: i18n.translate('data.schemaConfig.otelLogs.description', {
      defaultMessage: 'OTel schema mappings for your logs dataset',
    }),
    signalType: 'logs',
    attributes: {
      traceId: {
        displayName: i18n.translate('data.schemaConfig.otelLogs.traceId.displayName', {
          defaultMessage: 'Trace ID',
        }),
        description: i18n.translate('data.schemaConfig.otelLogs.traceId.description', {
          defaultMessage: 'Unique identifier for the trace',
        }),
      },
      spanId: {
        displayName: i18n.translate('data.schemaConfig.otelLogs.spanId.displayName', {
          defaultMessage: 'Span ID',
        }),
        description: i18n.translate('data.schemaConfig.otelLogs.spanId.description', {
          defaultMessage: 'Unique identifier for the span',
        }),
      },
      serviceName: {
        displayName: i18n.translate('data.schemaConfig.otelLogs.serviceName.displayName', {
          defaultMessage: 'Service Name',
        }),
        description: i18n.translate('data.schemaConfig.otelLogs.serviceName.description', {
          defaultMessage: 'Name of the service',
        }),
      },
      timestamp: {
        displayName: i18n.translate('data.schemaConfig.otelLogs.timestamp.displayName', {
          defaultMessage: 'Timestamp',
        }),
        description: i18n.translate('data.schemaConfig.otelLogs.timestamp.description', {
          defaultMessage: 'The time when the span started or when the event occurred',
        }),
        type: 'date',
      },
    },
  },
});
