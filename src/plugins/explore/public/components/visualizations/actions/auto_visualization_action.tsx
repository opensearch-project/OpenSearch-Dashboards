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
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { AutoVisMeta } from './utils';

export const AUTO_VISUALIZATION_TOOL_NAME = 'auto_create_visualization';

export interface AutoVisualizationArgs {
  query: string;
  indexName: string;
  // user intended chart type
  potentialChartType?: string;
  columns: Array<{ name: string; type: string }>;
  splitField?: string;
  // used to build dataset, without it time range search bar will not show
  timeFieldName?: string;
  // injected by chat from the current page context
  timeRange?: TimeRange;
  // used to build dataset
  datasourceId?: string;
  datasourceTitle?: string;
  dashboardId?: string;
  // the time range the llm passed
  from?: string;
  to?: string;
}

export interface PreparedQuery {
  dataset: Dataset;
  language: string;
  query: string;
}

export interface VisualizationConfigResult {
  success: true;
  visConfig: RenderChartConfig;
  query: PreparedQuery;
  resolvedChartType: ChartType;
  resolvedAxesMapping: AxisFieldNameMappings;
}

const DASHBOARDS_APP_ID = 'dashboards';

function buildEditorPath(
  visConfig: RenderChartConfig,
  query: PreparedQuery,
  timeRange?: TimeRange,
  dashboardId?: string,
  dashboardName?: string,
  originatingApp?: string
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
  const cParam = originatingApp
    ? `&_c=${encodeURIComponent(
        rison.encode({
          originatingApp,
          ...(dashboardId && {
            containerInfo: {
              containerId: dashboardId,
              ...(dashboardName && { containerName: dashboardName }),
            },
          }),
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
export function buildPreparedQuery(args: AutoVisualizationArgs): PreparedQuery {
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
  return { dataset, language: 'PPL', query: args.query };
}

/**
 * Read the current dashboard id from the page context,
 * Read lazily (only when building the editor URL) rather than injected
 * into every tool call, since most tools don't need it.
 */
function getCurrentDashboardContext(contextProvider?: ContextProviderStart): {
  originatingApp?: string;
  dashboardId?: string;
} {
  const pageContexts = contextProvider?.getAssistantContextStore().getContextsByCategory('page');
  const dashboardContext = pageContexts?.find((ctx) => {
    const value = typeof ctx.value === 'string' ? JSON.parse(ctx.value) : ctx.value;
    return value?.appId === DASHBOARDS_APP_ID;
  });
  if (!dashboardContext) return {};
  const value =
    typeof dashboardContext.value === 'string'
      ? JSON.parse(dashboardContext.value)
      : dashboardContext.value;
  return { originatingApp: DASHBOARDS_APP_ID, dashboardId: value?.dashboardId };
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

export function getAbsoluteTimeRange(
  data: DataPublicPluginStart,
  args: Pick<AutoVisualizationArgs, 'from' | 'to' | 'timeRange'>
): TimeRange | undefined {
  const time = args.from && args.to ? { from: args.from, to: args.to } : undefined;

  // if there is not timeRange in page context use global time filter
  const range = time ?? args?.timeRange ?? data.query.timefilter.timefilter.getTime();
  const bounds = data.query.timefilter.timefilter.calculateBounds(range);
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
): Promise<{ rawRows: OpenSearchSearchHit[]; rawSchema: Array<{ name?: string; type?: string }> }> {
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

  return {
    rawRows: rawResults.hits?.hits ?? [],
    rawSchema: searchSource.getDataFrame()?.schema ?? [],
  };
}

/**
 * resolve the chart config from ppl execution columns results.
 */
export function buildVisConfig(args: AutoVisualizationArgs): VisualizationConfigResult {
  const preparedQueryObject = buildPreparedQuery(args);

  // 1. get normalized schema — use post-transformation schema when available
  const originalSchema = (args.columns || []).map((col) => ({ name: col.name, type: col.type }));

  const { numericalColumns, categoricalColumns, dateColumns } = normalizeResultRows(
    [],
    originalSchema
  );

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
export function ChartPreview({
  query,
  visConfig,
  core,
  data,
  timeRange,
  onError,
}: {
  query: PreparedQuery;
  visConfig: RenderChartConfig;
  core: CoreStart;
  data: DataPublicPluginStart;
  timeRange?: TimeRange;
  onError?: (message: string) => void;
}) {
  const [visData, setVisData] = useState<VisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    executePPLQuery(query, core, data, timeRange, abortController.signal)
      .then(({ rawRows, rawSchema }) => {
        if (cancelled) return;

        setVisData(normalizeResultRows(rawRows, rawSchema));
      })
      .catch((e) => {
        if (!cancelled && !abortController.signal.aborted) {
          const message = e instanceof Error ? e.message : 'Failed to load chart data';
          setError(message);
          onError?.(message);
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
  const { from, to, ...restArgs } = args;
  const displayArgs = absoluteTimeRange ? { ...restArgs, timeRange: absoluteTimeRange } : restArgs;
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

function getCurrentAppId(core: CoreStart): string | undefined {
  let appId: string | undefined;
  const subscription = core.application.currentAppId$.subscribe((id) => {
    appId = id;
  });
  subscription.unsubscribe();
  return appId;
}

function openVisualizationEditor(core: CoreStart, editorPath: string) {
  const visEditorAppBase = core.http.basePath.prepend(`/app/${VISUALIZATION_EDITOR_APP_ID}`);
  if (getCurrentAppId(core) === VISUALIZATION_EDITOR_APP_ID) {
    // When already on the vis editor app, navigateToApp only calls history.push without
    // remounting the page, so the new URL params are ignored by the already-initialized
    // component. Use window.location.href instead to force a full navigation that
    // unmounts and remounts the app.
    window.location.href = `${visEditorAppBase}${editorPath}`;
  } else {
    core.application.navigateToApp(VISUALIZATION_EDITOR_APP_ID, { path: editorPath });
  }
}

export function checkTimeRangeArgsUsable(args: {
  from?: string;
  to?: string;
  timeFieldName?: string;
}): void {
  if (!args.from || !args.to) return;

  if (!args.timeFieldName) {
    throw new Error(
      'A time range (from/to) cannot be applied without timeFieldName, so it would be ignored. ' +
        'Either call the index mapping tool to look up the time field and pass it as ' +
        'timeFieldName, or omit from/to if this index has no time field.'
    );
  }
}

export function registerAutoVisualizationAction(
  registerAction: ((action: any) => void) | undefined,
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
        <EuiPanel paddingSize="s" grow={false} hasShadow={false}>
          {args && <ArgsParameters args={args} absoluteTimeRange={result.resolvedTimeRange} />}
          <ChartPreview
            query={result.preparedQuery}
            visConfig={result.visConfig}
            core={core}
            data={data}
            timeRange={result.resolvedTimeRange}
          />
          <EuiSpacer size="s" />
          <EuiButton size="s" onClick={() => openVisualizationEditor(core, result.editorPath)}>
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
        checkTimeRangeArgsUsable(args);

        const { visConfig, query, resolvedChartType, resolvedAxesMapping } = buildVisConfig(args);
        const resolvedTimeRange = getAbsoluteTimeRange(data, args);
        const { originatingApp, dashboardId } = getCurrentDashboardContext(contextProvider);

        const dashboardName = dashboardId ? await getDashboardName(core, dashboardId) : undefined;
        const editorPath = buildEditorPath(
          visConfig,
          query,
          resolvedTimeRange,
          dashboardId,
          dashboardName,
          originatingApp
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
