/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTable, EuiFieldSearch, EuiLink, EuiText } from '@elastic/eui';
import React, { useRef, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { DataStructure } from '../../../common';
import { DataStructureFetchOptions } from '../../query/query_string/dataset_service';
import { getQueryService } from '../../services';

interface DatasetTableProps {
  path: DataStructure[];
  setPath: (newPath: DataStructure[]) => void;
  index: number;
  explorerDataset: DataStructure | undefined;
  selectDataStructure: (item: DataStructure | undefined, newPath: DataStructure[]) => Promise<void>;
  fetchNextDataStructure: (
    nextPath: DataStructure[],
    dataType: string,
    options?: DataStructureFetchOptions
  ) => Promise<DataStructure>;
}

export const DatasetTable: React.FC<DatasetTableProps> = (props) => {
  const datasetService = getQueryService().queryString.getDatasetService();
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const initialSelectedIds = props.explorerDataset?.id.split(',');
  const dataStructures = props.path[props.index].children || [];
  const paginationToken = props.path[props.index].paginationToken;

  const onTableChange = async (options: DataStructureFetchOptions) => {
    const typeConfig = datasetService.getType(props.path[1].id);
    if (!typeConfig) return;

    setLoading(true);
    await props
      .fetchNextDataStructure(props.path, typeConfig.id, options)
      .then((newDataStructure) => {
        props.setPath([...props.path.slice(0, props.index), newDataStructure]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="datasetTable">
      <EuiFieldSearch
        fullWidth
        inputRef={(node) => (searchRef.current = node)}
        onSearch={(value) => onTableChange({ search: value })}
      />

      <EuiBasicTable
        items={dataStructures}
        itemId="id"
        columns={[{ field: 'title', name: 'Name' }]}
        loading={loading}
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
              dataStructures?.filter((item) => initialSelectedIds.includes(item.id))) ||
            [],
        }}
      />

      {paginationToken && (
        <div className="datasetTable__loadMore">
          <EuiLink
            onClick={() => onTableChange({ paginationToken, search: searchRef.current?.value })}
          >
            <EuiText size="s">
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.loadMore"
                defaultMessage="Load more"
              />
            </EuiText>
          </EuiLink>
        </div>
      )}
    </div>
  );
};
