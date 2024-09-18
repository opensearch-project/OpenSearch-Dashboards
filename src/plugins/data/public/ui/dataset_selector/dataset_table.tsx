/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiInMemoryTable } from '@elastic/eui';
import React from 'react';
import { DataStructure } from '../../../common';

interface DatasetTableProps {
  current: DataStructure;
  path: DataStructure[];
  index: number;
  explorerDataset: DataStructure | undefined;
  selectDataStructure: (item: DataStructure | undefined, newPath: DataStructure[]) => Promise<void>;
}

export const DatasetTable: React.FC<DatasetTableProps> = (props) => {
  const initialSelectedIds = props.explorerDataset?.id.split(',');

  return (
    <EuiInMemoryTable
      items={props.current.children || []}
      itemId="id"
      columns={[{ field: 'title', name: 'Name' }]}
      pagination
      search={{ box: { incremental: true } }}
      isSelectable
      selection={{
        onSelectionChange: (items) => {
          if (items.length === 0) {
            props.selectDataStructure(undefined, props.path.slice(0, props.index + 1));
            return;
          }
          if (!items.every((item) => item.type === items[0].type)) {
            throw new Error('All items must be of the same type');
          }
          const newItem: DataStructure = {
            id: items.map((item) => item.id).join(','),
            title: items.map((item) => item.title).join(','),
            type: items[0].type,
          };
          props.selectDataStructure(newItem, props.path.slice(0, props.index + 1));
        },
        initialSelected:
          (initialSelectedIds?.length &&
            props.current.children?.filter((item) => initialSelectedIds.includes(item.id))) ||
          [],
      }}
    />
  );
};
