/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, ExampleValue, DetailSectionConfig } from '../field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';

/**
 * Query function to fetch example values
 */
const getExamplesQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | head 10
    | fields \`${fieldName}\`
    | where isnotnull(\`${fieldName}\`)`;
};

/**
 * Component to display example values
 */
interface ExamplesSectionProps {
  data: ExampleValue[];
  field: FieldStatsItem;
}

const ExamplesSection: React.FC<ExamplesSectionProps> = ({ data, field }) => {
  const columns: Array<EuiBasicTableColumn<ExampleValue>> = [
    {
      field: 'value',
      name: i18n.translate('explore.fieldStats.examples.exampleValuesColumnLabel', {
        defaultMessage: 'Example Values',
      }),
      render: (value: any) => {
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return String(value);
      },
    },
  ];

  return (
    <EuiBasicTable items={data} columns={columns} compressed data-test-subj="examplesSection" />
  );
};

/**
 * Examples Detail Section Configuration
 * Displays example values pulled from the first available documents
 */
export const examplesDetailConfig: DetailSectionConfig<ExampleValue[]> = {
  id: 'examples',
  title: i18n.translate('explore.fieldStats.examples.sectionTitle', {
    defaultMessage: 'Examples',
  }),
  applicableToTypes: ['geo_point', 'geo_shape', 'binary', 'object'],
  fetchData: async (fieldName, dataset, services) => {
    const query = getExamplesQuery(dataset.title, fieldName);
    const result = await executeFieldStatsQuery(services, query, dataset.id || '', dataset.type);

    const hits = result?.hits?.hits || [];
    return hits
      .map((hit: any) => {
        const source = hit._source || {};
        return {
          value: source[fieldName],
        };
      })
      .filter((example: any) => example.value !== undefined && example.value !== null);
  },
  component: ExamplesSection,
};
