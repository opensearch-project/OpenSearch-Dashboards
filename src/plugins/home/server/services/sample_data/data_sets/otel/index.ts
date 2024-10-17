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
// import { getSavedObjects } from './saved_objects';
import { servicesFieldMappings } from './services_field_mappings';
import { tracesFieldMappings } from './traces_field_mappings';
import { metricsFieldMappings } from './metrics_field_mappings';
import { logsFieldMappings } from './logs_field_mappings';

const otelDataName = i18n.translate('home.sampleData.otelSpecTitle', {
  defaultMessage: 'Sample Open-Telemetry logs, Traces and Metrics',
});
const otelDataDescription = i18n.translate('home.sampleData.otelSpecDescription', {
  defaultMessage:
    'Sample data including correlated observability signals for an e-commerce application in Open-Telemetry standard.',
});
const initialAppLinks = [] as AppLinkSchema[];

const DEFAULT_INDEX = 'i254a9691-8a1b-11ef-adb4-9f1097200c20';
const DASHBOARD_ID = '';

export const otelSpecProvider = function (): SampleDatasetSchema {
  return {
    id: 'otel',
    name: otelDataName,
    description: otelDataDescription,
    previewImagePath: '/plugins/home/assets/sample_data_resources/otel/otel_traces.png',
    darkPreviewImagePath: '/plugins/home/assets/sample_data_resources/otel/otel_traces_dark.png',
    hasNewThemeImages: true,
    overviewDashboard: DASHBOARD_ID,
    getDataSourceIntegratedDashboard: appendDataSourceId(DASHBOARD_ID),
    appLinks: initialAppLinks,
    defaultIndex: DEFAULT_INDEX,
    getDataSourceIntegratedDefaultIndex: appendDataSourceId(DEFAULT_INDEX),
    savedObjects: [],
    getDataSourceIntegratedSavedObjects: (dataSourceId?: string, dataSourceTitle?: string) =>
      getSavedObjectsWithDataSource([], dataSourceId, dataSourceTitle),
    getWorkspaceIntegratedSavedObjects: (workspaceId) =>
      overwriteSavedObjectsWithWorkspaceId([], workspaceId),
    dataIndices: [
      {
        id: '000001',
        dataPath: path.join(__dirname, './sample_traces.json.gz'),
        fields: tracesFieldMappings,
        timeFields: ['startTime', 'endTime', 'traceGroupFields.endTime'], // TODO: add support for 'events.time'
        currentTimeMarker: '2024-10-16T03:30:00',
        preserveDayOfWeekTimeOfDay: false,
        customPrefix: 'otel-v1-apm-span',
      },
      {
        id: 'map',
        dataPath: path.join(__dirname, './sample_service_map.json.gz'),
        fields: servicesFieldMappings,
        timeFields: [],
        currentTimeMarker: '2024-10-16T03:30:00',
        preserveDayOfWeekTimeOfDay: false,
        customPrefix: 'otel-v1-apm-service',
      },
      {
        id: '2024.10.16',
        dataPath: path.join(__dirname, './sample_metrics.json.gz'),
        fields: metricsFieldMappings,
        timeFields: ['@timestamp', 'exemplar.time', 'startTime', 'time', 'observedTimestamp'],
        currentTimeMarker: '2024-10-16T03:30:00',
        preserveDayOfWeekTimeOfDay: false,
        customPrefix: 'ss4o_metrics-otel',
      },
      {
        id: '2024.10.16',
        dataPath: path.join(__dirname, './sample_logs.json.gz'),
        fields: logsFieldMappings,
        timeFields: ['time', 'observedTime'],
        currentTimeMarker: '2024-10-16T03:30:00',
        preserveDayOfWeekTimeOfDay: false,
        customPrefix: 'otel-events',
      },
    ],
    status: 'not_installed',
  };
};
