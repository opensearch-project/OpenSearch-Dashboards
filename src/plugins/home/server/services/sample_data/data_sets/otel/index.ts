/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import path from 'path';
import { AppLinkSchema, SampleDatasetSchema } from '../../lib/sample_dataset_registry_types';
import {
  appendDataSourceId,
  getSavedObjectsWithDataSource,
  overwriteSavedObjectsWithWorkspaceId,
} from '../util';
import { logsFieldMappings } from './logs_field_mappings';
import { metricsFieldMappings } from './metrics_field_mappings';
import { servicesFieldMappings } from './services_field_mappings';
import { tracesFieldMappings } from './traces_field_mappings';

const otelDataName = i18n.translate('home.sampleData.otelSpecTitle', {
  defaultMessage: 'Sample Observability Logs, Traces, and Metrics',
});
const otelDataDescription = i18n.translate('home.sampleData.otelSpecDescription', {
  defaultMessage:
    'Correlated observability signals for an e-commerce application in OpenTelemetry standard (Compatible with 2.13+ OpenSearch domains)',
});
const initialAppLinks: AppLinkSchema[] = [
  {
    path: 'observability-traces#/traces',
    icon: 'apmTrace',
    label: 'View traces',
    newPath: 'observability-traces-nav#/traces',
    appendDatasourceToPath: true,
  },
  {
    path: 'observability-traces#/services',
    icon: 'graphApp',
    label: 'View services',
    newPath: 'observability-services-nav#/services',
    appendDatasourceToPath: true,
  },
];

export const otelSpecProvider = function (): SampleDatasetSchema {
  return {
    id: 'otel',
    name: otelDataName,
    description: otelDataDescription,
    previewImagePath: '/plugins/home/assets/sample_data_resources/otel/otel_traces.png',
    darkPreviewImagePath: '/plugins/home/assets/sample_data_resources/otel/otel_traces_dark.png',
    hasNewThemeImages: true,
    overviewDashboard: '',
    getDataSourceIntegratedDashboard: appendDataSourceId(''),
    appLinks: initialAppLinks,
    defaultIndex: '',
    getDataSourceIntegratedDefaultIndex: appendDataSourceId(''),
    savedObjects: [],
    getDataSourceIntegratedSavedObjects: (dataSourceId?: string, dataSourceTitle?: string) =>
      getSavedObjectsWithDataSource([], dataSourceId, dataSourceTitle),
    getWorkspaceIntegratedSavedObjects: (workspaceId) =>
      overwriteSavedObjectsWithWorkspaceId([], workspaceId),
    dataIndices: [
      {
        id: 'otel-v1-apm-span-sample',
        dataPath: path.join(__dirname, './sample_traces.json.gz'),
        fields: tracesFieldMappings,
        timeFields: ['startTime', 'endTime', 'traceGroupFields.endTime'], // TODO: add support for 'events.time'
        currentTimeMarker: '2024-10-16T19:00:01',
        preserveDayOfWeekTimeOfDay: false,
        indexName: 'otel-v1-apm-span-sample',
      },
      {
        id: 'otel-v1-apm-service-map-sample',
        dataPath: path.join(__dirname, './sample_service_map.json.gz'),
        fields: servicesFieldMappings,
        timeFields: [],
        currentTimeMarker: '2024-10-16T19:00:01',
        preserveDayOfWeekTimeOfDay: false,
        indexName: 'otel-v1-apm-service-map-sample',
      },
      {
        id: 'ss4o_metrics-otel-sample',
        dataPath: path.join(__dirname, './sample_metrics.json.gz'),
        fields: metricsFieldMappings,
        timeFields: ['@timestamp', 'exemplar.time', 'startTime', 'time', 'observedTimestamp'],
        currentTimeMarker: '2024-10-16T19:00:01',
        preserveDayOfWeekTimeOfDay: false,
        indexName: 'ss4o_metrics-otel-sample',
      },
      {
        id: 'ss4o_logs-otel-sample',
        dataPath: path.join(__dirname, './sample_logs.json.gz'),
        fields: logsFieldMappings,
        timeFields: ['time', 'observedTime'],
        currentTimeMarker: '2024-10-16T19:00:01',
        preserveDayOfWeekTimeOfDay: false,
        indexName: 'ss4o_logs-otel-sample',
      },
    ],
    status: 'not_installed',
  };
};
