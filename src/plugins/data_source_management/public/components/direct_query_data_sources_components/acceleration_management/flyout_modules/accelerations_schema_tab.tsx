/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiInMemoryTable, EuiTableFieldDataColumnType } from '@elastic/eui';
import React from 'react';

interface AccelerationSchemaTabProps {
  mappings: object;
  indexInfo: object;
}

export const AccelerationSchemaTab = ({ mappings, indexInfo }: AccelerationSchemaTabProps) => {
  const indexName = indexInfo.data[0]?.index;
  const indexData = mappings.data[indexName]?.mappings._meta?.indexedColumns;
  const indexType = mappings.data[indexName]?.mappings._meta?.kind;
  const isSkippingIndex = indexType === 'skipping';

  const items =
    indexData?.map((column: { columnName: string; columnType: string; kind: string }) => ({
      columns_name: column.columnName,
      data_type: column.columnType,
      acceleration_type: column.kind,
    })) || [];

  const columns = [
    {
      field: 'columns_name',
      name: 'Column name',
    },
    {
      field: 'data_type',
      name: 'Data type',
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  if (isSkippingIndex) {
    columns.push({
      field: 'acceleration_type',
      name: 'Acceleration index type',
    });
  }

  return (
    <>
      <EuiInMemoryTable items={items} columns={columns} />
    </>
  );
};
