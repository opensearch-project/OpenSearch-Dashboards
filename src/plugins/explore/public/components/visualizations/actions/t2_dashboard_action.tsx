/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import rison from 'rison-node';
import {
  EuiPanel,
  EuiText,
  EuiSpacer,
  EuiButton,
  EuiCheckbox,
  EuiTitle,
  EuiFlexItem,
  EuiFlexGroup,
  EuiCallOut,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { RenderProps } from '../../../../../context_provider/public';
import { DataPublicPluginStart, TimeRange } from '../../../../../data/public';
import { RenderChartConfig } from '../../../components/visualizations/types';
import { UrlTransformationState } from '../../../components/data_transformations';
import { SavedExploreLoader } from '../../../types/saved_explore_types';
import {
  buildVisConfig,
  getAbsoluteTimeRange,
  ChartPreview,
  PreparedQuery,
  checkTimeRangeArgsUsable,
} from './auto_visualization_action';
import { TextToDashboardMeta } from './utils';
import { getDashboardVersion } from '../../../application/legacy/discover/opensearch_dashboards_services';

interface VisualizationConfig {
  query: string;
  indexName: string;
  columns: Array<{ name: string; type: string }>;
  title: string;
  potentialChartType?: string;
  splitField?: string;
  timeFieldName?: string;
  transformations?: UrlTransformationState[];
  sampleRow?: Record<string, unknown>;
}

interface TextToDashboardArgs {
  visualizations: VisualizationConfig[];
  timeRange?: TimeRange;
  datasourceId?: string;
  datasourceTitle?: string;
  // the time range the llm passed
  from?: string;
  to?: string;
}

export interface GeneratedVis {
  title: string;
  visConfig?: RenderChartConfig;
  preparedQuery?: PreparedQuery;
  resolvedTimeRange?: TimeRange;
  transformations?: UrlTransformationState[];
  error?: string;
}

type RenderableVis = GeneratedVis & {
  visConfig: RenderChartConfig;
  preparedQuery: PreparedQuery;
};

function isRenderable(vis: GeneratedVis): vis is RenderableVis {
  return !vis.error && Boolean(vis.visConfig) && Boolean(vis.preparedQuery);
}

interface TextToDashboardResult {
  success: true;
  visualizations: GeneratedVis[];
  resolvedTimeRange?: TimeRange;
}

function VisualizationCard({
  vis,
  index,
  checked,
  onToggle,
  core,
  data,
}: {
  vis: GeneratedVis;
  index: number;
  checked: boolean;
  onToggle: (index: number) => void;
  core: CoreStart;
  data: DataPublicPluginStart;
}) {
  const renderable = isRenderable(vis);

  return (
    <EuiPanel paddingSize="s" hasBorder hasShadow={false}>
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiCheckbox
            id={`t2-dash-vis-${index}`}
            checked={checked}
            disabled={!renderable}
            onChange={() => onToggle(index)}
            aria-label={`Include "${vis.title}" in the dashboard`}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>{vis.title}</h4>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      {renderable ? (
        <div style={{ height: 250 }}>
          <ChartPreview
            query={vis.preparedQuery}
            visConfig={vis.visConfig}
            core={core}
            data={data}
            timeRange={vis.resolvedTimeRange}
            transformations={vis.transformations}
          />
        </div>
      ) : (
        <EuiCallOut size="s" color="danger" title="Could not render chart">
          <EuiText size="xs">{vis.error ?? 'Chart configuration is incomplete.'}</EuiText>
        </EuiCallOut>
      )}
    </EuiPanel>
  );
}

function TextToDashboardRenderer({
  result,
  core,
  data,
  savedExploreLoader,
}: {
  result: TextToDashboardResult;
  core: CoreStart;
  data: DataPublicPluginStart;
  savedExploreLoader: SavedExploreLoader;
}) {
  const { visualizations, resolvedTimeRange: timeRange } = result;

  const [selected, setSelected] = useState<boolean[]>(() => visualizations.map(isRenderable));
  const [isSaving, setIsSaving] = useState(false);

  const [saveErrors, setSaveErrors] = useState<{ messages: string[]; partial: boolean }>({
    messages: [],
    partial: false,
  });

  const hasSuccess = visualizations.some(isRenderable);
  const hasSelected = selected.some((s, i) => s && isRenderable(visualizations[i]));

  const handleToggle = (index: number) => {
    setSelected((prev) => prev.map((s, i) => (i === index ? !s : s)));
  };

  const handleSaveToDashboard = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveErrors({ messages: [], partial: false });

    const selectedVis = visualizations.filter((v, i) => selected[i]).filter(isRenderable);
    const { version } = getDashboardVersion();
    const PANEL_WIDTH = 24;
    const PANEL_HEIGHT = 15;

    const savedVis = await Promise.all(
      selectedVis.map(async (vis): Promise<{ id?: string; error?: string }> => {
        try {
          await data.query.queryString.getDatasetService().cacheDataset(
            vis.preparedQuery.dataset,
            {
              uiSettings: core.uiSettings,
              savedObjects: core.savedObjects,
              notifications: core.notifications,
              http: core.http,
              data,
            },
            false
          );
          const dataView = await data.dataViews.get(vis.preparedQuery.dataset.id);

          // Create a new unsaved SavedExplore instance
          const savedExplore = await savedExploreLoader.get('');
          savedExplore.title = vis.title;
          savedExplore.version = 1;
          savedExplore.type = undefined;

          savedExplore.visualization = JSON.stringify({
            title: '',
            chartType: vis.visConfig.type,
            params: vis.visConfig.styles ?? {},
            axesMapping: vis.visConfig.axesMapping,
            splitField: vis.visConfig.splitField,
            dataTransformations: vis.transformations,
          });

          savedExplore.searchSourceFields = {
            index: dataView,
            query: vis.preparedQuery,
          };

          // always create a new object
          savedExplore.copyOnSave = true;

          const id = await savedExplore.save({
            confirmOverwrite: false,
            isTitleDuplicateConfirmed: true, // skip duplicate name check
          });
          if (!id) {
            return { error: `Failed to save "${vis.title}": no id returned` };
          }
          return { id };
        } catch (e) {
          return {
            error: `Failed to save "${vis.title}": ${e instanceof Error ? e.message : String(e)}`,
          };
        }
      })
    );

    const savedIds = savedVis.map((o) => o.id).filter((id): id is string => Boolean(id));
    const errors = savedVis.map((o) => o.error).filter((e): e is string => Boolean(e));

    setIsSaving(false);

    if (savedIds.length === 0) {
      setSaveErrors({ messages: errors, partial: false });
      core.notifications.toasts.addDanger({
        title: 'Could not save visualizations',
        text: errors.join('; '),
      });
      return;
    }

    if (errors.length > 0) {
      setSaveErrors({ messages: errors, partial: true });
      core.notifications.toasts.addWarning({
        title: 'Some visualizations could not be saved',
        text: errors.join('; '),
      });
    }

    // two columns dashboard
    const panels = savedIds.map((id, i) => ({
      type: 'explore',
      id,
      panelIndex: String(i + 1),
      gridData: {
        x: (i % 2) * PANEL_WIDTH,
        y: Math.floor(i / 2) * PANEL_HEIGHT,
        w: PANEL_WIDTH,
        h: PANEL_HEIGHT,
        i: String(i + 1),
      },
      version,
    }));

    const appState = {
      panels,
      viewMode: 'edit',
    };

    const gParam = timeRange
      ? `&_g=${encodeURIComponent(rison.encode({ time: { from: timeRange.from, to: timeRange.to } }))}`
      : '';
    const aParam = encodeURIComponent(rison.encode(appState));
    const dashboardPath = `#/create?_a=${aParam}${gParam}`;

    core.application.navigateToApp('dashboards', { path: dashboardPath });
  };

  return (
    <EuiPanel paddingSize="s" grow={false} hasShadow={false}>
      {saveErrors.messages.length > 0 && (
        <>
          <EuiCallOut
            size="s"
            color={saveErrors.partial ? 'warning' : 'danger'}
            title={
              saveErrors.partial
                ? 'Some visualizations could not be saved'
                : 'Unable to save visualizations'
            }
          >
            {saveErrors.messages.map((err, i) => (
              <EuiText key={i} size="xs">
                {err}
              </EuiText>
            ))}
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
          gap: 12,
        }}
      >
        {visualizations.map((vis, i) => (
          <VisualizationCard
            key={i}
            vis={vis}
            index={i}
            checked={selected[i]}
            onToggle={handleToggle}
            core={core}
            data={data}
          />
        ))}
      </div>

      {hasSuccess && (
        <>
          <EuiSpacer size="s" />
          <EuiButton
            size="s"
            fill
            disabled={!hasSelected || isSaving}
            isLoading={isSaving}
            onClick={handleSaveToDashboard}
          >
            Save to Dashboard
          </EuiButton>
        </>
      )}
    </EuiPanel>
  );
}

