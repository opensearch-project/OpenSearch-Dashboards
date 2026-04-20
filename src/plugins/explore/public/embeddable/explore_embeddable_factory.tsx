/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { SavedObjectAttributes, SimpleSavedObject } from 'opensearch-dashboards/public';

import { UiActionsStart } from '../../../ui_actions/public';
// TODO: should not use getServices from legacy any more
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';
import {
  EmbeddableFactoryDefinition,
  Container,
  ErrorEmbeddable,
} from '../../../embeddable/public';
import {
  ISearchSource,
  TimeRange,
  injectSearchSourceReferences,
  parseSearchSourceJSON,
} from '../../../data/public';
import { DEFAULT_DATA } from '../../../data/common';
import { ExploreInput, ExploreOutput } from './types';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import { ExploreEmbeddable } from './explore_embeddable';
import { VisualizationRegistryService } from '../services/visualization_registry_service';
import { ExploreFlavor, VISUALIZATION_EDITOR_APP_ID } from '../../common';
import { SavedExplore } from '../saved_explore';

interface StartServices {
  executeTriggerActions: UiActionsStart['executeTriggerActions'];
  isEditable: () => boolean;
}

/**
 * For non-INDEX_PATTERN datasets (e.g. INDEXES), the saved search source stores the
 * index as a string id and there is no backing saved-object to resolve it. Prime the
 * dataset cache and swap the `index` field to a hydrated IndexPattern so downstream
 * code that assumes a full IndexPattern (flattenHit, fields.forEach, etc.) works.
 */
async function hydrateSearchSourceIndex(
  searchSource: ISearchSource,
  services: ReturnType<typeof getServices>
) {
  const index = searchSource.getField('index');
  if (!index || typeof index !== 'string') return;
  const query = searchSource.getField('query');
  const dataset = query?.dataset;
  if (!dataset || dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) return;
  try {
    const datasetService = services.data.query.queryString.getDatasetService();
    await datasetService.cacheDataset(dataset, {
      uiSettings: services.uiSettings,
      savedObjects: services.savedObjects,
      notifications: services.toastNotifications,
      http: services.http,
      data: services.data,
    });
    const pattern = await services.data.indexPatterns.get(dataset.id, true);
    if (pattern) {
      searchSource.setField('index', pattern);
    }
  } catch (e) {
    // Leave as string; downstream has defensive guards.
  }
}

export class ExploreEmbeddableFactory
  implements EmbeddableFactoryDefinition<ExploreInput, ExploreOutput, ExploreEmbeddable> {
  public readonly type = EXPLORE_EMBEDDABLE_TYPE;
  public readonly savedObjectMetaData = {
    name: i18n.translate('explore.savedExplore.savedObjectName', {
      defaultMessage: 'Saved explore',
    }),
    type: 'explore',
    getIconForSavedObject: ({ attributes }: SimpleSavedObject<SavedObjectAttributes>) => {
      let iconType = '';
      try {
        const vis = JSON.parse(attributes.visualization as string);
        const chart = this.visualizationRegistryService
          .getRegistry()
          .getAvailableChartTypes()
          .find((t) => t.type === vis.chartType);
        if (chart) {
          iconType = chart.icon;
        }
      } catch (e) {
        iconType = '';
      }
      return iconType;
    },
    includeFields: ['kibanaSavedObjectMeta', 'visualization'],
  };

  constructor(
    private getStartServices: () => Promise<StartServices>,
    private readonly visualizationRegistryService: VisualizationRegistryService
  ) {}

  public canCreateNew() {
    return false;
  }

  public isEditable = async () => {
    return (await this.getStartServices()).isEditable();
  };

  public getDisplayName() {
    return i18n.translate('explore.embeddable.displayName', {
      defaultMessage: 'visualization',
    });
  }

  public createFromSavedObject = async (
    savedObjectId: string,
    input: Partial<ExploreInput> & { id: string; timeRange: TimeRange },
    parent?: Container
  ): Promise<ExploreEmbeddable | ErrorEmbeddable> => {
    const services = getServices();
    const filterManager = services.filterManager;
    const url = await services.getSavedExploreUrlById(savedObjectId);

    try {
      const savedObject = await services.getSavedExploreById(savedObjectId);
      if (!savedObject) {
        throw new Error('Saved object not found');
      }
      await hydrateSearchSourceIndex(savedObject.searchSource, services);
      const indexPattern = savedObject.searchSource.getField('index');
      const { executeTriggerActions } = await this.getStartServices();
      const { ExploreEmbeddable: ExploreEmbeddableClass } = await import('./explore_embeddable');
      const flavor = savedObject.type ?? ExploreFlavor.Logs;
      const editUrl = savedObject.type
        ? services.addBasePath(`/app/explore/${flavor}/${url}`)
        : services.addBasePath(`/app/${VISUALIZATION_EDITOR_APP_ID}#/edit/${savedObjectId}`);

      // for in-context created visualization
      const editPath = !savedObject.type ? `#/edit/${savedObjectId}` : url;

      const editApp = !savedObject.type ? VISUALIZATION_EDITOR_APP_ID : `explore/${flavor}`;

      return new ExploreEmbeddableClass(
        {
          savedExplore: savedObject,
          editUrl,
          editPath,
          filterManager,
          editable: services.capabilities.discover?.save as boolean,
          indexPatterns: indexPattern ? [indexPattern] : [],
          services,
          editApp,
        },
        input,
        executeTriggerActions,
        parent
      );
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      return new ErrorEmbeddable(e, input, parent);
    }
  };

  /**
   * Creates a by-value explore embeddable from input without a stored saved object.
   */
  public async create(
    input: ExploreInput,
    parent?: Container
  ): Promise<ExploreEmbeddable | ErrorEmbeddable> {
    if (!input.attributes) {
      return new ErrorEmbeddable(
        'Attributes are required. Use createFromSavedObject to create from a saved object id',
        input,
        parent
      );
    }

    const services = getServices();
    const filterManager = services.filterManager;
    const attributes = input.attributes;
    const references = input.references || [];

    try {
      let searchSourceValues = parseSearchSourceJSON(
        attributes.kibanaSavedObjectMeta!.searchSourceJSON
      );
      searchSourceValues = injectSearchSourceReferences(searchSourceValues, references);
      const searchSource = await services.data.search.searchSource.create(searchSourceValues);
      await hydrateSearchSourceIndex(searchSource, services);
      const indexPattern = searchSource.getField('index');

      const savedExplore = {
        id: input.id,
        ...input.attributes,
        searchSource,
      } as SavedExplore;

      const { executeTriggerActions } = await this.getStartServices();
      const { ExploreEmbeddable: ExploreEmbeddableClass } = await import('./explore_embeddable');
      const flavor = savedExplore.type;

      return new ExploreEmbeddableClass(
        {
          savedExplore,
          editUrl: '', // by-value embeddables cannot be edited
          editPath: '',
          filterManager,
          editable: false,
          indexPatterns: indexPattern ? [indexPattern] : [],
          services,
          editApp: `explore/${flavor}`,
        },
        input,
        executeTriggerActions,
        parent
      );
    } catch (e) {
      return new ErrorEmbeddable(e, input, parent);
    }
  }
}
