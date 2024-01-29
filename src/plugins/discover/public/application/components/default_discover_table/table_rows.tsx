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

import React, { useState } from 'react';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import { TableCell } from './table_cell';
import { DocViewerLinks } from '../doc_viewer_links/doc_viewer_links';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { fetchSourceTypeDataCell } from '../data_grid/data_grid_table_cell_value';

export interface TableRowProps {
  row: OpenSearchSearchHit;
  columnIds: string[];
  columns: string[];
  indexPattern: IndexPattern;
  onRemoveColumn: (column: string) => void;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose: () => void;
}

export const TableRow = ({
  row,
  columnIds,
  columns,
  indexPattern,
  onRemoveColumn,
  onAddColumn,
  onFilter,
  onClose,
}: TableRowProps) => {
  const flattened = indexPattern.flattenHit(row);
  const [isExpanded, setIsExpanded] = useState(false);
  const tableRow = (
    <tr>
      <td data-test-subj="docTableExpandToggleColumn" className="osdDocTableCell__toggleDetails">
        <EuiButtonIcon
          color="text"
          onClick={() => setIsExpanded(!isExpanded)}
          iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
          aria-label="Next"
          data-test-subj="docTableExpandToggleColumn"
          className="osdDocTableCell__toggleDetails"
        />
      </td>
      {columnIds.map((columnId) => {
        const fieldInfo = indexPattern.fields.getByName(columnId);
        const fieldMapping = flattened[columnId];

        if (typeof row === 'undefined') {
          return (
            <td
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        if (fieldInfo?.type === '_source') {
          return (
            <td className="eui-textBreakAll eui-textBreakWord" data-test-subj="docTableField">
              {fetchSourceTypeDataCell(indexPattern, row, columnId, false)}
            </td>
          );
        }

        const formattedValue = indexPattern.formatField(row, columnId);
        return (
          <TableCell
            key={row._id + columnId}
            columnId={columnId}
            onFilter={onFilter}
            filterable={fieldInfo?.filterable}
            fieldMapping={fieldMapping}
            formattedValue={formattedValue}
          />
        );
      })}
    </tr>
  );

  const expandedTableRow = (
    <tr>
      <td
        style={{ borderTop: 'none', background: 'white', padding: '5px' }}
        colSpan={columnIds.length + 2}
      >
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiIcon type="folderOpen" /> <span>{columnIds.length}</span>
          </EuiFlexItem>
          <EuiFlexItem>
            <h4
              data-test-subj="docTableRowDetailsTitle"
              className="euiTitle euiTitle--xsmall"
              i18n-id="discover.docTable.tableRow.detailHeading"
              i18n-default-message="Expanded document"
            >
              Expanded document
            </h4>
          </EuiFlexItem>
          <EuiFlexItem>
            <DocViewerLinks hit={row} indexPattern={indexPattern} columns={columns} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <DocViewer
              hit={row}
              columns={columns}
              indexPattern={indexPattern}
              onRemoveColumn={(columnName: string) => {
                onRemoveColumn(columnName);
                onClose();
              }}
              onAddColumn={(columnName: string) => {
                onAddColumn(columnName);
                onClose();
              }}
              filter={(mapping, value, mode) => {
                onFilter(mapping, value, mode);
                onClose();
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </td>
    </tr>
  );

  return (
    <>
      {tableRow}
      {isExpanded && expandedTableRow}
    </>
  );
};
