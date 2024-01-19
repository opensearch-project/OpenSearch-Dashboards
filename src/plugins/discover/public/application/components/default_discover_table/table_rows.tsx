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

import React, { useState, useMemo, useCallback } from 'react';
import { TableCell } from './table_cell';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';

export const TableRow = ({
    row,
    columns,
    indexPattern
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    console.log("row", row)
    const tableRow = (
        <tr>  
        <td data-test-subj="docTableExpandToggleColumn" className="osdDocTableCell__toggleDetails">
            <EuiButtonIcon
                color="text"
                onClick={() => setIsExpanded(!isExpanded)}
                iconType={isExpanded?"arrowDown":"arrowRight"}
                aria-label="Next"
                data-test-subj="docTableExpandToggleColumn" 
                className="osdDocTableCell__toggleDetails"
            />
        </td>
            {columns.map((column) => {
                return (
                        <TableCell
                            key={row._id+column.id}
                            column={column}
                            row={row}
                            indexPattern={indexPattern}
                        />
                )
            })}
    </tr>
    );
    console.log("columns size", columns)

    const expandedTableRow = (
        <tr>
            <td style={{'borderTop':'none', 'background':'red'}} colSpan={columns.length + 2}>
                <EuiFlexGroup>
                   <EuiFlexItem>  
                        <EuiIcon type="folderOpen"/> <span>{columns.size}</span>
                    </EuiFlexItem>
                    <EuiFlexItem>
                        <h4
                            data-test-subj="docTableRowDetailsTitle"
                            className="euiTitle euiTitle--xsmall"
                            i18n-id="discover.docTable.tableRow.detailHeading"
                            i18n-default-message="Expanded document"
                        >Expanded document</h4>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </td>
        </tr>
    );

    return (
        <>
        {tableRow}
        {isExpanded&&expandedTableRow}
        </>
    )
}