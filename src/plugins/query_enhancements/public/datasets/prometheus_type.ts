/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
} from '../../../data/common';
import { DatasetTypeConfig } from '../../../data/public';
import { DATASET } from '../../common';
import PROMETHEUS_ICON from '../assets/prometheus_mark.svg';

export const prometheusTypeConfig: DatasetTypeConfig = {
  id: DATASET.PROMETHEUS,
  title: 'Prometheus',
  meta: {
    icon: { type: PROMETHEUS_ICON },
    tooltip: 'Prometheus',
    searchOnLoad: false,
  },

  toDataset: (path) => {
    const connection = path[path.length - 1];
    const patternMeta = connection.meta as DataStructureCustomMeta;
    return {
      id: connection.id,
      title: connection.title,
      type: DATASET.PROMETHEUS,
      timeFieldName: patternMeta?.timeFieldName,
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
    const indexPatterns = await fetchConnections();
    return {
      ...dataStructure,
      columnHeader: 'Connections',
      children: indexPatterns,
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

const fetchConnections = async (): Promise<DataStructure[]> => {
  // TODO: fetch from saved objects (type data-connection)
  return [
    {
      id: 'my_prometheus',
      title: 'Prometheus connection 1',
      type: DATASET.PROMETHEUS,
      meta: {
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
        language: 'promql',
        timeFieldName: 'Time',
      },
    },
  ];
};
