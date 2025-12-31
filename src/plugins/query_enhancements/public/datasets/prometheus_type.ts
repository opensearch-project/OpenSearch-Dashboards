/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CORE_SIGNAL_TYPES,
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
} from '../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../data/public';
import { DATASET } from '../../common';
import PROMETHEUS_ICON from '../assets/prometheus_mark.svg';

export const prometheusTypeConfig: DatasetTypeConfig = {
  id: DATASET.PROMETHEUS,
  title: 'Prometheus',
  meta: {
    icon: { type: PROMETHEUS_ICON },
    tooltip: 'Prometheus',
    supportedAppNames: ['explore'],
  },

  toDataset: (path) => {
    const connection = path[path.length - 1];
    const patternMeta = connection.meta as DataStructureCustomMeta;
    return {
      id: connection.id,
      title: connection.title,
      type: DATASET.PROMETHEUS,
      language: 'PROMQL',
      timeFieldName: patternMeta?.timeFieldName || 'Time',
      signalType: CORE_SIGNAL_TYPES.METRICS,
      dataSource: connection.parent
        ? {
            id: connection.parent.id,
            title: connection.parent.title,
            type: connection.parent.type,
          }
        : undefined,
    } as Dataset;
  },

  fetch: async (services, path) => {
    const dataStructure = path[path.length - 1];
    const dataConnections = await fetchConnections(services);
    return {
      ...dataStructure,
      columnHeader: 'Connections',
      children: dataConnections,
      hasNext: false,
    };
  },

  fetchFields: async () => {
    return [
      {
        name: 'Time',
        type: 'date',
        aggregatable: true,
      },
    ];
  },

  supportedLanguages: (dataset): string[] => {
    return ['PROMQL'];
  },
};

const fetchConnections = async (services: IDataPluginServices): Promise<DataStructure[]> => {
  try {
    const response = await services.savedObjects.client.find<{
      connectionId: string;
      type: string;
      meta?: string;
    }>({ type: 'data-connection', perPage: 10000 });

    return (
      response.savedObjects
        /* {@link DataConnectionType.Prometheus} */
        .filter((so) => so.attributes.type === 'Prometheus')
        .map((so) => ({
          id: so.attributes.connectionId,
          title: so.attributes.connectionId,
          type: DATASET.PROMETHEUS,
          meta: {
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            language: 'promql',
            timeFieldName: 'Time',
            dataSourceId: so.references.find((ref) => ref.type === 'data-source')?.id,
          },
        }))
    );
  } catch (error) {
    return [];
  }
};
