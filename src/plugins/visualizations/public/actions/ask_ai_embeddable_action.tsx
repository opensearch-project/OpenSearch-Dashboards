/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { get } from 'lodash';
import { parse as parseHjson } from 'hjson';
import html2canvas from 'html2canvas-pro';
import { EmbeddableContext, IEmbeddable } from '../../../embeddable/public';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { CoreStart } from '../../../../core/public';
import { ContextProviderStart } from '../../../context_provider/public';
import { IndexPatternsContract } from '../../../data/public';
import { Vis } from '../vis';
import { UNSUPPORTED_ENGINE_TYPES } from '../../../data/common';

interface VisualizeEmbeddable extends IEmbeddable {
  vis: Vis;
  domNode: HTMLElement;
}

export const ASK_AI_VISUALIZE_EMBEDDABLE_ACTION = 'ASK_AI_VISUALIZE_EMBEDDABLE_ACTION';

// Extend the ActionContextMapping to include our action
declare module '../../../ui_actions/public' {
  export interface ActionContextMapping {
    [ASK_AI_VISUALIZE_EMBEDDABLE_ACTION]: EmbeddableContext;
  }
}

export class AskAIVisualizeEmbeddableAction implements Action<EmbeddableContext> {
  public readonly type = ASK_AI_VISUALIZE_EMBEDDABLE_ACTION;
  public readonly id = ASK_AI_VISUALIZE_EMBEDDABLE_ACTION;
  public order = 20;

  public grouping: Action['grouping'] = [
    {
      id: ASK_AI_VISUALIZE_EMBEDDABLE_ACTION,
      getDisplayName: () => this.getDisplayName(),
      getIconType: () => this.getIconType(),
      category: 'investigation',
      order: 20,
    },
  ];

  // `isCompatible` is invoked frequently (panel renders, context-menu opens), so resolved engine
  // types are memoized to avoid repeating saved-object lookups for the same data source. A data
  // source's engine type does not change within a session.
  private readonly engineTypeByIdCache = new Map<string, string | undefined>();
  private readonly engineTypeByNameCache = new Map<string, string | undefined>();
  // Whether a given index pattern is backed by an unsupported engine. Memoized for the same
  // reason; the underlying `getCache` call otherwise re-fetches data sources on every call.
  private readonly analyticEngineByIndexPatternCache = new Map<string, boolean>();

  constructor(
    private readonly core: CoreStart,
    private readonly indexPatterns: IndexPatternsContract,
    private readonly contextProvider?: ContextProviderStart
  ) {}

  public getIconType(): EuiIconType {
    return 'editorComment';
  }

  public getDisplayName() {
    return i18n.translate('visualizations.actions.askAIEmbeddable.displayName', {
      defaultMessage: 'Ask AI',
    });
  }

  public async isCompatible({ embeddable }: EmbeddableContext) {
    // Check if this is a visualization embeddable and if context provider is available
    const hasContextProvider = this.contextProvider !== undefined;
    if (
      !(embeddable.type === 'visualization' && hasContextProvider && this.core.chat.isAvailable())
    ) {
      return false;
    }
    // Hide the action when the visualization is backed by an AnalyticEngine data source.
    const visEmbeddable = embeddable as VisualizeEmbeddable;
    const usesAnalyticEngine = await this.usesAnalyticEngineDataSource(visEmbeddable.vis);
    return !usesAnalyticEngine;
  }

