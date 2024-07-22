/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function get<T = unknown>(obj: Record<string, any>, path: string, defaultValue?: T): T {
  return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj) || defaultValue;
}

export function addBackticksIfNeeded(input: string): string {
  if (input === undefined) {
    return '';
  }
  // Check if the string already has backticks
  if (input.startsWith('`') && input.endsWith('`')) {
    return input; // Return the string as it is
  }
  // Add backticks to the string
  return '`' + input + '`';
}

export function combineSchemaAndDatarows(
  schema: Array<{ name: string; type: string }>,
  datarows: Array<Array<string | number | boolean>>
): object[] {
  const combinedData: object[] = [];

  datarows.forEach((row) => {
    const rowData: { [key: string]: string | number | boolean } = {};
    schema.forEach((field, index) => {
      rowData[field.name] = row[index];
    });
    combinedData.push(rowData);
  });

  return combinedData;
}

export const formatError = (name: string, message: string, details: string) => {
  return {
    name,
    message,
    body: {
      attributes: {
        error: {
          caused_by: {
            type: '',
            reason: details,
          },
        },
      },
    },
  };
};

// Client route
export const DIRECT_QUERY_BASE = '/api/directquery';
export const PPL_BASE = `${DIRECT_QUERY_BASE}/ppl`;
export const PPL_SEARCH = '/search';
export const DSL_BASE = `${DIRECT_QUERY_BASE}/dsl`;
export const DSL_SEARCH = '/search';
export const DSL_CAT = '/cat.indices';
export const DSL_MAPPING = '/indices.getFieldMapping';
export const DSL_SETTINGS = '/indices.getFieldSettings';
export const DSM_BASE = '/api/datasourcemanagement';
export const INTEGRATIONS_BASE = '/api/integrations';
export const JOBS_BASE = '/query/jobs';
export const DATACONNECTIONS_BASE = `${DIRECT_QUERY_BASE}/dataconnections`;
export const EDIT = '/edit';
export const DATACONNECTIONS_UPDATE_STATUS = '/status';
export const SECURITY_ROLES = '/api/v1/configuration/roles';
export const EVENT_ANALYTICS = '/event_analytics';
export const SAVED_OBJECTS = '/saved_objects';
export const SAVED_QUERY = '/query';
export const SAVED_VISUALIZATION = '/vis';
export const CONSOLE_PROXY = '/api/console/proxy';
export const SECURITY_PLUGIN_ACCOUNT_API = '/api/v1/configuration/account';

// Server route
export const PPL_ENDPOINT = '/_plugins/_ppl';
export const SQL_ENDPOINT = '/_plugins/_sql';
export const DSL_ENDPOINT = '/_plugins/_dsl';
export const DATACONNECTIONS_ENDPOINT = '/_plugins/_query/_datasources';
export const JOBS_ENDPOINT_BASE = '/_plugins/_async_query';
export const JOB_RESULT_ENDPOINT = '/result';

export const observabilityID = 'observability-logs';
export const observabilityTitle = 'Observability';
export const observabilityPluginOrder = 1500;

export const observabilityApplicationsID = 'observability-applications';
export const observabilityApplicationsTitle = 'Applications';
export const observabilityApplicationsPluginOrder = 5090;

export const observabilityLogsID = 'observability-logs';
export const observabilityLogsTitle = 'Logs';
export const observabilityLogsPluginOrder = 5091;

export const observabilityMetricsID = 'observability-metrics';
export const observabilityMetricsTitle = 'Metrics';
export const observabilityMetricsPluginOrder = 5092;

export const observabilityTracesID = 'observability-traces';
export const observabilityTracesTitle = 'Traces';
export const observabilityTracesPluginOrder = 5093;

export const observabilityNotebookID = 'observability-notebooks';
export const observabilityNotebookTitle = 'Notebooks';
export const observabilityNotebookPluginOrder = 5094;

export const observabilityPanelsID = 'observability-dashboards';
export const observabilityPanelsTitle = 'Dashboards';
export const observabilityPanelsPluginOrder = 5095;

export const observabilityIntegrationsID = 'integrations';
export const observabilityIntegrationsTitle = 'Integrations';
export const observabilityIntegrationsPluginOrder = 9020;

export const observabilityDataConnectionsID = 'datasources';
export const observabilityDataConnectionsTitle = 'Data sources';
export const observabilityDataConnectionsPluginOrder = 9030;

export const queryWorkbenchPluginID = 'opensearch-query-workbench';
export const queryWorkbenchPluginCheck = 'plugin:queryWorkbenchDashboards';

// Observability plugin URI
const BASE_OBSERVABILITY_URI = '/_plugins/_observability';
const BASE_DATACONNECTIONS_URI = '/_plugins/_query/_datasources';
export const OPENSEARCH_PANELS_API = {
  OBJECT: `${BASE_OBSERVABILITY_URI}/object`,
};
export const OPENSEARCH_DATACONNECTIONS_API = {
  DATACONNECTION: `${BASE_DATACONNECTIONS_URI}`,
};

// Saved Objects
export const SAVED_OBJECT = '/object';

export const S3_DATA_SOURCE_TYPE = 's3glue';

export const ASYNC_QUERY_SESSION_ID = 'async-query-session-id';
export const ASYNC_QUERY_DATASOURCE_CACHE = 'async-query-catalog-cache';
export const ASYNC_QUERY_ACCELERATIONS_CACHE = 'async-query-acclerations-cache';

export const DIRECT_DUMMY_QUERY = 'select 1';

export enum DirectQueryLoadingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
  SCHEDULED = 'scheduled',
  CANCELED = 'canceled',
  WAITING = 'waiting',
  INITIAL = 'initial',
}
const catalogCacheFetchingStatus = [
  DirectQueryLoadingStatus.RUNNING,
  DirectQueryLoadingStatus.WAITING,
  DirectQueryLoadingStatus.SCHEDULED,
];

export const isCatalogCacheFetching = (...statuses: DirectQueryLoadingStatus[]) => {
  return statuses.some((status: DirectQueryLoadingStatus) =>
    catalogCacheFetchingStatus.includes(status)
  );
};