export function registerT2DashboardAction(
  registerAction: ((action: any) => void) | undefined,
  core: CoreStart,
  data: DataPublicPluginStart,
  savedExploreLoader: SavedExploreLoader
) {
  if (!registerAction) return;

  const renderT2Dashboard = ({ status, result }: RenderProps<TextToDashboardArgs>) => {
    if (status === 'complete' && result?.success) {
      return (
        <TextToDashboardRenderer
          result={result}
          core={core}
          data={data}
          savedExploreLoader={savedExploreLoader}
        />
      );
    }
    return null;
  };

  registerAction({
    ...TextToDashboardMeta,
    useCustomRenderer: true,
    handler: async (args: TextToDashboardArgs): Promise<TextToDashboardResult> => {
      const resolvedTimeRange = getAbsoluteTimeRange(data, args);

      const visualizations: GeneratedVis[] = args.visualizations.map((vis) => {
        try {
          // The time range is dashboard-level but timeFieldName is per index, so the shared
          // range has to be checked against each spec.
          checkTimeRangeArgsUsable({
            from: args.from,
            to: args.to,
            timeFieldName: vis.timeFieldName,
          });

          const { visConfig, query: preparedQuery } = buildVisConfig({
            ...vis,
            datasourceId: args.datasourceId,
            datasourceTitle: args.datasourceTitle,
            timeRange: args.timeRange,
          });

          return {
            title: vis.title.trim(),
            visConfig,
            preparedQuery,
            resolvedTimeRange,
            transformations: vis.transformations,
          };
        } catch (e) {
          return {
            title: vis.title.trim(),
            error: e instanceof Error ? e.message : String(e),
          };
        }
      });

      return { success: true, visualizations, resolvedTimeRange };
    },
    render: renderT2Dashboard,
  });
}
