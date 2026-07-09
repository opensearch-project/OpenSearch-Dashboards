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
  TimeRange,
  injectSearchSourceReferences,
  parseSearchSourceJSON,
} from '../../../data/public';
import { AgentTracesInput, AgentTracesOutput } from './types';
import { AGENT_TRACES_EMBEDDABLE_TYPE } from './constants';
import { AgentTracesEmbeddable } from './agent_traces_embeddable';
import { AgentTracesFlavor } from '../../common';
import { SavedAgentTraces } from '../saved_agent_traces';

interface StartServices {
  executeTriggerActions: UiActionsStart['executeTriggerActions'];
  isEditable: () => boolean;
}

export class AgentTracesEmbeddableFactory
  implements
    EmbeddableFactoryDefinition<AgentTracesInput, AgentTracesOutput, AgentTracesEmbeddable> {
  public readonly type = AGENT_TRACES_EMBEDDABLE_TYPE;
  public readonly savedObjectMetaData = {
    name: i18n.translate('agentTraces.savedAgentTraces.savedObjectName', {
      defaultMessage: 'Saved agent traces',
    }),
    type: 'agentTraces',
    getIconForSavedObject: (_savedObject: SimpleSavedObject<SavedObjectAttributes>) => {
      return 'discoverApp';
    },
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
    return i18n.translate('agentTraces.embeddable.displayName', {
      defaultMessage: 'visualization in discover',
    });
  }

  public createFromSavedObject = async (
    savedObjectId: string,
    input: Partial<AgentTracesInput> & { id: string; timeRange: TimeRange },
    parent?: Container
  ): Promise<AgentTracesEmbeddable | ErrorEmbeddable> => {
    const services = getServices();
    const filterManager = services.filterManager;
    const url = await services.getSavedAgentTracesUrlById(savedObjectId);

    try {
      const savedObject = await services.getSavedAgentTracesById(savedObjectId);
      if (!savedObject) {
        throw new Error('Saved object not found');
      }
      const indexPattern = savedObject.searchSource.getField('index');
      const { executeTriggerActions } = await this.getStartServices();
      const { AgentTracesEmbeddable: AgentTracesEmbeddableClass } = await import(
        './agent_traces_embeddable'
      );
      const flavor = savedObject.type ?? AgentTracesFlavor.Traces;
      const editUrl = services.addBasePath(`/app/agentTraces/${flavor}/${url}`);

      return new AgentTracesEmbeddableClass(
        {
          savedAgentTraces: savedObject,
          editUrl,
          editPath: url,
          filterManager,
          editable: services.capabilities.discover?.save as boolean,
          indexPatterns: indexPattern ? [indexPattern] : [],
          services,
          editApp: `agentTraces/${flavor}`,
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
   * Creates a by-value agent traces embeddable from input without a stored saved object.
   */
  public async create(
    input: AgentTracesInput,
    parent?: Container
  ): Promise<AgentTracesEmbeddable | ErrorEmbeddable> {
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
      const indexPattern = searchSource.getField('index');

      const savedAgentTraces = {
        id: input.id,
        ...input.attributes,
        searchSource,
      } as SavedAgentTraces;

      const { executeTriggerActions } = await this.getStartServices();
      const { AgentTracesEmbeddable: AgentTracesEmbeddableClass } = await import(
        './agent_traces_embeddable'
      );
      const flavor = savedAgentTraces.type;

      return new AgentTracesEmbeddableClass(
        {
          savedAgentTraces,
          editUrl: '', // by-value embeddables cannot be edited
          editPath: '',
          filterManager,
          editable: false,
          indexPatterns: indexPattern ? [indexPattern] : [],
          services,
          editApp: `agentTraces/${flavor}`,
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