  /**
   * Resolves whether a visualization uses an AnalyticEngine data source. Each visualization type
   * references its data source differently, so they are handled by type here. We fail open
   * (return false) whenever the data source cannot be resolved, so the action stays available.
   */
  private async usesAnalyticEngineDataSource(vis: Vis): Promise<boolean> {
    const params: any = vis.params || {};

    switch (vis.type?.name) {
      // TSVB references the data source directly by id.
      case 'metrics':
        return this.isAnalyticEngineById(params.data_source_id);

      // Vega references one or more data sources by name inside its spec.
      case 'vega':
        return this.isAnalyticEngineByNames(extractVegaDataSourceNames(params.spec));

      // Timeline references data sources by name inside its expression string.
      case 'timelion':
        return this.isAnalyticEngineByNames(extractTimelineDataSourceNames(params.expression));

      // Input controls reference index patterns per control; an AnalyticEngine-backed index
      // pattern is excluded from the engine-filtered cache.
      case 'input_control_vis': {
        const indexPatternIds: string[] = (params.controls || [])
          .map((control: { indexPattern?: string }) => control.indexPattern)
          .filter(Boolean);
        return this.hasAnalyticEngineIndexPattern(indexPatternIds);
      }

      // Default: aggregation-based visualizations expose `vis.data.indexPattern`.
      default: {
        const indexPatternId = vis.data.indexPattern?.id;
        return indexPatternId ? this.hasAnalyticEngineIndexPattern([indexPatternId]) : false;
      }
    }
  }

  private async isAnalyticEngineById(dataSourceId?: string): Promise<boolean> {
    if (!dataSourceId) {
      return false;
    }
    if (!this.engineTypeByIdCache.has(dataSourceId)) {
      try {
        const dataSource = await this.core.savedObjects.client.get<{
          dataSourceEngineType?: string;
        }>('data-source', dataSourceId);
        this.engineTypeByIdCache.set(dataSourceId, dataSource?.attributes?.dataSourceEngineType);
      } catch {
        // Do not cache failures so a transient error can be retried later.
        return false;
      }
    }
    const engineType = this.engineTypeByIdCache.get(dataSourceId);
    return !!engineType && UNSUPPORTED_ENGINE_TYPES.includes(engineType);
  }

  private async isAnalyticEngineByNames(dataSourceNames: string[]): Promise<boolean> {
    if (dataSourceNames.length === 0) {
      return false;
    }
    for (const name of dataSourceNames) {
      if (!this.engineTypeByNameCache.has(name)) {
        try {
          const response = await this.core.savedObjects.client.find<{
            title?: string;
            dataSourceEngineType?: string;
          }>({
            type: 'data-source',
            perPage: 10,
            search: `"${name}"`,
            searchFields: ['title'],
            fields: ['title', 'dataSourceEngineType'],
          });
          // `data_source_name` could be a prefix of another name, so match exactly.
          const match = response.savedObjects.find((obj) => obj.attributes?.title === name);
          this.engineTypeByNameCache.set(name, match?.attributes?.dataSourceEngineType);
        } catch {
          // Do not cache failures; skip this name and keep the action available.
          continue;
        }
      }
      const engineType = this.engineTypeByNameCache.get(name);
      if (engineType && UNSUPPORTED_ENGINE_TYPES.includes(engineType)) {
        return true;
      }
    }
    return false;
  }

  private async hasAnalyticEngineIndexPattern(indexPatternIds: string[]): Promise<boolean> {
    if (indexPatternIds.length === 0) {
      return false;
    }

    // Resolve any ids we have not classified yet via a single engine-filtered cache lookup.
    const uncachedIds = indexPatternIds.filter(
      (id) => !this.analyticEngineByIndexPatternCache.has(id)
    );
    if (uncachedIds.length > 0) {
      const cache = await this.indexPatterns.getCache({
        excludeEngineTypes: UNSUPPORTED_ENGINE_TYPES,
      });
      if (!cache) {
        // Cache unavailable — fail open without memoizing so it can be retried later.
        return false;
      }
      // Index patterns backed by an unsupported engine are excluded from the cache, so any id
      // missing from it is AnalyticEngine-backed.
      const allowedIds = new Set(cache.map((ip) => ip.id));
      for (const id of uncachedIds) {
        this.analyticEngineByIndexPatternCache.set(id, !allowedIds.has(id));
      }
    }

    return indexPatternIds.some((id) => this.analyticEngineByIndexPatternCache.get(id));
  }

