/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { UiActionsStart } from '../../../ui_actions/public';
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';
import {
  EmbeddableFactoryDefinition,
  Container,
  ErrorEmbeddable,
} from '../../../embeddable/public';
import { TimeRange } from '../../../data/public';
import { ExploreInput, ExploreOutput } from './types';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import { ExploreEmbeddable } from './explore_embeddable';

interface StartServices {
  executeTriggerActions: UiActionsStart['executeTriggerActions'];
  isEditable: () => boolean;
}

export class ExploreEmbeddableFactory
  implements EmbeddableFactoryDefinition<ExploreInput, ExploreOutput, ExploreEmbeddable> {
  public readonly type = EXPLORE_EMBEDDABLE_TYPE;
  public readonly savedObjectMetaData = {
    name: i18n.translate('explore.savedExplore.savedObjectName', {
      defaultMessage: 'Saved explore',
    }),
    type: 'explore',
    getIconForSavedObject: () => 'search',
    includeFields: ['kibanaSavedObjectMeta'],
  };

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public canCreateNew() {
    return false;
  }

  public isEditable = async () => {
    return (await this.getStartServices()).isEditable();
  };

  public getDisplayName() {
    return i18n.translate('explore.embeddable.displayName', {
      defaultMessage: 'explore',
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
    const editUrl = services.addBasePath(`/app/explorer/discover${url}`);

    try {
      const savedObject = await services.getSavedExploreById(savedObjectId);
      if (!savedObject) {
        throw new Error('Saved object not found');
      }
      const indexPattern = savedObject.searchSource.getField('index');
      const { ExploreEmbeddable: ExploreEmbeddableClass } = await import('./explore_embeddable');
      return new ExploreEmbeddableClass(
        {
          savedExplore: savedObject,
          editUrl,
          editPath: url,
          filterManager,
          editable: services.capabilities.discover?.save as boolean,
          indexPatterns: indexPattern ? [indexPattern] : [],
          services,
        },
        input,
        parent
      );
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      return new ErrorEmbeddable(e, input, parent);
    }
  };

  public async create(input: ExploreInput) {
    return new ErrorEmbeddable('Saved explores can only be created from a saved object', input);
  }
}
