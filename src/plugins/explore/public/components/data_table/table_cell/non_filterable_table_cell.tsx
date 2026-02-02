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
import { LogActionMenu } from '../../log_action_menu';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { useDatasetContext } from '../../../application/context';

export interface NonFilterableTableCellProps {
  colName: string;
  className: string;
  sanitizedCellValue: string;
  isTimeField: boolean;
  index?: number;
  rowData?: OpenSearchSearchHit<Record<string, unknown>>;
  columnId: string;
}

export const NonFilterableTableCell: React.FC<NonFilterableTableCellProps> = ({
  colName,
  className,
  sanitizedCellValue,
  isTimeField,
  index,
  rowData,
  columnId,
}) => {
  const { dataset } = useDatasetContext();
  return (
    <td key={colName} data-test-subj="docTableField" className={className}>
      <div className="exploreDocTableCell__content">
        {/* eslint-disable-next-line react/no-danger */}
        <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />

        {isTimeField && (
          <span className="exploreDocTableCell__filter" data-test-subj="osdDocTableCellFilter">
            {/* Add AI icon before filter buttons - show for all cells except _source */}
            {rowData?._source && columnId !== '_source' && (
              <LogActionMenu
                document={rowData._source}
                query={undefined}
                indexPattern={dataset?.title}
                metadata={{ index }}
                iconType="generate"
                size="xs"
              />
            )}
          </span>
        )}
      </div>
    </td>
  );
};
