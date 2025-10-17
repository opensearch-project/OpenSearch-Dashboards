/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useSelector } from 'react-redux';
import { useFieldsList } from './use_fields_list';
import { ACTION_COLUMN_ID, SOURCE_COLUMN_ID_AND_NAME } from '../../table_constants';
import { selectVisibleColumnNames } from '../../../../application/utils/state_management/selectors';
import { getColumnIdFromFieldName } from '../../utils/get_column_id_from_field_name';
import { useDatasetContext } from '../../../../application/context';
import {
  ExploreResultsTableColumnActionsCell,
  ExploreResultsTableColumnHeader,
} from '../../columns';

const columnHelper = createColumnHelper<{ [key: string]: any }>();

export const useColumns = () => {
  const { dataset } = useDatasetContext();
  const visibleColumnNames = useSelector(selectVisibleColumnNames);
  const fieldsList = useFieldsList();
  const [columnVisibility, setColumnVisibility] = useState<{
    [columnId: string]: boolean;
  }>(
    // initially set all fields invisible for perf
    fieldsList.reduce(
      (acc, field) => ({ ...acc, [getColumnIdFromFieldName(field.name)]: false }),
      {}
    )
  );

  useEffect(() => {
    const newColumnVisibility: { [columnId: string]: boolean } = fieldsList.reduce(
      (acc, field) => ({ ...acc, [getColumnIdFromFieldName(field.name)]: false }),
      {}
    );
    for (const visibleColumnName of visibleColumnNames) {
      newColumnVisibility[getColumnIdFromFieldName(visibleColumnName)] = true;
    }
    setColumnVisibility(newColumnVisibility);
  }, [fieldsList, visibleColumnNames]);

  const columns = useMemo(
    () => [
      // Display columns
      columnHelper.display({
        id: ACTION_COLUMN_ID,
        cell: ({ row }) => <ExploreResultsTableColumnActionsCell rowId={row.id} />,
        enableColumnFilter: false,
        enableResizing: false,
        size: 64,
      }),
      ...fieldsList.map((field) => {
        const columnId = getColumnIdFromFieldName(field.name);

        if (field.type === SOURCE_COLUMN_ID_AND_NAME) {
          return columnHelper.accessor(columnId, {
            header: ({ table }) => (
              <ExploreResultsTableColumnHeader
                displayName={field.displayName}
                fieldName={field.name}
                columnId={columnId}
                isChangeable={false}
                disableHoverState={!!table.getState().columnSizingInfo.isResizingColumn}
              />
            ),
            cell: ({ row }) => JSON.stringify(row.original),
          });
        }

        if (field.name === dataset?.timeFieldName) {
          return columnHelper.accessor(columnId, {
            header: ({ table }) => (
              <ExploreResultsTableColumnHeader
                displayName="Time"
                fieldName={field.name}
                columnId={columnId}
                isChangeable={false}
                disableHoverState={!!table.getState().columnSizingInfo.isResizingColumn}
              />
            ),
            cell: (info) => info.getValue() || '',
          });
        }

        return columnHelper.accessor(columnId, {
          header: ({ table }) => (
            <ExploreResultsTableColumnHeader
              displayName={field.displayName}
              fieldName={field.name}
              columnId={columnId}
              isChangeable={true}
              disableHoverState={!!table.getState().columnSizingInfo.isResizingColumn}
            />
          ),
          cell: (info) => info.getValue() || '',
        });
      }),
    ],
    [fieldsList, dataset?.timeFieldName]
  );

  const columnOrder = useMemo(
    () => [ACTION_COLUMN_ID, ...visibleColumnNames.map(getColumnIdFromFieldName)],
    [visibleColumnNames]
  );

  return { columns, columnVisibility, columnOrder };
};
