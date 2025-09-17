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

import React, { useCallback, useState } from 'react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { useAssistantContext } from '../../../../../context_provider/public';
import {
  DocViewFilterFn,
  DocViewsRegistry,
  OpenSearchSearchHit,
} from '../../../types/doc_views_types';
import { ExpandedTableRow } from './expanded_table_row/expanded_table_row';
import { TableRowContent } from './table_row_content';

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
}: TableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleExpanding = useCallback(() => setIsExpanded((prevState) => !prevState), [
    setIsExpanded,
  ]);

  // Register context when row is expanded
  useAssistantContext(
    isExpanded
      ? {
          description: `Expanded row  ${index !== undefined ? index + 1 : 'Entry'} from data table`,
          value: row._source,
          label: `Row ${index !== undefined ? index + 1 : 'Entry'}`,
          categories: ['explore', 'chat'],
        }
      : null
  );

  return (
    <>
      <TableRowContent
        row={row}
        columns={columns}
        dataset={dataset}
        onFilter={onFilter}
        isShortDots={isShortDots}
        isExpanded={isExpanded}
        onToggleExpand={handleExpanding}
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
        />
      )}
    </>
  );
};

export const TableRow = React.memo(TableRowUI);
