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

export interface EmptyTableCellProps {
  colName: string;
}

export const EmptyTableCell: React.FC<EmptyTableCellProps> = ({ colName }) => {
  return (
    <td
      key={colName}
      data-test-subj="docTableField"
      className="exploreDocTableCell eui-textBreakAll eui-textBreakWord"
    >
      <span>-</span>
    </td>
  );
};
