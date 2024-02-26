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
import dompurify from 'dompurify';
import { TableCell } from './table_cell';
import { DocViewerLinks } from '../doc_viewer_links/doc_viewer_links';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { fetchSourceTypeDataCell } from '../data_grid/data_grid_table_cell_value';

export interface TableRowProps {
  row: OpenSearchSearchHit;
  columns: string[];
  indexPattern: IndexPattern;
  onRemoveColumn: (column: string) => void;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose: () => void;
  isShortDots: boolean;
}

export const TableRow = ({
  row,
  columns,
  indexPattern,
  onRemoveColumn,
  onAddColumn,
  onFilter,
  onClose,
  isShortDots,
}: TableRowProps) => {
  const flattened = indexPattern.flattenHit(row);
  const [isExpanded, setIsExpanded] = useState(false);
  const tableRow = (
    <tr key={row._id}>
      <td data-test-subj="docTableExpandToggleColumn" className="osdDocTableCell__toggleDetails">
        <EuiButtonIcon
          color="text"
          onClick={() => setIsExpanded(!isExpanded)}
          iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
          aria-label="Next"
          data-test-subj="docTableExpandToggleColumn"
        />
      </td>
      {columns.map((colName) => {
        const fieldInfo = indexPattern.fields.getByName(colName);
        const fieldMapping = flattened[colName];

        if (typeof row === 'undefined') {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        if (fieldInfo?.type === '_source') {
          return (
            <td
              key={colName}
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord osdDocTableCell__source"
              data-test-subj="docTableField"
            >
              <div className="truncate-by-height">
                {fetchSourceTypeDataCell(indexPattern, row, colName, false, isShortDots)}
              </div>
            </td>
          );
        }

        const formattedValue = indexPattern.formatField(row, colName);

        if (typeof formattedValue === 'undefined') {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        if (!fieldInfo?.filterable) {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <div className="truncate-by-height">
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
              </div>
            </td>
          );
        }

        return (
          <TableCell
            key={colName}
            columnId={colName}
            onFilter={onFilter}
            isTimeField={indexPattern.timeFieldName === colName}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
          />
        );
      })}
    </tr>
  );

  const expandedTableRow = (
    <tr key={'x' + row._id}>
      <td className="osdDocTable__detailsParent" colSpan={columns.length + 1}>
        <EuiFlexGroup gutterSize="m" alignItems="center">
          <EuiFlexItem grow={false} className="osdDocTable__detailsIconContainer">
            <EuiIcon type="folderOpen" />
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
        <EuiFlexGroup gutterSize="m">
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
