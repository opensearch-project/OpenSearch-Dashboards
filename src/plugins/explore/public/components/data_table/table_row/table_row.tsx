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

import React, { useCallback, useState, useMemo } from 'react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import {
  DocViewFilterFn,
  DocViewsRegistry,
  OpenSearchSearchHit,
} from '../../../types/doc_views_types';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExpandedTableRow } from './expanded_table_row/expanded_table_row';
import { TableRowContent } from './table_row_content';
import { isOnTracesPage } from '../table_cell/trace_utils/trace_utils';

// Create stable NOOP hook reference outside component to avoid re-renders
const NOOP_DYNAMIC_CONTEXT_HOOK = (options?: any, _shouldCleanup?: boolean): string => '';

export interface TableRowProps {
  row: OpenSearchSearchHit<Record<string, unknown>>;
  index?: number;
  columns: string[];
  dataset: IndexPattern | Dataset;
  onRemoveColumn?: (column: string) => void;
  onAddColumn?: (column: string) => void;
  onFilter?: DocViewFilterFn;
  onClose?: () => void;
  isShortDots: boolean;
  docViewsRegistry: DocViewsRegistry;
  expandedTableHeader?: string;
}

export const TableRowUI = ({
  row,
  index,
  columns,
  dataset,
  onFilter,
  onRemoveColumn,
  onAddColumn,
  onClose,
  isShortDots,
  docViewsRegistry,
  expandedTableHeader,
}: TableRowProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isExpanded, setIsExpanded] = useState(false);
  const handleExpanding = useCallback(() => setIsExpanded((prevState) => !prevState), [
    setIsExpanded,
  ]);

  const expandedContext = useMemo(() => {
    if (!isExpanded) return null;

    // Create unique ID for this document expansion
    const documentId = row._id || `row-${index}`;

    return {
      id: `document-expansion-${documentId}`,
      description: `Expanded row ${index !== undefined ? index + 1 : 'Entry'} from data table`,
      value: row._source,
      label: `Row ${index !== undefined ? index + 1 : 'Entry'}`,
      categories: ['explore', 'chat', 'dynamic'],
    };
  }, [isExpanded, index, row._source, row._id]);

  // Register dynamic context when row is expanded
  const useDynamicContext =
    services.contextProvider?.hooks?.useDynamicContext || NOOP_DYNAMIC_CONTEXT_HOOK;
  useDynamicContext(expandedContext);

  const onTracesPage = isOnTracesPage();

  return (
    <>
      <TableRowContent
        row={row}
        index={index}
        columns={columns}
        dataset={dataset}
        onFilter={onFilter}
        isShortDots={isShortDots}
        isExpanded={isExpanded}
        onToggleExpand={handleExpanding}
        isOnTracesPage={onTracesPage}
      />
      {isExpanded && (
        <ExpandedTableRow
          row={row}
          columns={columns}
          dataset={dataset}
          onFilter={onFilter}
          onRemoveColumn={onRemoveColumn}
          onAddColumn={onAddColumn}
          onClose={onClose}
          docViewsRegistry={docViewsRegistry}
          expandedTableHeader={expandedTableHeader}
        />
      )}
    </>
  );
};

export const TableRow = React.memo(TableRowUI);
