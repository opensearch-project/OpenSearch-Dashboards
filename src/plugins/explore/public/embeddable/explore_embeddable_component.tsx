/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLoadingChart } from '@elastic/eui';
import { SearchProps } from './explore_embeddable';
import { VisualizationNoResults, VisualizationRequestError } from '../../../visualizations/public';
// TODO: refactor it to now use legacy getServices
import {
  getDocViewsRegistry,
  getServices,
} from '../application/legacy/discover/opensearch_dashboards_services';
import { DataTable } from '../components/data_table/data_table';
import { TableVis } from '../components/visualizations/table/table_vis';
import { TableChartStyle } from '../components/visualizations/table/table_vis_config';
import { processDisplayedColumns } from '../helpers/use_displayed_columns';
import { SAMPLE_SIZE_SETTING } from '../../common';

/** How many rows carry each field, as Discover counts them for its fields list. */
const getFieldCounts = (rows: any[], indexPattern: NonNullable<SearchProps['indexPattern']>) => {
  const fieldCounts: Record<string, number> = {};
  for (const row of rows) {
    const flattened =
      typeof indexPattern.flattenHit === 'function'
        ? indexPattern.flattenHit(row)
        : (row?._source ?? {});
    for (const fieldName of Object.keys(flattened)) {
      fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
    }
  }
  return fieldCounts;
};

interface ExploreEmbeddableProps {
  searchProps: SearchProps;
}

export const ExploreEmbeddableComponent = ({ searchProps }: ExploreEmbeddableProps) => {
  const services = getServices();

  // Get docViewsRegistry for DataTable
  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);

  // Process the saved columns the way Discover's table does: drop columns that neither the
  // dataset nor the returned rows have, falling back to _source, so a panel never shows only "-".
  // The embeddable updates one searchProps object in place and renders it again, so the memo
  // depends on the fields it reads, not on the object.
  const { columns, indexPattern, rows } = searchProps;
  const displayedColumns = useMemo(() => {
    if (!columns || !indexPattern) {
      return [];
    }
    return processDisplayedColumns(
      columns,
      indexPattern,
      services.uiSettings,
      rows?.length ? { fieldCounts: getFieldCounts(rows, indexPattern) } : undefined
    );
  }, [columns, indexPattern, rows, services.uiSettings]);

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
    if (searchProps?.error) {
      return (
        <EuiFlexItem>
          <VisualizationRequestError
            error={searchProps.error.message || searchProps.error.name || 'An error occurred'}
          />
        </EuiFlexItem>
      );
    }

    // Nothing to show until the first run settles; "No results found" only once one returned none.
    // A refresh keeps the previous rows on screen while it runs.
    if (searchProps?.isLoading && !searchProps.rows?.length) {
      return (
        <EuiFlexGroup
          justifyContent="center"
          alignItems="center"
          responsive={false}
          data-test-subj="exploreEmbeddableLoading"
        >
          <EuiFlexItem grow={false}>
            <EuiLoadingChart size="xl" />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

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
          variables={searchProps.variables}
          disableActions={true}
        />
      );
    }

    if (searchProps.chartRender) {
      return searchProps.chartRender();
    }

    return null;
  };

  return (
    <EuiFlexGroup
      gutterSize="xs"
      direction="column"
      responsive={false}
      data-test-subj="embeddedSavedExplore"
      style={{ overflowX: 'auto' }}
    >
      <EuiFlexItem style={{ minHeight: 0 }} data-test-subj="osdExploreContainer">
        {getEmbeddableContent()}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
