/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TODO making this method type-safe is nontrivial: if you just define
 * `Nested<T> = { [k: string]: Nested<T> | T }` then you can't accumulate because `T` is not `Nested<T>`
 * There might be a way to define a recursive type that accumulates cleanly but it's probably not
 * worth the effort.
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
  } else {
    // Add backticks to the string
    return '`' + input + '`';
  }
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

// TODO: relocate to a more appropriate location
// Client route
export const PPL_BASE = '/api/ppl';
export const PPL_SEARCH = '/search';
export const DSL_BASE = '/api/dsl';
export const DSL_SEARCH = '/search';
export const DSL_CAT = '/cat.indices';
export const DSL_MAPPING = '/indices.getFieldMapping';
export const DSL_SETTINGS = '/indices.getFieldSettings';
export const OBSERVABILITY_BASE = '/api/observability';
export const INTEGRATIONS_BASE = '/api/integrations';
export const JOBS_BASE = '/query/jobs';
export const DATACONNECTIONS_BASE = '/api/directquery/dataconnections';
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

// Shared Constants
export const SQL_DOCUMENTATION_URL = 'https://opensearch.org/docs/latest/search-plugins/sql/index/';
export const PPL_DOCUMENTATION_URL =
  'https://opensearch.org/docs/latest/search-plugins/sql/ppl/index';
export const PPL_PATTERNS_DOCUMENTATION_URL =
  'https://github.com/opensearch-project/sql/blob/2.x/docs/user/ppl/cmd/patterns.rst#description';
export const UI_DATE_FORMAT = 'MM/DD/YYYY hh:mm A';
export const PPL_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSSSSS';
export const OTEL_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
export const SPAN_REGEX = /span/;

export const PROMQL_METRIC_SUBTYPE = 'promqlmetric';
export const OTEL_METRIC_SUBTYPE = 'openTelemetryMetric';
export const PPL_METRIC_SUBTYPE = 'metric';

export const PPL_SPAN_REGEX = /by\s*span/i;
export const PPL_STATS_REGEX = /\|\s*stats/i;
export const PPL_INDEX_INSERT_POINT_REGEX = /(search source|source|index)\s*=\s*([^|\s]+)(.*)/i;
export const PPL_INDEX_REGEX = /(search source|source|index)\s*=\s*([^|\s]+)/i;
export const PPL_WHERE_CLAUSE_REGEX = /\s*where\s+/i;
export const PPL_NEWLINE_REGEX = /[\n\r]+/g;
export const PPL_DESCRIBE_INDEX_REGEX = /(describe)\s+([^|\s]+)/i;

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

// Color Constants
export const PLOTLY_COLOR = [
  '#3CA1C7',
  '#54B399',
  '#DB748A',
  '#F2BE4B',
  '#68CCC2',
  '#2A7866',
  '#843769',
  '#374FB8',
  '#BD6F26',
  '#4C636F',
];

export const LONG_CHART_COLOR = PLOTLY_COLOR[1];

export const pageStyles: CSS.Properties = {
  float: 'left',
  width: '100%',
  maxWidth: '1130px',
};

export enum VIS_CHART_TYPES {
  Bar = 'bar',
  HorizontalBar = 'horizontal_bar',
  Line = 'line',
  Pie = 'pie',
  HeatMap = 'heatmap',
  Text = 'text',
  Histogram = 'histogram',
}

export const NUMERICAL_FIELDS = ['short', 'integer', 'long', 'float', 'double'];

export const ENABLED_VIS_TYPES = [
  VIS_CHART_TYPES.Bar,
  VIS_CHART_TYPES.HorizontalBar,
  VIS_CHART_TYPES.Line,
  VIS_CHART_TYPES.Pie,
  VIS_CHART_TYPES.HeatMap,
  VIS_CHART_TYPES.Text,
];

// Live tail constants
export const LIVE_OPTIONS = [
  {
    label: '5s',
    startTime: 'now-5s',
    delayTime: 5000,
  },
  {
    label: '10s',
    startTime: 'now-10s',
    delayTime: 10000,
  },
  {
    label: '30s',
    startTime: 'now-30s',
    delayTime: 30000,
  },
  {
    label: '1m',
    startTime: 'now-1m',
    delayTime: 60000,
  },
  {
    label: '5m',
    startTime: 'now-5m',
    delayTime: 60000 * 5,
  },
  {
    label: '15m',
    startTime: 'now-15m',
    delayTime: 60000 * 15,
  },
  {
    label: '30m',
    startTime: 'now-30m',
    delayTime: 60000 * 30,
  },
  {
    label: '1h',
    startTime: 'now-1h',
    delayTime: 60000 * 60,
  },
  {
    label: '2h',
    startTime: 'now-2h',
    delayTime: 60000 * 120,
  },
];

export const LIVE_END_TIME = 'now';

export interface DefaultChartStylesProps {
  DefaultModeLine: string;
  Interpolation: string;
  LineWidth: number;
  FillOpacity: number;
  MarkerSize: number;
  ShowLegend: string;
  LegendPosition: string;
  LabelAngle: number;
  DefaultSortSectors: string;
  DefaultModeScatter: string;
}

export const DEFAULT_CHART_STYLES: DefaultChartStylesProps = {
  DefaultModeLine: 'lines+markers',
  Interpolation: 'spline',
  LineWidth: 0,
  FillOpacity: 100,
  MarkerSize: 25,
  ShowLegend: 'show',
  LegendPosition: 'v',
  LabelAngle: 0,
  DefaultSortSectors: 'largest_to_smallest',
  DefaultModeScatter: 'markers',
};

export const FILLOPACITY_DIV_FACTOR = 200;
export const SLIDER_MIN_VALUE = 0;
export const SLIDER_MAX_VALUE = 100;
export const SLIDER_STEP = 1;
export const THRESHOLD_LINE_WIDTH = 3;
export const THRESHOLD_LINE_OPACITY = 0.7;
export const MAX_BUCKET_LENGTH = 16;

export enum BarOrientation {
  horizontal = 'h',
  vertical = 'v',
}

export const PLOT_MARGIN = {
  l: 30,
  r: 5,
  b: 30,
  t: 50,
  pad: 4,
};

export const WAITING_TIME_ON_USER_ACTIONS = 300;

export const VISUALIZATION_ERROR = {
  NO_DATA: 'No data found.',
  INVALID_DATA: 'Invalid visualization data',
  NO_SERIES: 'Add a field to start',
  NO_METRIC: 'Invalid Metric MetaData',
};

export const S3_DATA_SOURCE_TYPE = 's3glue';

export const DIRECT_DUMMY_QUERY = 'select 1';

export const DEFAULT_START_TIME = 'now-15m';
export const QUERY_ASSIST_START_TIME = 'now-40y';
export const QUERY_ASSIST_END_TIME = 'now';

export const TIMESTAMP_DATETIME_TYPES = ['date', 'date_nanos'];
