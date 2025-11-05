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

import React from 'react';

export interface NonFilterableTableCellProps {
  colName: string;
  className: string;
  sanitizedCellValue: string;
}

export const NonFilterableTableCell: React.FC<NonFilterableTableCellProps> = ({
  colName,
  className,
  sanitizedCellValue,
}) => {
  return (
    <td key={colName} data-test-subj="docTableField" className={className}>
      <div className="truncate-by-height">
        {/* eslint-disable-next-line react/no-danger */}
        <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
      </div>
    </td>
  );
};
