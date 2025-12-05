/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SearchProps } from './explore_embeddable';
import { VisualizationNoResults } from '../../../visualizations/public';
// TODO: refactor it to now use legacy getServices
import {
  getDocViewsRegistry,
  getServices,
} from '../application/legacy/discover/opensearch_dashboards_services';
import { DataTable } from '../components/data_table/data_table';
import { TableVis } from '../components/visualizations/table/table_vis';
import { TableChartStyle } from '../components/visualizations/table/table_vis_config';
import { getLegacyDisplayedColumns } from '../helpers/data_table_helper';
import { SAMPLE_SIZE_SETTING } from '../../common';

interface ExploreEmbeddableProps {
  searchProps: SearchProps;
}

export const ExploreEmbeddableComponent = ({ searchProps }: ExploreEmbeddableProps) => {
  const services = getServices();
  const {
    expressions: { ReactExpressionRenderer },
  } = services;

  // Get docViewsRegistry for DataTable
  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);

  // Convert columns to LegacyDisplayedColumn format for DataTable
  const displayedColumns = useMemo(() => {
    if (!searchProps.columns || !searchProps.indexPattern) {
      return [];
    }
    return getLegacyDisplayedColumns(
      searchProps.columns,
      searchProps.indexPattern,
      !searchProps.displayTimeColumn,
      false // isShortDots
    );
  }, [searchProps.columns, searchProps.indexPattern, searchProps.displayTimeColumn]);

  // Get sample size from UI settings
  const sampleSize = services.uiSettings.get(SAMPLE_SIZE_SETTING);

  // Create an adapter function to convert between the two filter function signatures
  const handleFilter = useMemo(() => {
    if (!searchProps.onFilter || !searchProps.indexPattern) {
      return () => {};
    }

    return (mapping: any, value: unknown, mode: '+' | '-') => {
      // Convert FieldMapping to IFieldType
      let fieldName: string;
      if (typeof mapping === 'string') {
        fieldName = mapping;
      } else if (mapping && typeof mapping === 'object' && 'name' in mapping) {
        fieldName = mapping.name;
      } else {
        return;
      }

      const field = searchProps.indexPattern?.getFieldByName(fieldName);
      if (!field) {
        return;
      }

      // Convert value to string array
      const values = Array.isArray(value) ? value.map(String) : [String(value)];

      // Convert mode to operator
      const operator = mode === '+' ? '+' : '-';

      searchProps.onFilter!(field, values, operator);
    };
  }, [searchProps]);

  const getEmbeddableContent = () => {
    if (searchProps?.rows?.length === 0) {
      return (
        <EuiFlexItem>
          <VisualizationNoResults />
        </EuiFlexItem>
      );
    }

    if (searchProps.activeTab === 'logs') {
      return (
        <DataTable
          columns={displayedColumns}
          rows={searchProps.rows || []}
          dataset={searchProps.indexPattern!}
          hits={searchProps.hits}
          sampleSize={sampleSize}
          isShortDots={false}
          showPagination={true}
          docViewsRegistry={docViewsRegistry}
          onRemoveColumn={searchProps.onRemoveColumn}
          onAddColumn={searchProps.onAddColumn}
          onFilter={handleFilter}
        />
      );
    }

    if (searchProps.chartType === 'table') {
      return (
        <TableVis
          columns={searchProps.tableData?.columns ?? []}
          rows={searchProps.tableData?.rows ?? []}
          styleOptions={searchProps.styleOptions as TableChartStyle}
          disableActions={true}
        />
      );
    }

    return (
      <ReactExpressionRenderer
        expression={searchProps.expression ?? ''}
        searchContext={searchProps.searchContext}
        key={JSON.stringify(searchProps.searchContext) + searchProps.expression}
        onEvent={(e) => {
          searchProps.onExpressionEvent?.(e);
        }}
      />
    );
  };

  return (
    <EuiFlexGroup
      gutterSize="xs"
      direction="column"
      responsive={false}
      data-test-subj="embeddedSavedExplore"
      className="eui-xScrollWithShadows eui-yScrollWithShadows"
    >
      <EuiFlexItem style={{ minHeight: 0 }} data-test-subj="osdExploreContainer">
        {getEmbeddableContent()}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
