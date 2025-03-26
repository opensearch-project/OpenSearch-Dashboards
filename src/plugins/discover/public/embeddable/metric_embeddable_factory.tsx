/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';
import { UiActionsStart } from 'src/plugins/ui_actions/public';
import { getServices } from '../opensearch_dashboards_services';
import {
  EmbeddableFactoryDefinition,
  Container,
  ErrorEmbeddable,
} from '../../../embeddable/public';
import { MetricEmbeddable, MetricInput, MetricOutput } from './types';
import { METRIC_EMBEDDABLE_TYPE } from './constants';

interface StartServices {
  executeTriggerActions: UiActionsStart['executeTriggerActions'];
  isEditable: () => boolean;
}

export class MetricEmbeddableFactory
  implements EmbeddableFactoryDefinition<MetricInput, MetricOutput, MetricEmbeddable> {
  public readonly type = METRIC_EMBEDDABLE_TYPE;
  public readonly savedObjectMetaData = {
    name: i18n.translate('discover.savedMetric.savedObjectName', {
      defaultMessage: 'Saved metric',
    }),
    type: 'metric',
    getIconForSavedObject: () => 'metric',
  };

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public canCreateNew() {
    return false;
  }

  public isEditable = async () => {
    return false;
  };

  public getDisplayName() {
    return i18n.translate('discover.embeddable.metric.displayName', {
      defaultMessage: 'metric',
    });
  }

  public createFromSavedObject = async (
    savedMetricId: string,
    input: Partial<MetricInput> & { id: string },
    parent?: Container
  ): Promise<MetricEmbeddable | ErrorEmbeddable> => {
    const services = getServices();

    try {
      const savedObject = await services.getSavedMetricById(savedMetricId);
      const { executeTriggerActions } = await this.getStartServices();
      const { MetricEmbeddable: MetricEmbeddableClass } = await import('./metric_embeddable');
      return new MetricEmbeddableClass(
        {
          savedMetric: savedObject,
          editable: false,
          indexPatterns: [],
          services,
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

  public async create(input: MetricInput) {
    return new ErrorEmbeddable('Saved metric can only be created from a saved object', input);
  }
}
