/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import rison from 'rison-node';
import {
  EuiPanel,
  EuiText,
  EuiSpacer,
  EuiButton,
  EuiAccordion,
  EuiCodeBlock,
  EuiLoadingChart,
  EuiCallOut,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { RenderProps, ContextProviderStart } from '../../../../../context_provider/public';
import { DataPublicPluginStart, TimeRange } from '../../../../../data/public';
import { Dataset, DEFAULT_DATA } from '../../../../../data/common';
import { ChartType } from '../../../components/visualizations/utils/use_visualization_types';
import {
  AxisFieldNameMappings,
  RenderChartConfig,
  VisColumn,
} from '../../../components/visualizations/types';
import { VisData } from '../../../components/visualizations/visualization_builder.types';
import { CommonVisualizationRender } from '../../../components/visualizations/visualization_render';
import { normalizeResultRows } from '../../../components/visualizations/utils/normalize_result_rows';
import { visualizationRegistry } from '../../../components/visualizations/visualization_registry';
import { SAMPLE_SIZE_SETTING, VISUALIZATION_EDITOR_APP_ID } from '../../../../common';
import { VisEditorNoResults } from '../../../application/in_context_vis_editor/component/vis_editor_no_results';
import { AutoVisMeta } from './utils';

export const AUTO_VISUALIZATION_TOOL_NAME = 'auto_create_visualization';

interface AutoVisualizationArgs {
  query: string;
  indexName: string;
  // user intended chart type
  potentialChartType?: string;
  columns: Array<{ name: string; type: string }>;
  splitField?: string;
  // used to build dataset, without it time range search bar will not show
  timeFieldName?: string;
  timeRange?: TimeRange;
  // used to build dataset
  datasourceId?: string;
  datasourceTitle?: string;
  dashboardId?: string;
}

interface PreparedQuery {
  dataset: Dataset;
  language: string;
  query: string;
}

interface VisualizationConfigResult {
  success: true;
  visConfig: RenderChartConfig;
  query: PreparedQuery;
  resolvedChartType: ChartType;
  resolvedAxesMapping: AxisFieldNameMappings;
}

function buildEditorPath(
  visConfig: RenderChartConfig,
  query: PreparedQuery,
  timeRange?: TimeRange,
  dashboardId?: string,
  dashboardName?: string
): string {
  const visState: Record<string, any> = {
    chartType: visConfig.type,
    axesMapping: visConfig.axesMapping,
    styleOptions: visConfig.styles,
  };
  if (visConfig.splitField) {
    visState.splitField = visConfig.splitField;
  }

  const vParam = rison.encode(visState);
  const eqParam = rison.encode(query as Record<string, any>);

  const gParam = timeRange
    ? `&_g=${encodeURIComponent(rison.encode({ time: { from: timeRange.from, to: timeRange.to } }))}`
    : '';

  // Bind the visualization to the originating dashboard via `_c` (containerInfo),

  const cParam = dashboardId
    ? `&_c=${encodeURIComponent(
        rison.encode({
          originatingApp: 'dashboards',
          containerInfo: {
            containerId: dashboardId,
            ...(dashboardName && { containerName: dashboardName }),
          },
        })
      )}`
    : '';

  return `#/?_v=${encodeURIComponent(vParam)}&_eq=${encodeURIComponent(eqParam)}${gParam}${cParam}`;
}

/**
 * Resolve axes mapping and chart type given the classified columns.
 */
function resolveChartFromSchema(
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  potentialChartType?: string
): {
  chartType: ChartType;
  axesMapping: AxisFieldNameMappings;
} {
  // 1. find all compatible rules with visualization registry
  const { all: allMatches, exact: exactMatches } = visualizationRegistry.findRulesByColumns(
    numericalColumns,
    categoricalColumns,
    dateColumns
  );

  const candidates: Array<{
    chartType: ChartType;
    priority: number;
    axesMapping: AxisFieldNameMappings;
  }> = [];
  const seenChartTypes = new Set<string>();

  for (const matches of [exactMatches, allMatches]) {
    for (const { visType, rules } of matches) {
      if (seenChartTypes.has(visType)) continue;
      seenChartTypes.add(visType);
      // 2. only provide the highest-priority rule for each chart type
      const bestRule = rules.reduce((best, r) => (r.priority > best.priority ? r : best));
      const axesMapping = visualizationRegistry.getAxesMappingByRule(
        bestRule,
        numericalColumns,
        categoricalColumns,
        dateColumns
      );
      if (Object.keys(axesMapping).length === 0) continue;

      candidates.push({
        chartType: visType as ChartType,
        priority: bestRule.priority,
        axesMapping,
      });
    }
  }

  // 3. If the user provided a potential chart-type, use it
  if (potentialChartType) {
    const matched = candidates.find(
      (c) => c.chartType.toLowerCase() === potentialChartType.toLowerCase()
    );
    if (matched) {
      return { chartType: matched.chartType, axesMapping: matched.axesMapping };
    }
    // chart is incompatible with the columns.
    // the throw reaches the llm.
    throw new Error(
      `Chart type "${potentialChartType}" is not compatible with the query result columns. ` +
        `Compatible chart types: [${candidates.map((c) => c.chartType).join(', ')}]. ` +
        `Please adjust ppl query.`
    );
  }

  // 4. No potential chart and candidates, use table
  if (candidates.length === 0) {
    // fallback to table vis
    return { chartType: 'table', axesMapping: {} };
  }

  // 5. No potential chart, use the chart with highest-priority
  const best = candidates.reduce((a, b) => (b.priority > a.priority ? b : a));
  return { chartType: best.chartType, axesMapping: best.axesMapping };
}

/**
 * Build the dataset manually + prepared query object from the tool args. The dataset is
 * built manually and will not be created.
 */
function buildPreparedQuery(args: AutoVisualizationArgs): PreparedQuery {
  const datasetId = args.datasourceId ? `${args?.datasourceId}_${args.indexName}` : args.indexName;
  const dataset: Dataset = {
    id: datasetId,
    title: args.indexName,
    type: DEFAULT_DATA.SET_TYPES.INDEX,
    timeFieldName: args.timeFieldName,
    ...(args.datasourceId && {
      dataSource: {
        id: args.datasourceId,
        title: args?.datasourceTitle || '',
        type: 'DATA_SOURCE',
        version: '',
      },
    }),
  };

  return {
    dataset,
    language: 'PPL',
    query: args.query,
  };
}

/**
 * Read the current dashboard id from the page context,
 * Read lazily (only when building the editor URL) rather than injected
 * into every tool call, since most tools don't need it.
 */
function getCurrentDashboardId(contextProvider?: ContextProviderStart): string | undefined {
  const pageContexts = contextProvider?.getAssistantContextStore().getContextsByCategory('page');
  const dashboardContext = pageContexts?.find((ctx) => {
    const value = typeof ctx.value === 'string' ? JSON.parse(ctx.value) : ctx.value;
    return value?.appId === 'dashboards';
  });
  if (!dashboardContext) return undefined;
  const value =
    typeof dashboardContext.value === 'string'
      ? JSON.parse(dashboardContext.value)
      : dashboardContext.value;
  return value?.dashboardId;
}

async function getDashboardName(core: CoreStart, dashboardId: string): Promise<string | undefined> {
  try {
    const savedObject = await core.savedObjects.client.get<{ title?: string }>(
      'dashboard',
      dashboardId
    );
    return savedObject.attributes?.title;
  } catch {
    return undefined;
  }
}

function getAbsoluteTimeRange(
  data: DataPublicPluginStart,
  timeRange?: TimeRange
): TimeRange | undefined {
  if (!timeRange) return undefined;
  const bounds = data.query.timefilter.timefilter.calculateBounds(timeRange);
  if (!bounds.min || !bounds.max) return undefined;
  return { from: bounds.min.toISOString(), to: bounds.max.toISOString() };
}

/**
 * Execute the PPL query and normalize the results into VisData.
 */
async function executePPLQuery(
  preparedQueryObject: PreparedQuery,
  core: CoreStart,
  data: DataPublicPluginStart,
  timeRange?: TimeRange,
  abortSignal?: AbortSignal
): Promise<VisData> {
  const uiSettings = core.uiSettings;
  const dataset = preparedQueryObject.dataset;

  await data.query.queryString.getDatasetService().cacheDataset(
    dataset,
    {
      uiSettings: core.uiSettings,
      savedObjects: core.savedObjects,
      notifications: core.notifications,
      http: core.http,
      data,
    },
    false
  );
  const dataView = await data.dataViews.get(dataset.id);

  const size = uiSettings.get(SAMPLE_SIZE_SETTING);
  const searchSource = await data.search.searchSource.create();

  searchSource.setFields({
    index: dataView,
    size,
    query: preparedQueryObject,
    highlightAll: false,
    version: false,

    // Pass absolute time range so the PPL search interceptor injects
    // it into the query instead of using the global timefilter.
    ...(timeRange && dataset.timeFieldName ? { timeRange } : {}),
  });

  const languageConfig = data.query.queryString
    .getLanguageService()
    .getLanguage(preparedQueryObject.language);

  // Execute query
  const rawResults = await searchSource.fetch({
    abortSignal,
    withLongNumeralsSupport: await uiSettings.get('data:withLongNumerals'),
    ...(languageConfig?.fields?.formatter ? { formatter: languageConfig.fields.formatter } : {}),
  });

  const rawResultsHit = rawResults.hits?.hits ?? [];
  const fieldSchema = searchSource.getDataFrame()?.schema ?? [];
  return normalizeResultRows(rawResultsHit, fieldSchema);
}

/**
 * resolve the chart config from ppl execution columns results
 */
function buildVisConfig(args: AutoVisualizationArgs): VisualizationConfigResult {
  const preparedQueryObject = buildPreparedQuery(args);

  // 1. get normalized schema
  const schema = (args.columns || []).map((col) => ({ name: col.name, type: col.type }));
  const { numericalColumns, categoricalColumns, dateColumns } = normalizeResultRows([], schema);

  // 2. resolve axes mapping and chart type
  const matchChart = resolveChartFromSchema(
    numericalColumns,
    categoricalColumns,
    dateColumns,
    args.potentialChartType
  );

  // 3. build vis config
  const defaultStyles = visualizationRegistry.getVisualization(matchChart.chartType)?.ui.style
    .defaults;

  const visConfig: RenderChartConfig = {
    type: matchChart.chartType,
    axesMapping: matchChart.axesMapping,
    splitField: args.splitField,
    styles: defaultStyles || {},
  };

  return {
    visConfig,
    query: preparedQueryObject,
    success: true,
    resolvedChartType: matchChart.chartType,
    resolvedAxesMapping: matchChart.axesMapping,
  };
}

/**
 * Chart preview that executes the PPL query at render time to fetch the row data,
 */
function ChartPreview({
  query,
  visConfig,
  core,
  data,
  timeRange,
}: {
  query: PreparedQuery;
  visConfig: RenderChartConfig;
  core: CoreStart;
  data: DataPublicPluginStart;
  timeRange?: TimeRange;
}) {
  const [visData, setVisData] = useState<VisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();
    executePPLQuery(query, core, data, timeRange, abortController.signal)
      .then((result) => {
        if (!cancelled) setVisData(result);
      })
      .catch((e) => {
        if (!cancelled && !abortController.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Failed to load chart data');
        }
      });
    return () => {
      cancelled = true;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <EuiCallOut size="s" color="danger" title="Could not render chart">
        <EuiText size="xs">{error}</EuiText>
      </EuiCallOut>
    );
  }

  if (!visData) {
    return (
      <div
        style={{
          height: 250,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EuiLoadingChart size="l" />
      </div>
    );
  }

  if (visData.transformedData.length === 0) {
    return (
      <div style={{ height: 250, width: '100%' }}>
        <VisEditorNoResults />
      </div>
    );
  }

  return (
    <div style={{ height: 250, width: '100%' }}>
      <CommonVisualizationRender
        visualizationData={visData}
        visConfig={visConfig}
        showRawTable={false}
      />
    </div>
  );
}

function ArgsParameters({
  args,
  absoluteTimeRange,
}: {
  args: AutoVisualizationArgs;
  absoluteTimeRange?: TimeRange;
}) {
  const displayArgs = absoluteTimeRange ? { ...args, timeRange: absoluteTimeRange } : args;
  return (
    <EuiAccordion id="auto-vis-args" buttonContent="Parameters" paddingSize="xs">
      <EuiPanel hasBorder paddingSize="s" style={{ wordBreak: 'break-all' }} hasShadow={false}>
        <EuiCodeBlock
          language="json"
          paddingSize="none"
          fontSize="s"
          transparentBackground
          overflowHeight={150}
          isCopyable
        >
          {JSON.stringify(displayArgs, null, 2)}
        </EuiCodeBlock>
      </EuiPanel>
    </EuiAccordion>
  );
}

export function registerAutoVisualizationAction(
  registerAction: (action: any) => void | undefined,
  core: CoreStart,
  data: DataPublicPluginStart,
  contextProvider?: ContextProviderStart
) {
  if (!registerAction) return;

  const renderAutoVisualization = ({
    status,
    args,
    result,
  }: RenderProps<AutoVisualizationArgs>) => {
    if (status === 'complete' && result?.success) {
      return (
        <EuiPanel paddingSize="s" hasShadow={false}>
          {args && <ArgsParameters args={args} absoluteTimeRange={result.resolvedTimeRange} />}
          <ChartPreview
            query={result.preparedQuery}
            visConfig={result.visConfig}
            core={core}
            data={data}
            timeRange={result.resolvedTimeRange}
          />
          <EuiSpacer size="s" />
          <EuiButton
            size="s"
            onClick={() =>
              core.application.navigateToApp(VISUALIZATION_EDITOR_APP_ID, {
                path: result.editorPath,
              })
            }
          >
            Open in Editor
          </EuiButton>
        </EuiPanel>
      );
    }

    return null;
  };

  registerAction({
    ...AutoVisMeta,
    useCustomRenderer: true,
    handler: async (args: AutoVisualizationArgs) => {
      try {
        const { visConfig, query, resolvedChartType, resolvedAxesMapping } = buildVisConfig(args);

        const resolvedTimeRange = getAbsoluteTimeRange(data, args.timeRange);

        const dashboardId = getCurrentDashboardId(contextProvider);

        const dashboardName = dashboardId ? await getDashboardName(core, dashboardId) : undefined;
        const editorPath = buildEditorPath(
          visConfig,
          query,
          resolvedTimeRange,
          dashboardId,
          dashboardName
        );

        return {
          success: true,
          chartType: resolvedChartType,
          resolvedAxesMapping,
          query: args.query,
          indexName: args.indexName,
          editorPath,
          visConfig,
          preparedQuery: query,
          resolvedTimeRange,
          message: `Created ${resolvedChartType} visualization for ${args.indexName}`,
        };
      } catch (error) {
        return {
          success: false,
          query: args.query,
          indexName: args.indexName,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    render: renderAutoVisualization,
  });
}