  public async execute({ embeddable }: EmbeddableContext) {
    if (!(await this.isCompatible({ embeddable }))) {
      throw new IncompatibleActionError();
    }

    const visEmbeddable = embeddable as VisualizeEmbeddable;

    // Extract visualization context
    const savedObjectId = get(visEmbeddable.getInput(), 'savedObjectId', '');
    const title = visEmbeddable.getTitle() || 'Untitled Visualization';
    const visType = visEmbeddable.vis.type.name;

    // Get current filters, query, and time range
    const input = visEmbeddable.getInput();
    const timeRange = input.timeRange;
    const filters = input.filters;
    const query = visEmbeddable.vis.data.searchSource?.getField('query');

    try {
      // Capture visualization as base64 image
      let visualizationBase64 = '';

      const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
      if (nonce) {
        html2canvas.setCspNonce(nonce);
      }
      const canvas = await html2canvas(visEmbeddable.domNode, {
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      // Use JPEG format with low quality to save tokens
      visualizationBase64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

      // Create context for the assistant with summary
      const visualizationContext = {
        title,
        visType,
        savedObjectId,
        timeRange,
        query: query?.query,
        filters,
        indexPattern: visEmbeddable.vis.data.indexPattern?.title,
      };

      // Add context to the context provider
      if (this.contextProvider) {
        const contextStore = this.contextProvider.getAssistantContextStore();
        await contextStore.addContext({
          id: `visualization-${savedObjectId || embeddable.id}`,
          description: `Visualization: ${title}`,
          value: visualizationContext,
          label: `Visualization: ${title}`,
          categories: ['visualization', 'dashboard', 'chat'],
        });
      }

      // Send visualization screenshot to chat
      if (this.core.chat) {
        // Create a message with the visualization image following AG-UI protocol
        const imageMessage = {
          role: 'user' as const,
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          content: [
            {
              type: 'binary' as const,
              mimeType: 'image/jpeg',
              data: visualizationBase64,
            },
          ],
        };

        // sendMessageWithWindow will open the chat window and send the message
        await this.core.chat.sendMessageWithWindow(
          'Give me a summary for the selected visualization',
          [imageMessage]
        );
      }
    } catch (error) {
      this.core.notifications.toasts.addDanger({
        title: i18n.translate('visualizations.actions.askAIEmbeddable.errorTitle', {
          defaultMessage: 'Failed to add visualization context',
        }),
        text: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Extracts every `data_source_name` referenced by a Vega spec. The spec's `data` field may be a
 * single object or an array of objects, each optionally carrying a `url.data_source_name`.
 */
function extractVegaDataSourceNames(spec: unknown): string[] {
  if (typeof spec !== 'string' || !spec.trim()) {
    return [];
  }
  let parsed: any;
  try {
    parsed = parseHjson(spec, { legacyRoot: false, keepWsc: true });
  } catch {
    // If we cannot parse the spec, skip the name-based check and fail open.
    return [];
  }
  const dataField = parsed?.data;
  const dataObjects = Array.isArray(dataField) ? dataField : dataField ? [dataField] : [];
  const names = new Set<string>();
  for (const dataObject of dataObjects) {
    const name = dataObject?.url?.data_source_name;
    if (typeof name === 'string' && name) {
      names.add(name);
    }
  }
  return Array.from(names);
}

/**
 * Extracts every `data_source_name` referenced by a Timeline expression, e.g.
 * `.opensearch(index=*, data_source_name="my source")`. Names may be quoted (to allow spaces)
 * or unquoted.
 */
function extractTimelineDataSourceNames(expression: unknown): string[] {
  if (typeof expression !== 'string' || !expression) {
    return [];
  }
  const names = new Set<string>();
  const regex = /data_source_name\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s,)]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(expression)) !== null) {
    const name = match[1] ?? match[2] ?? match[3];
    if (name) {
      names.add(name);
    }
  }
  return Array.from(names);
}
